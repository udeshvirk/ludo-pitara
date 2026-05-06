import { create } from 'zustand';
import type {
  LudoGameState,
  Player,
  Token,
  PlayerColor,
} from './types';
import {
  PLAYER_ORDER,
  isSafePosition,
  getBoardPosition,
} from './constants';

interface LudoStore extends LudoGameState {
  initGame: (playerCount: number, playerNames?: string[], customPlayers?: {name: string, color: PlayerColor}[]) => void;
  rollDice: () => void;
  selectToken: (tokenId: string) => void;
  resetGame: () => void;
}

function createPlayer(name: string, color: PlayerColor): Player {
  return {
    id: color,
    name,
    color,
    tokens: Array.from({ length: 4 }, (_, i) => ({
      id: `${color}-${i}`,
      color,
      state: 'yard' as const,
      pathIndex: -1,
    })),
    finishOrder: 0,
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

export const useLudoStore = create<LudoStore>((set, get) => ({
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

  initGame: (playerCount: number, playerNames?: string[], customPlayers?: {name: string, color: PlayerColor}[]) => {
    let players: Player[] = [];
    if (customPlayers) {
      players = customPlayers.map(cp => createPlayer(cp.name, cp.color));
    } else {
      const colors = PLAYER_ORDER[playerCount];
      players = colors.map((color, i) => {
        const name = playerNames?.[i] || `Player ${i + 1}`;
        return createPlayer(name, color);
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
    });
  },

  rollDice: () => {
    const state = get();
    if (state.hasRolled || state.gamePhase !== 'rolling') return;

    const diceValue = Math.floor(Math.random() * 6) + 1;
    const currentPlayer = state.players[state.currentPlayerIndex];

    // Only set the dice value so the 3D dice can animate to the face
    set({ diceValue, isRolling: true, hasRolled: true, gamePhase: 'rolling' });

    // Wait for the 3D dice to finish its "settle" animation (800ms) before continuing logic
    setTimeout(() => {
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
        set({
          currentPlayerIndex: nextPlayerIndex,
          diceValue: null,
          hasRolled: false,
          gamePhase: 'rolling',
          message: `${nextPlayer.name}'s turn — Tap the dice to roll!`,
          selectableTokenIds: [],
        });
      }, 1500);
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
        set({
          currentPlayerIndex: nextPlayerIndex,
          diceValue: null,
          hasRolled: false,
          gamePhase: 'rolling',
          message: `${nextPlayer.name}'s turn — Tap the dice to roll!`,
          selectableTokenIds: [],
        });
      }, 1500);
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

    let newPathIndex: number;
    let newState: Token['state'];
    let capturedMessage = '';

    if (token.state === 'yard') {
      // Move out of yard to starting position
      newPathIndex = 0;
      newState = 'active';
    } else {
      newPathIndex = token.pathIndex + diceValue;
      newState = newPathIndex >= 56 ? 'home' : 'active';
      if (newPathIndex > 56) newPathIndex = 56;
    }

    // Check for capture (only on main path, not home stretch, not safe squares)
    let gotCapture = false;
    if (newState === 'active' && newPathIndex < 51 && !isSafePosition(currentPlayer.color, newPathIndex)) {
      const newBoardPos = getBoardPosition(currentPlayer.color, newPathIndex);

      // Check all other players' tokens
      const updatedPlayers = [...state.players];
      for (let pi = 0; pi < updatedPlayers.length; pi++) {
        if (updatedPlayers[pi].color === currentPlayer.color) continue;

        const otherPlayer = { ...updatedPlayers[pi], tokens: [...updatedPlayers[pi].tokens] };
        for (let ti = 0; ti < otherPlayer.tokens.length; ti++) {
          const otherToken = otherPlayer.tokens[ti];
          if (otherToken.state !== 'active') continue;

          const otherPos = getBoardPosition(otherToken.color, otherToken.pathIndex);
          if (otherPos.row === newBoardPos.row && otherPos.col === newBoardPos.col) {
            // Capture!
            otherPlayer.tokens[ti] = {
              ...otherToken,
              state: 'yard',
              pathIndex: -1,
            };
            gotCapture = true;
            capturedMessage = ` — Captured ${otherPlayer.name}'s token!`;
          }
        }
        updatedPlayers[pi] = otherPlayer;
      }

      if (gotCapture) {
        // Update players with capture applied, then continue
        const myPlayer = { ...updatedPlayers[state.currentPlayerIndex], tokens: [...updatedPlayers[state.currentPlayerIndex].tokens] };
        myPlayer.tokens[tokenIndex] = { ...token, pathIndex: newPathIndex, state: newState };

        // Check if player finished
        if (myPlayer.tokens.every(t => t.state === 'home')) {
          const finishCount = updatedPlayers.filter(p => p.finishOrder > 0).length;
          myPlayer.finishOrder = finishCount + 1;
        }
        updatedPlayers[state.currentPlayerIndex] = myPlayer;

        // Bonus turn for capture
        set({
          players: updatedPlayers,
          gamePhase: 'rolling',
          diceValue: null,
          hasRolled: false,
          message: `${currentPlayer.name} captured!${myPlayer.finishOrder ? ' 🏆 Finished!' : ' Bonus turn!'}`,
          selectableTokenIds: [],
        });

        if (myPlayer.finishOrder && updatedPlayers.filter(p => p.finishOrder === 0).length <= 1) {
          set({ gamePhase: 'finished', winner: myPlayer });
        }
        return;
      }
    }

    // Apply the move
    const updatedPlayers = [...state.players];
    const myPlayer = { ...updatedPlayers[state.currentPlayerIndex], tokens: [...updatedPlayers[state.currentPlayerIndex].tokens] };
    myPlayer.tokens[tokenIndex] = { ...token, pathIndex: newPathIndex, state: newState };

    // Check if player finished all tokens
    if (myPlayer.tokens.every(t => t.state === 'home')) {
      const finishCount = updatedPlayers.filter(p => p.finishOrder > 0).length;
      myPlayer.finishOrder = finishCount + 1;
    }
    updatedPlayers[state.currentPlayerIndex] = myPlayer;

    // Determine next turn
    const gotSix = diceValue === 6;
    const reachedHome = newState === 'home';
    const bonusTurn = gotSix || reachedHome || gotCapture;

    if (myPlayer.finishOrder && updatedPlayers.filter(p => p.finishOrder === 0).length <= 1) {
      // Game over
      set({
        players: updatedPlayers,
        gamePhase: 'finished',
        winner: myPlayer,
        message: `🏆 ${myPlayer.name} wins!`,
        selectableTokenIds: [],
      });
      return;
    }

    if (myPlayer.finishOrder) {
      // This player finished but game continues
      const nextPlayerIndex = findNextActivePlayer(state.currentPlayerIndex, updatedPlayers);
      set({
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        gamePhase: 'rolling',
        diceValue: null,
        hasRolled: false,
        consecutiveSixes: 0,
        message: `${myPlayer.name} finished! 🏆 ${updatedPlayers[nextPlayerIndex].name}'s turn!`,
        selectableTokenIds: [],
      });
      return;
    }

    if (bonusTurn) {
      set({
        players: updatedPlayers,
        gamePhase: 'rolling',
        diceValue: null,
        hasRolled: false,
        message: `${currentPlayer.name}${capturedMessage || (reachedHome ? ' reached home!' : ' rolled 6!')} Bonus turn!`,
        selectableTokenIds: [],
      });
    } else {
      const nextPlayerIndex = findNextActivePlayer(state.currentPlayerIndex, updatedPlayers);
      const nextPlayer = updatedPlayers[nextPlayerIndex];

      set({
        players: updatedPlayers,
        gamePhase: 'rolling',
        selectableTokenIds: [],
      });

      setTimeout(() => {
        set({
          currentPlayerIndex: nextPlayerIndex,
          diceValue: null,
          hasRolled: false,
          consecutiveSixes: 0,
          message: `${nextPlayer.name}'s turn — Tap the dice to roll!`,
        });
      }, 600);
    }
  },

  resetGame: () => {
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
    });
  },
}));
