import { create } from 'zustand';
import type { SNLGameState, SNLPlayer } from './types';
import { SNL_PLAYER_COLORS } from './constants';
import { generateSNLLayout, buildLayoutLookup } from './generator';
import { playDice, playMove, playSnake, playLadder, playWin } from '../../lib/sound';
import { haptics } from '../../lib/haptics';
import { save, clear, load } from '../../lib/persist';
import { STORAGE_KEYS } from '../../lib/gameSaves';

interface SNLStore extends SNLGameState {
  initGame: (playerCount: number, playerNames?: string[], isCPUFlags?: boolean[], playerColors?: string[]) => void;
  rollDice: () => void;
  resetGame: () => void;
}

const persistedSNL = load<SNLGameState | null>(STORAGE_KEYS.SNL, null);
const initialSNL: SNLGameState = persistedSNL && persistedSNL.players.length > 0 && persistedSNL.layout?.length
  ? { ...persistedSNL, isRolling: false }
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
    };

export const useSNLStore = create<SNLStore>((set, get) => ({
  ...initialSNL,

  initGame: (playerCount: number, playerNames?: string[], isCPUFlags?: boolean[], playerColors?: string[]) => {
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
    });
  },

  rollDice: () => {
    const state = get();
    if (state.hasRolled || state.gamePhase !== 'rolling') return;

    const diceValue = Math.floor(Math.random() * 6) + 1;
    const currentPlayer = state.players[state.currentPlayerIndex];
    const currentPos = currentPlayer.position;

    playDice();
    haptics.diceRoll();

    set({ diceValue, isRolling: true, hasRolled: true, gamePhase: 'rolling' });

    // House rule: a player at position 0 has to roll a 1 to enter the
    // board. Every other roll just passes the turn.
    const needsEntry = currentPos === 0 && diceValue !== 1;

    setTimeout(() => {
      set({ isRolling: false, gamePhase: 'moving' });

      if (needsEntry) {
        const nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
        setTimeout(() => {
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

      // Position-0 player rolling a 1 lands on cell 1.
      let newPos = currentPos === 0 ? 1 : currentPos + diceValue;
      let actionMessage = '';

      // Overshoot 100 — stay put (need exact roll).
      if (newPos > 100) {
        newPos = currentPos;
        actionMessage = `Need exact roll · stayed at ${currentPos}`;
      }

      // Reached exactly 100 — win.
      if (newPos === 100) {
        const updatedPlayers = [...state.players];
        updatedPlayers[state.currentPlayerIndex] = { ...currentPlayer, position: 100 };
        playWin();
        haptics.win();
        setTimeout(() => {
          set({
            players: updatedPlayers,
            gamePhase: 'finished',
            winner: updatedPlayers[state.currentPlayerIndex],
            message: `🏆 ${currentPlayer.name} wins!`,
            lastAction: `${currentPlayer.name} reached 100!`,
          });
        }, 600);
        return;
      }

      // Snake or ladder at the landing cell? Look up against the per-game
      // layout instead of any module-level constant.
      const lookup = buildLayoutLookup(state.layout);
      const specialTarget = lookup[newPos];
      let finalPos = newPos;
      if (specialTarget !== undefined) {
        const entity = state.layout.find(s => s.from === newPos);
        if (entity) {
          actionMessage = entity.type === 'ladder'
            ? `🪜 Climbed ${newPos} → ${specialTarget}`
            : `🐍 Snake! ${newPos} → ${specialTarget}`;
          finalPos = specialTarget;
        }
      }

      playMove();
      if (!actionMessage) {
        actionMessage = currentPos === 0 ? 'Entered the board' : `Moved to ${newPos}`;
      }

      const updatedPlayers = [...state.players];
      updatedPlayers[state.currentPlayerIndex] = { ...currentPlayer, position: newPos };

      // Pass turn to the next player. Per house rule there is NO bonus turn
      // on a 6 in Snakes & Ladders.
      const advanceTurn = () => {
        const nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
        set({
          currentPlayerIndex: nextIdx,
          diceValue: null,
          hasRolled: false,
          gamePhase: 'rolling',
          message: `${state.players[nextIdx].name}'s turn — Tap the dice to roll!`,
        });
      };

      setTimeout(() => {
        set({
          players: [...updatedPlayers],
          lastAction: actionMessage,
          message: `${currentPlayer.name}: ${actionMessage}`,
        });

        if (finalPos !== newPos) {
          const isLadder = finalPos > newPos;
          if (isLadder) playLadder(); else { playSnake(); haptics.capture(); }
          setTimeout(() => {
            const players2 = [...get().players];
            players2[state.currentPlayerIndex] = { ...players2[state.currentPlayerIndex], position: finalPos };
            set({ players: players2 });
            setTimeout(advanceTurn, 400);
          }, 600);
        } else {
          setTimeout(advanceTurn, 800);
        }
      }, 500);
    }, 800);
  },

  resetGame: () => {
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
  };
  save(STORAGE_KEYS.SNL, snapshot);
});
