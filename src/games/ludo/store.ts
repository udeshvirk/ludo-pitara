import { create } from 'zustand';
import type {
  LudoGameState,
  LudoGameOptions,
  Player,
  Token,
  PlayerColor,
} from './types';
import {
  PLAYER_ORDER,
  YARD_POSITIONS,
  isSafePosition,
  getBoardPosition,
} from './constants';
import { playDice, playMove, playCapture, playHomeArrival, playWin } from '../../lib/sound';
import { haptics } from '../../lib/haptics';
import { save, clear, load } from '../../lib/persist';
import { STORAGE_KEYS } from '../../lib/gameSaves';

interface LudoStore extends LudoGameState {
  initGame: (
    playerCount: number,
    playerNames?: string[],
    customPlayers?: {name: string, color: PlayerColor, isCPU?: boolean}[],
    options?: LudoGameOptions,
  ) => void;
  rollDice: () => void;
  selectToken: (tokenId: string) => void;
  resetGame: () => void;
}

const DEFAULT_LUDO_OPTIONS: LudoGameOptions = {
  oneTokenOut: false,
  firstHomeWins: false,
};

function createPlayer(name: string, color: PlayerColor, isCPU = false, oneTokenOut = false): Player {
  return {
    id: color,
    name,
    color,
    tokens: Array.from({ length: 4 }, (_, i) => ({
      id: `${color}-${i}`,
      color,
      // With "one token out" the first slot starts already on the path.
      state: (oneTokenOut && i === 0 ? 'active' : 'yard') as Token['state'],
      pathIndex: oneTokenOut && i === 0 ? 0 : -1,
    })),
    finishOrder: 0,
    isCPU,
  };
}

function getSelectableTokens(diceValue: number, player: Player): string[] {
  if (diceValue === 0) return [];
  const selectable: string[] = [];

  for (const token of player.tokens) {
    if (token.state === 'home') continue;

    if (token.state === 'yard') {
      if (diceValue === 6) {
        selectable.push(token.id);
      }
    } else {
      const newIndex = token.pathIndex + diceValue;
      if (newIndex <= 56) {
        selectable.push(token.id);
      }
    }
  }
  return selectable;
}

function findNextActivePlayer(currentIndex: number, players: Player[]): number {
  let next = (currentIndex + 1) % players.length;
  let attempts = 0;
  while (players[next].finishOrder > 0 && attempts < players.length) {
    next = (next + 1) % players.length;
    attempts++;
  }
  return next;
}

// Generation counter — every rollDice / selectToken / resetGame bumps
// it. Any in-flight setTimeout chain captures the gen at start and
// bails if a reset (or a fresh action) supersedes it. Without this,
// a Reset mid-walk would race with the pending timeouts and clobber
// the freshly-cleared state.
let actionGen = 0;
const startAction = () => ++actionGen;
const stillCurrent = (myGen: number) => myGen === actionGen;

// Pull a saved game (or fall back to a fresh setup state) on store creation.
const persisted = load<LudoGameState | null>(STORAGE_KEYS.LUDO, null);
const initialState: LudoGameState = persisted && persisted.players.length > 0
  ? {
      ...persisted,
      isRolling: false,
      flyingCaptures: [],
      // Older saves predate options — fill so reads are always safe.
      options: persisted.options ?? DEFAULT_LUDO_OPTIONS,
    }
  : {
      players: [],
      currentPlayerIndex: 0,
      diceValue: null,
      isRolling: false,
      hasRolled: false,
      consecutiveSixes: 0,
      gamePhase: 'setup',
      winner: null,
      message: 'Set up your game!',
      selectableTokenIds: [],
      flyingCaptures: [],
      options: DEFAULT_LUDO_OPTIONS,
    };

