import { create } from 'zustand';
import type {
  LudoGameState,
  LudoGameOptions,
  Player,
  Token,
  PlayerColor,
} from './types';
import { PLAYER_ORDER, TEAM_OF_SEAT, TEAM_SEATS } from './constants';
import {
  computeMoveOutcome,
  intermediatePathIndex,
  detectCaptures,
  nextFinishOrder,
} from './moves';
import { LUDO_TIMING } from './timing';
import { playDice, playMove, playCapture, playHomeArrival, playWin } from '../../lib/sound';
import { haptics } from '../../lib/haptics';
import { saveDebounced, clear, load } from '../../lib/persist';
import { STORAGE_KEYS } from '../../lib/gameSaves';

interface LudoStore extends LudoGameState {
  initGame: (
    playerCount: number,
    playerNames?: string[],
    customPlayers?: {name: string, color: PlayerColor, displayColor: PlayerColor, isCPU?: boolean}[],
    options?: LudoGameOptions,
  ) => void;
  rollDice: () => void;
  selectToken: (tokenId: string) => void;
  resetGame: () => void;
}

const DEFAULT_LUDO_OPTIONS: LudoGameOptions = {
  oneTokenOut: false,
  firstHomeWins: false,
  cpuDifficulty: 'medium',
  partners: false,
};

function createPlayer(
  name: string,
  color: PlayerColor,
  displayColor: PlayerColor,
  isCPU = false,
  oneTokenOut = false,
  team?: 0 | 1,
): Player {
  return {
    id: color,
    name,
    color,
    displayColor,
    tokens: Array.from({ length: 4 }, (_, i) => ({
      id: `${color}-${i}`,
      color,
      displayColor,
      // With "one token out" the first slot starts already on the path.
      state: (oneTokenOut && i === 0 ? 'active' : 'yard') as Token['state'],
      pathIndex: oneTokenOut && i === 0 ? 0 : -1,
    })),
    finishOrder: 0,
    isCPU,
    lastRoll: null,
    team,
  };
}

// Partners helpers — return the players sharing a team with `player`
// (always includes `player` itself). In solo play this is just [player].
function teamPlayers(player: Player, players: Player[]): Player[] {
  if (player.team === undefined) return [player];
  return players.filter(p => p.team === player.team);
}

