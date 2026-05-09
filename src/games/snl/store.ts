import { create } from 'zustand';
import type { SNLGameState, SNLGameOptions, SNLPlayer } from './types';
import { SNL_PLAYER_COLORS } from './constants';
import { generateSNLLayout, buildLayoutLookup } from './generator';
import { playDice, playMove, playSnake, playLadder, playWin } from '../../lib/sound';
import { haptics } from '../../lib/haptics';
import { save, clear, load } from '../../lib/persist';
import { STORAGE_KEYS } from '../../lib/gameSaves';

interface SNLStore extends SNLGameState {
  initGame: (
    playerCount: number,
    playerNames?: string[],
    isCPUFlags?: boolean[],
    playerColors?: string[],
    options?: SNLGameOptions,
  ) => void;
  rollDice: () => void;
  resetGame: () => void;
}

const DEFAULT_SNL_OPTIONS: SNLGameOptions = { autoStart: false };

// See LudoStore for rationale — every roll/walk/reset bumps this so any
// in-flight setTimeout chain can short-circuit if it's been superseded.
let actionGen = 0;
const startAction = () => ++actionGen;
const stillCurrent = (myGen: number) => myGen === actionGen;

const persistedSNL = load<SNLGameState | null>(STORAGE_KEYS.SNL, null);
const initialSNL: SNLGameState = persistedSNL && persistedSNL.players.length > 0 && persistedSNL.layout?.length
  ? {
      ...persistedSNL,
      isRolling: false,
      sliding: null,
      // Walk state is purely transient — never resume mid-walk.
      walkingPlayerId: null,
      // Older saves predate options — fill so reads are always safe.
      options: persistedSNL.options ?? DEFAULT_SNL_OPTIONS,
    }
  : {
      players: [],
      currentPlayerIndex: 0,
      diceValue: null,
      isRolling: false,
      hasRolled: false,
      gamePhase: 'setup',
      winner: null,
      message: 'Set up your game!',
      lastAction: '',
      layout: [],
      sliding: null,
      walkingPlayerId: null,
      options: DEFAULT_SNL_OPTIONS,
    };