export const useLudoStore = create<LudoStore>((set, get) => ({
  ...initialState,

  initGame: (playerCount, playerNames, customPlayers, options) => {
    const opts = options ?? DEFAULT_LUDO_OPTIONS;
    let players: Player[] = [];
    if (customPlayers) {
      players = customPlayers.map(cp => createPlayer(cp.name, cp.color, cp.isCPU, opts.oneTokenOut));
    } else {
      const colors = PLAYER_ORDER[playerCount];
      players = colors.map((color, i) => {
        const name = playerNames?.[i] || `Player ${i + 1}`;
        return createPlayer(name, color, false, opts.oneTokenOut);
      });
    }

    set({
      players,
      currentPlayerIndex: 0,
      diceValue: null,
      isRolling: false,
      hasRolled: false,
      consecutiveSixes: 0,
      gamePhase: 'rolling',
      winner: null,
      message: `${players[0].name}'s turn — Tap the dice to roll!`,
      selectableTokenIds: [],
      options: opts,
    });
  },

  rollDice: () => {
    const state = get();
    if (state.hasRolled || state.gamePhase !== 'rolling') return;

    const myGen = startAction();
    const diceValue = Math.floor(Math.random() * 6) + 1;
    const currentPlayer = state.players[state.currentPlayerIndex];

    playDice();
    haptics.diceRoll();

    // Only set the dice value so the 3D dice can animate to the face
    set({ diceValue, isRolling: true, hasRolled: true, gamePhase: 'rolling' });

    // Wait for the 3D dice to finish its "settle" animation (800ms) before continuing logic
    setTimeout(() => {
      if (!stillCurrent(myGen)) return;
      // Re-fetch state in case it changed
      const currentState = get();
      
      // Turn off rolling animation state
      set({ isRolling: false });

      if (diceValue === 6 && currentState.consecutiveSixes >= 2) {
        const nextPlayerIndex = findNextActivePlayer(currentState.currentPlayerIndex, currentState.players);
        const nextPlayer = currentState.players[nextPlayerIndex];
        set({
          consecutiveSixes: 0,
          message: `Three 6s! ${currentPlayer.name} loses their turn!`,
        });

      setTimeout(() => {
        if (!stillCurrent(myGen)) return;
        set({
          currentPlayerIndex: nextPlayerIndex,
          diceValue: null,
          hasRolled: false,
          gamePhase: 'rolling',
          message: `${nextPlayer.name}'s turn — Tap the dice to roll!`,
          selectableTokenIds: [],
        });
      }, 700);
      return;
    }

      // Check selectable tokens
      const selectableTokens = getSelectableTokens(diceValue, currentPlayer);

      if (selectableTokens.length === 0) {
        // No valid moves
        const nextPlayerIndex = findNextActivePlayer(currentState.currentPlayerIndex, currentState.players);
        const nextPlayer = currentState.players[nextPlayerIndex];
        set({
          consecutiveSixes: 0,
          message: `${currentPlayer.name} rolled ${diceValue} — No valid moves!`,
          selectableTokenIds: [],
        });

      setTimeout(() => {
        if (!stillCurrent(myGen)) return;
        set({
          currentPlayerIndex: nextPlayerIndex,
          diceValue: null,
          hasRolled: false,
          gamePhase: 'rolling',
          message: `${nextPlayer.name}'s turn — Tap the dice to roll!`,
          selectableTokenIds: [],
        });
      }, 700);
      return;
    }

      // If only one token can move, auto-select it
      if (selectableTokens.length === 1) {
        set({
          consecutiveSixes: diceValue === 6 ? currentState.consecutiveSixes + 1 : 0,
          gamePhase: 'moving',
          message: `${currentPlayer.name} rolled ${diceValue}!`,
          selectableTokenIds: selectableTokens,
        });

      // Auto-move after a brief delay
      setTimeout(() => {
        if (!stillCurrent(myGen)) return;
        get().selectToken(selectableTokens[0]);
      }, 400);
      return;
    }

      set({
        consecutiveSixes: diceValue === 6 ? currentState.consecutiveSixes + 1 : 0,
        gamePhase: 'selecting',
        message: `${currentPlayer.name} rolled ${diceValue} — Select a token to move!`,
        selectableTokenIds: selectableTokens,
      });
    }, 800); // end of dice settle delay
  },

  selectToken: (tokenId: string) => {
    const state = get();
    if (!state.selectableTokenIds.includes(tokenId)) return;
    if (!state.diceValue) return;

    const currentPlayer = state.players[state.currentPlayerIndex];
    const tokenIndex = currentPlayer.tokens.findIndex(t => t.id === tokenId);
    if (tokenIndex === -1) return;

    const token = currentPlayer.tokens[tokenIndex];
    const diceValue = state.diceValue;
    const fromYard = token.state === 'yard';
    const startIndex = token.pathIndex;
    const finalIndex = fromYard ? 0 : Math.min(startIndex + diceValue, 56);
    const finalTokenState: Token['state'] = !fromYard && finalIndex >= 56 ? 'home' : 'active';
    // Yard exits are a single jump (yard → start cell). Path moves walk
    // one cell at a time so framer-motion's layoutId doesn't tween in a
    // straight diagonal across path corners.
    const stepsCount = fromYard ? 1 : finalIndex - startIndex;

    const myGen = startAction();

    // Block roll/select while the token walks.
    set({ gamePhase: 'moving', selectableTokenIds: [] });
    playMove();

    let step = 0;
    const advance = () => {
      if (!stillCurrent(myGen)) return;
      step++;
      const intermediateIndex = fromYard ? 0 : startIndex + step;
      set(s => {
        const ps = [...s.players];
        const me = { ...ps[state.currentPlayerIndex], tokens: [...ps[state.currentPlayerIndex].tokens] };
        me.tokens[tokenIndex] = { ...me.tokens[tokenIndex], pathIndex: intermediateIndex, state: 'active' };
        ps[state.currentPlayerIndex] = me;
        return { players: ps };
      });
      if (step < stepsCount) {
        setTimeout(advance, 90);
      } else {
        // Brief settle pause so the last cell visibly registers before
        // capture/turn-end side effects fire.
        setTimeout(() => { if (stillCurrent(myGen)) completeMove(); }, 120);
      }
    };
    advance();

    function completeMove() {
      const s = get();
      const players = s.players.map(p => ({ ...p, tokens: [...p.tokens] }));
      const me = players[state.currentPlayerIndex];

      // Promote the token to its final state (home if applicable).
      me.tokens[tokenIndex] = {
        ...me.tokens[tokenIndex],
        pathIndex: finalIndex,
        state: finalTokenState,
      };
      if (finalTokenState === 'home') playHomeArrival();

      // Capture detection — only on main path, not home stretch, not safe squares.
      let gotCapture = false;
      let capturedMessage = '';
      const flyingCaptures: import('./types').CaptureFly[] = [];
      if (finalTokenState === 'active' && finalIndex < 51 && !isSafePosition(currentPlayer.color, finalIndex)) {
        const newBoardPos = getBoardPosition(currentPlayer.color, finalIndex);
        for (let pi = 0; pi < players.length; pi++) {
          if (players[pi].color === currentPlayer.color) continue;
          for (let ti = 0; ti < players[pi].tokens.length; ti++) {
            const otherToken = players[pi].tokens[ti];
            if (otherToken.state !== 'active') continue;
            const otherPos = getBoardPosition(otherToken.color, otherToken.pathIndex);
            if (otherPos.row === newBoardPos.row && otherPos.col === newBoardPos.col) {
              // Capture: token goes back to yard. We also stash a fly
              // entry so the board can render an arc from this cell to
              // the yard socket while the yard render skips it.
              const yardPos = YARD_POSITIONS[otherToken.color][ti];
              flyingCaptures.push({
                tokenId: otherToken.id,
                color: otherToken.color,
                from: otherPos,
                to: yardPos,
              });
              players[pi].tokens[ti] = { ...otherToken, state: 'yard', pathIndex: -1 };
              gotCapture = true;
              capturedMessage = ` — Captured ${players[pi].name}'s token!`;
            }
          }
        }
        if (gotCapture) {
          playCapture();
          haptics.capture();
          // Kick off the arc immediately. Subsequent set() calls in
          // this completeMove preserve flyingCaptures (Zustand merges),
          // so the floating tokens stay airborne while the rest of the
          // turn-end state emits. A timeout clears the list once the
          // arc has landed.
          set({ flyingCaptures });
          setTimeout(() => {
            if (!stillCurrent(myGen)) return;
            set({ flyingCaptures: [] });
          }, 520);
        }
      }

      // "First home wins" short-circuit — the moment a player lands a
      // single token in home, they win. Skip the all-four-tokens check
      // and the next-active-player rotation entirely.
      if (s.options.firstHomeWins && finalTokenState === 'home') {
        me.finishOrder = 1;
        playWin();
        haptics.win();
        set({
          players,
          gamePhase: 'finished',
          winner: me,
          message: `🏆 ${me.name} wins!`,
          selectableTokenIds: [],
        });
        return;
      }

      // Finish check
      if (me.tokens.every(t => t.state === 'home')) {
        const finishCount = players.filter(p => p.finishOrder > 0).length;
        me.finishOrder = finishCount + 1;
      }

      const gotSix = diceValue === 6;
      const reachedHome = finalTokenState === 'home';
      const bonusTurn = gotSix || reachedHome || gotCapture;

      // Game over
      if (me.finishOrder && players.filter(p => p.finishOrder === 0).length <= 1) {
        playWin();
        haptics.win();
        set({
          players,
          gamePhase: 'finished',
          winner: me,
          message: `🏆 ${me.name} wins!`,
          selectableTokenIds: [],
        });
        return;
      }

      if (me.finishOrder) {
        const nextPlayerIndex = findNextActivePlayer(state.currentPlayerIndex, players);
        set({
          players,
          currentPlayerIndex: nextPlayerIndex,
          gamePhase: 'rolling',
          diceValue: null,
          hasRolled: false,
          consecutiveSixes: 0,
          message: `${me.name} finished! 🏆 ${players[nextPlayerIndex].name}'s turn!`,
          selectableTokenIds: [],
        });
        return;
      }

      if (bonusTurn) {
        set({
          players,
          gamePhase: 'rolling',
          diceValue: null,
          hasRolled: false,
          // Only count six-streak if it WAS a six. Captures and reach-home
          // grant a bonus turn but should reset the six-streak counter.
          consecutiveSixes: gotSix ? state.consecutiveSixes : 0,
          message: `${currentPlayer.name}${capturedMessage || (reachedHome ? ' reached home!' : ' rolled 6!')} Bonus turn!`,
          selectableTokenIds: [],
        });
      } else {
        const nextPlayerIndex = findNextActivePlayer(state.currentPlayerIndex, players);
        const nextPlayer = players[nextPlayerIndex];
        set({ players, gamePhase: 'rolling', selectableTokenIds: [] });
        setTimeout(() => {
          if (!stillCurrent(myGen)) return;
          set({
            currentPlayerIndex: nextPlayerIndex,
            diceValue: null,
            hasRolled: false,
            consecutiveSixes: 0,
            message: `${nextPlayer.name}'s turn — Tap the dice to roll!`,
          });
        }, 600);
      }
    }
  },

  resetGame: () => {
    // Invalidate any in-flight walk/dice timeouts so they can't write
    // stale state on top of the fresh setup we're about to install.
    startAction();
    clear(STORAGE_KEYS.LUDO);
    set({
      players: [],
      currentPlayerIndex: 0,
      diceValue: null,
      isRolling: false,
      hasRolled: false,
      consecutiveSixes: 0,
      gamePhase: 'setup',
      winner: null,
      message: 'Set up your game!',
      selectableTokenIds: [],
      flyingCaptures: [],
      options: DEFAULT_LUDO_OPTIONS,
    });
  },
}));

// Auto-persist the game on every meaningful change.
useLudoStore.subscribe((state) => {
  if (state.gamePhase === 'setup') return;
  if (state.gamePhase === 'finished') {
    clear(STORAGE_KEYS.LUDO);
    return;
  }
  const snapshot: LudoGameState = {
    players: state.players,
    currentPlayerIndex: state.currentPlayerIndex,
    diceValue: state.diceValue,
    isRolling: false,
    hasRolled: state.hasRolled,
    consecutiveSixes: state.consecutiveSixes,
    gamePhase: state.gamePhase,
    winner: state.winner,
    message: state.message,
    selectableTokenIds: state.selectableTokenIds,
    // Transient — never persist a half-finished arc.
    flyingCaptures: [],
    options: state.options,
  };
  save(STORAGE_KEYS.LUDO, snapshot);
});