function getSelectableTokens(diceValue: number, player: Player, allPlayers: Player[]): string[] {
  if (diceValue === 0) return [];
  const selectable: string[] = [];
  const sources = teamPlayers(player, allPlayers);

  for (const src of sources) {
    for (const token of src.tokens) {
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
// Backfill displayColor on players/tokens persisted before the
// seat-vs-display split landed. For those saves, the player's pick
// always matched the seat, so seat → displayColor is the right fallback.
const migrated = persisted
  ? {
      ...persisted,
      players: persisted.players.map(p => ({
        ...p,
        displayColor: p.displayColor ?? p.color,
        lastRoll: p.lastRoll ?? null,
        tokens: p.tokens.map(t => ({
          ...t,
          displayColor: t.displayColor ?? t.color,
        })),
      })),
    }
  : null;
const initialState: LudoGameState = migrated && migrated.players.length > 0
  ? {
      ...migrated,
      // The persisted snapshot can have captured a mid-walk or mid-
      // select phase — there are no live setTimeout chains on reload,
      // so any non-rolling phase would soft-lock the user (dice won't
      // accept, no selectable tokens). Always snap back to the start
      // of the current player's turn.
      gamePhase: 'rolling',
      diceValue: null,
      hasRolled: false,
      consecutiveSixes: 0,
      isRolling: false,
      selectableTokenIds: [],
      flyingCaptures: [],
      movingTokenId: null,
      message: `${migrated.players[migrated.currentPlayerIndex]?.name ?? 'Player'}'s turn — Tap the dice to roll!`,
      // Merge with defaults so a save written before any new option
      // field landed (e.g. cpuDifficulty) still loads with that field
      // populated.
      options: { ...DEFAULT_LUDO_OPTIONS, ...(migrated.options ?? {}) },
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
      movingTokenId: null,
      options: DEFAULT_LUDO_OPTIONS,
    };

export const useLudoStore = create<LudoStore>((set, get) => ({
  ...initialState,

  initGame: (playerCount, playerNames, customPlayers, options) => {
    const opts = options ?? DEFAULT_LUDO_OPTIONS;
    const teamFor = (seat: PlayerColor): 0 | 1 | undefined =>
      opts.partners ? TEAM_OF_SEAT[seat] : undefined;
    const players: Player[] = customPlayers
      ? customPlayers.map(cp => createPlayer(cp.name, cp.color, cp.displayColor, cp.isCPU, opts.oneTokenOut, teamFor(cp.color)))
      : PLAYER_ORDER[playerCount].map((color, i) => {
          const name = playerNames?.[i] || `Player ${i + 1}`;
          // No explicit displayColor → seat doubles as visual (legacy
          // path; the setup screen always supplies displayColor).
          return createPlayer(name, color, color, false, opts.oneTokenOut, teamFor(color));
        });

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
      movingTokenId: null,
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

    // Stamp the rolling player's lastRoll so their pod's die "stays
    // put" on this face once the turn passes to someone else (instead
    // of falling back to 1). In partner mode, both teammate seats
    // share the team's last roll — visually they're one dice.
    const updatedPlayers = state.players.map((p, i) => {
      const sameTeam =
        currentPlayer.team !== undefined && p.team === currentPlayer.team;
      return i === state.currentPlayerIndex || sameTeam
        ? { ...p, lastRoll: diceValue }
        : p;
    });

    // Only set the dice value so the 3D dice can animate to the face
    set({ diceValue, isRolling: true, hasRolled: true, gamePhase: 'rolling', players: updatedPlayers });

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
      }, LUDO_TIMING.forfeitTurnMs);
      return;
    }

      // Check selectable tokens (spans both teammates in partner mode)
      const selectableTokens = getSelectableTokens(diceValue, currentPlayer, currentState.players);

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
      }, LUDO_TIMING.forfeitTurnMs);
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
      }, LUDO_TIMING.autoSelectMs);
      return;
    }

      set({
        consecutiveSixes: diceValue === 6 ? currentState.consecutiveSixes + 1 : 0,
        gamePhase: 'selecting',
        message: `${currentPlayer.name} rolled ${diceValue} — Select a token to move!`,
        selectableTokenIds: selectableTokens,
      });
    }, LUDO_TIMING.diceSettleMs);
  },

  selectToken: (tokenId: string) => {
    const state = get();
    if (!state.selectableTokenIds.includes(tokenId)) return;
    if (!state.diceValue) return;

    const currentPlayerIndex = state.currentPlayerIndex;
    const currentPlayer = state.players[currentPlayerIndex];
    // Partner mode: the moved token may belong to the teammate's seat
    // (Blue rolling can play Green's tokens). Find whichever team
    // player actually owns this token.
    let movingPlayerIndex = currentPlayerIndex;
    let tokenIndex = currentPlayer.tokens.findIndex(t => t.id === tokenId);
    if (tokenIndex === -1) {
      for (let i = 0; i < state.players.length; i++) {
        const p = state.players[i];
        if (p.team !== undefined && p.team === currentPlayer.team) {
          const idx = p.tokens.findIndex(t => t.id === tokenId);
          if (idx !== -1) { movingPlayerIndex = i; tokenIndex = idx; break; }
        }
      }
    }
    if (tokenIndex === -1) return;

    const movingPlayer = state.players[movingPlayerIndex];
    const token = movingPlayer.tokens[tokenIndex];
    const diceValue = state.diceValue;
    const outcome = computeMoveOutcome(token, diceValue);

    const myGen = startAction();

    // Block roll/select while the token walks. Tag the walking token so
    // the board can render it solo on intermediate cells (no re-stack
    // of resident tokens, no count-badge flash).
    set({ gamePhase: 'moving', selectableTokenIds: [], movingTokenId: tokenId });
    playMove();

    // ─── Walk: advance the token cell-by-cell ──────────────────────
    let step = 0;
    const advance = () => {
      if (!stillCurrent(myGen)) return;
      step++;
      const intermediateIndex = intermediatePathIndex(outcome, step);
      set(s => {
        const ps = [...s.players];
        const me = { ...ps[movingPlayerIndex], tokens: [...ps[movingPlayerIndex].tokens] };
        me.tokens[tokenIndex] = { ...me.tokens[tokenIndex], pathIndex: intermediateIndex, state: 'active' };
        ps[movingPlayerIndex] = me;
        return { players: ps };
      });
      if (step < outcome.stepsCount) {
        setTimeout(advance, LUDO_TIMING.cellStepMs);
      } else {
        // Brief settle pause so the last cell visibly registers before
        // capture/turn-end side effects fire.
        setTimeout(() => { if (stillCurrent(myGen)) completeMove(); }, LUDO_TIMING.walkSettleMs);
      }
    };
    advance();

    // ─── Complete: capture detect, finish check, turn rotation ─────
    function completeMove() {
      const s = get();
      // Promote the moved token to its final state.
      let players = s.players.map(p => ({ ...p, tokens: [...p.tokens] }));
      const me = players[movingPlayerIndex];
      me.tokens[tokenIndex] = {
        ...me.tokens[tokenIndex],
        pathIndex: outcome.finalIndex,
        state: outcome.finalState,
      };
      if (outcome.finalState === 'home') playHomeArrival();

      // Walk has settled — clear the "moving" flag so the next render
      // treats this token as part of its cell's stack again. Subsequent
      // set() calls in this function merge (Zustand) so the flag stays
      // off.
      set({ movingTokenId: null });

      // Captures — pure helper hands back the updated players + arc
      // descriptors, or null if no opponent token sat on the landing
      // cell. In partner mode, both teammate seat colours are friendly.
      const friendlyColors = movingPlayer.team !== undefined
        ? TEAM_SEATS[movingPlayer.team]
        : [movingPlayer.color];
      const capture = detectCaptures(players, movingPlayer.color, outcome.finalIndex, outcome.finalState, friendlyColors);
      let capturedMessage = '';
      if (capture) {
        players = capture.players;
        capturedMessage = ` — Captured ${capture.capturedNames[0]}'s token!`;
        playCapture();
        haptics.capture();
        // Kick off the arc immediately. flyingCaptures merges through
        // subsequent set() calls below; a timer clears them when the
        // arc has landed.
        set({ flyingCaptures: capture.flyingCaptures });
        setTimeout(() => {
          if (!stillCurrent(myGen)) return;
          set({ flyingCaptures: [] });
        }, LUDO_TIMING.captureFlyMs);
      }
      const gotCapture = capture !== null;

      // Re-bind `me` to the updated players array (capture detection
      // may have rebuilt it).
      const movedPlayer = players[movingPlayerIndex];
      const partners = movedPlayer.team !== undefined;

      // "First home wins" short-circuit — the moment a player lands a
      // single token in home, they win. Disabled in partners mode
      // (the team must bring all 8 tokens home).
      if (!partners && s.options.firstHomeWins && outcome.finalState === 'home') {
        const winner = { ...movedPlayer, finishOrder: 1 };
        players[movingPlayerIndex] = winner;
        playWin();
        haptics.win();
        set({
          players,
          gamePhase: 'finished',
          winner,
          message: `🏆 ${winner.name} wins!`,
          selectableTokenIds: [],
        });
        return;
      }

      if (partners) {
        // Partners: team wins when BOTH teammate seats have all 4 home.
        const teamMembers = players.filter(p => p.team === movedPlayer.team);
        const teamDone = teamMembers.every(p => p.tokens.every(t => t.state === 'home'));
        if (teamDone) {
          // Mark both teammates finished so any downstream "is this seat
          // done" check stays consistent. The displayed winner is the
          // moved seat (its displayColor lights up the WinnerModal).
          players = players.map(p =>
            p.team === movedPlayer.team ? { ...p, finishOrder: 1 } : p,
          );
          const winner = players[movingPlayerIndex];
          playWin();
          haptics.win();
          set({
            players,
            gamePhase: 'finished',
            winner,
            message: `🏆 ${winner.name} wins!`,
            selectableTokenIds: [],
          });
          return;
        }
      } else {
        // Standard Ludo: the first player to bring all four tokens home
        // WINS — game ends right there. (The `firstHomeWins` option
        // above is a more aggressive variant where the first single-
        // token-home wins.)
        const newOrder = nextFinishOrder(movedPlayer, players);
        if (newOrder > 0) {
          const winner = movedPlayer.finishOrder === 0
            ? { ...movedPlayer, finishOrder: newOrder }
            : movedPlayer;
          players[movingPlayerIndex] = winner;
          playWin();
          haptics.win();
          set({
            players,
            gamePhase: 'finished',
            winner,
            message: `🏆 ${winner.name} wins!`,
            selectableTokenIds: [],
          });
          return;
        }
      }

      // Bonus turn on 6 / reach-home / capture. Otherwise rotate.
      const gotSix = diceValue === 6;
      const reachedHome = outcome.finalState === 'home';
      const bonusTurn = gotSix || reachedHome || gotCapture;
      if (bonusTurn) {
        set({
          players,
          gamePhase: 'rolling',
          diceValue: null,
          hasRolled: false,
          // Only count the six-streak if it WAS a six. Captures and
          // reach-home grant a bonus turn but reset the streak.
          consecutiveSixes: gotSix ? state.consecutiveSixes : 0,
          message: `${currentPlayer.name}${capturedMessage || (reachedHome ? ' reached home!' : ' rolled 6!')} Bonus turn!`,
          selectableTokenIds: [],
        });
        return;
      }

      const nextPlayerIndex = findNextActivePlayer(currentPlayerIndex, players);
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
      }, LUDO_TIMING.turnEndMs);
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
      movingTokenId: null,
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
    // Transient — never persist a half-finished arc / mid-walk token.
    flyingCaptures: [],
    movingTokenId: null,
    options: state.options,
  };
  // Debounced: a single walk fires ~11 subscribe events at ~90 ms each.
  // Collapse them into one trailing-edge write. pagehide/beforeunload
  // drain the queue so the latest state survives an app dismiss.
  saveDebounced(STORAGE_KEYS.LUDO, snapshot);
});