export const useSNLStore = create<SNLStore>((set, get) => ({
  ...initialSNL,

  initGame: (playerCount, playerNames, isCPUFlags, playerColors, options) => {
    const players: SNLPlayer[] = Array.from({ length: playerCount }, (_, i) => ({
      id: `player-${i}`,
      name: playerNames?.[i] || `Player ${i + 1}`,
      color: playerColors?.[i] || SNL_PLAYER_COLORS[i].color,
      position: 0,
      isCPU: isCPUFlags?.[i] ?? false,
    }));

    set({
      players,
      currentPlayerIndex: 0,
      diceValue: null,
      isRolling: false,
      hasRolled: false,
      gamePhase: 'rolling',
      winner: null,
      message: `${players[0].name}'s turn — Tap the dice to roll!`,
      lastAction: '',
      // Fresh randomized board every game.
      layout: generateSNLLayout(),
      walkingPlayerId: null,
      options: options ?? DEFAULT_SNL_OPTIONS,
    });
  },

  rollDice: () => {
    const state = get();
    if (state.hasRolled || state.gamePhase !== 'rolling') return;

    const myGen = startAction();
    const diceValue = Math.floor(Math.random() * 6) + 1;
    const currentPlayer = state.players[state.currentPlayerIndex];
    const currentPos = currentPlayer.position;

    playDice();
    haptics.diceRoll();

    set({ diceValue, isRolling: true, hasRolled: true, gamePhase: 'rolling' });

    // House rule: a player at position 0 has to roll a 1 to enter the
    // board. Every other roll just passes the turn. The "autoStart"
    // option drops this guard — any roll moves the player onto the
    // board (cell == diceValue).
    const needsEntry = !state.options.autoStart && currentPos === 0 && diceValue !== 1;

    setTimeout(() => {
      if (!stillCurrent(myGen)) return;
      set({ isRolling: false, gamePhase: 'moving' });

      if (needsEntry) {
        const nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
        setTimeout(() => {
          if (!stillCurrent(myGen)) return;
          set({
            currentPlayerIndex: nextIdx,
            diceValue: null,
            hasRolled: false,
            gamePhase: 'rolling',
            lastAction: `${currentPlayer.name} needs a 1 to start`,
            message: `${state.players[nextIdx].name}'s turn — Tap the dice to roll!`,
          });
        }, 700);
        return;
      }

      // Position-0 entry: in classic rules they rolled a 1 → land on
      // cell 1. With autoStart any roll enters → land on cell `diceValue`.
      let newPos = currentPos === 0
        ? (state.options.autoStart ? diceValue : 1)
        : currentPos + diceValue;
      let actionMessage = '';

      // Overshoot 100 — stay put (need exact roll). Skip the walk and
      // pass the turn.
      if (newPos > 100) {
        newPos = currentPos;
        actionMessage = `Need exact roll · stayed at ${currentPos}`;
        set({ lastAction: actionMessage, message: `${currentPlayer.name}: ${actionMessage}` });
        setTimeout(() => { if (stillCurrent(myGen)) advanceTurn(); }, 600);
        return;
      }

      // Snake/ladder lookup at the landing cell. Resolved AFTER the walk.
      const lookup = buildLayoutLookup(state.layout);
      const specialTarget = lookup[newPos];
      let finalPos = newPos;
      let entityType: 'snake' | 'ladder' | null = null;
      if (specialTarget !== undefined) {
        const entity = state.layout.find(s => s.from === newPos);
        if (entity) {
          finalPos = specialTarget;
          entityType = entity.type;
        }
      }

      playMove();

      // Tag the walking player so the board can render it solo on
      // intermediate cells — pass-throughs don't re-stack residents
      // or flash the count badge.
      set({ walkingPlayerId: currentPlayer.id });

      // Walk one cell at a time so the token follows the board's S-curve
      // instead of cutting diagonally from currentPos to newPos. The
      // snake/ladder hop after the landing is left as a single jump on
      // purpose — that's a teleport, not a walk.
      const stepCount = newPos - currentPos;
      let step = 0;
      const walk = () => {
        if (!stillCurrent(myGen)) return;
        step++;
        const intermediatePos = currentPos + step;
        const ps = [...get().players];
        ps[state.currentPlayerIndex] = { ...ps[state.currentPlayerIndex], position: intermediatePos };
        set({ players: ps });
        if (step < stepCount) {
          setTimeout(walk, 90);
        } else {
          setTimeout(() => { if (stillCurrent(myGen)) afterWalk(); }, 180);
        }
      };

      function afterWalk() {
        // Walk has settled — clear the walking flag so the player rejoins
        // the cell-stack rendering. Subsequent set() calls preserve this
        // (Zustand merges).
        set({ walkingPlayerId: null });

        // Reached newPos — win check first.
        if (newPos === 100) {
          playWin();
          haptics.win();
          const ps = [...get().players];
          ps[state.currentPlayerIndex] = { ...ps[state.currentPlayerIndex], position: 100 };
          set({
            players: ps,
            gamePhase: 'finished',
            winner: ps[state.currentPlayerIndex],
            message: `🏆 ${currentPlayer.name} wins!`,
            lastAction: `${currentPlayer.name} reached 100!`,
          });
          return;
        }

        if (!actionMessage) {
          actionMessage = currentPos === 0 ? 'Entered the board' : `Moved to ${newPos}`;
        }
        if (entityType) {
          actionMessage = entityType === 'ladder'
            ? `🪜 Climbed ${newPos} → ${finalPos}`
            : `🐍 Snake! ${newPos} → ${finalPos}`;
        }
        set({ lastAction: actionMessage, message: `${currentPlayer.name}: ${actionMessage}` });

        if (entityType) {
          if (entityType === 'ladder') playLadder(); else { playSnake(); haptics.capture(); }
          // Slide the token along the snake body / up the ladder. The
          // sliding flag pulls the player out of cell rendering so a
          // floating motion.div can animate along the path. Once the
          // slide finishes, drop the flag and snap position to finalPos.
          const player = currentPlayer;
          set({ sliding: { playerId: player.id, fromCell: newPos, toCell: finalPos, type: entityType } });
          const slideMs = entityType === 'snake' ? 850 : 550;
          setTimeout(() => {
            if (!stillCurrent(myGen)) return;
            const ps = [...get().players];
            ps[state.currentPlayerIndex] = { ...ps[state.currentPlayerIndex], position: finalPos };
            set({ players: ps, sliding: null });
            setTimeout(() => { if (stillCurrent(myGen)) advanceTurn(); }, 350);
          }, slideMs);
        } else {
          setTimeout(() => { if (stillCurrent(myGen)) advanceTurn(); }, 600);
        }
      }

      // Pass turn to the next player. Per house rule there is NO bonus
      // turn on a 6 in Snakes & Ladders.
      function advanceTurn() {
        const nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
        set({
          currentPlayerIndex: nextIdx,
          diceValue: null,
          hasRolled: false,
          gamePhase: 'rolling',
          message: `${state.players[nextIdx].name}'s turn — Tap the dice to roll!`,
        });
      }

      walk();
    }, 800);
  },

  resetGame: () => {
    // Invalidate any in-flight roll/walk timeouts so they can't write
    // stale state on top of the fresh setup.
    startAction();
    clear(STORAGE_KEYS.SNL);
    set({
      players: [],
      currentPlayerIndex: 0,
      diceValue: null,
      isRolling: false,
      hasRolled: false,
      gamePhase: 'setup',
      winner: null,
      message: 'Set up your game!',
      lastAction: '',
      layout: [],
      sliding: null,
      walkingPlayerId: null,
      options: DEFAULT_SNL_OPTIONS,
    });
  },
}));

useSNLStore.subscribe((state) => {
  if (state.gamePhase === 'setup') return;
  if (state.gamePhase === 'finished') {
    clear(STORAGE_KEYS.SNL);
    return;
  }
  const snapshot: SNLGameState = {
    players: state.players,
    currentPlayerIndex: state.currentPlayerIndex,
    diceValue: state.diceValue,
    isRolling: false,
    hasRolled: state.hasRolled,
    gamePhase: state.gamePhase,
    winner: state.winner,
    message: state.message,
    lastAction: state.lastAction,
    layout: state.layout,
    // Sliding / walking are purely transient — never persist mid-flight.
    sliding: null,
    walkingPlayerId: null,
    options: state.options,
  };
  save(STORAGE_KEYS.SNL, snapshot);
});
