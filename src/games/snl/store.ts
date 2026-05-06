import { create } from 'zustand';
import type { SNLGameState, SNLPlayer } from './types';
import { BOARD_CONFIG, SNL_PLAYER_COLORS, SNAKES_AND_LADDERS } from './constants';

interface SNLStore extends SNLGameState {
  initGame: (playerCount: number, playerNames?: string[]) => void;
  rollDice: () => void;
  resetGame: () => void;
}

export const useSNLStore = create<SNLStore>((set, get) => ({
  players: [],
  currentPlayerIndex: 0,
  diceValue: null,
  hasRolled: false,
  gamePhase: 'setup',
  winner: null,
  message: 'Set up your game!',
  lastAction: '',

  initGame: (playerCount: number, playerNames?: string[]) => {
    const players: SNLPlayer[] = Array.from({ length: playerCount }, (_, i) => ({
      id: `player-${i}`,
      name: playerNames?.[i] || `Player ${i + 1}`,
      color: SNL_PLAYER_COLORS[i].color,
      position: 0,
    }));

    set({
      players,
      currentPlayerIndex: 0,
      diceValue: null,
      hasRolled: false,
      gamePhase: 'rolling',
      winner: null,
      message: `${players[0].name}'s turn — Tap the dice to roll!`,
      lastAction: '',
    });
  },

  rollDice: () => {
    const state = get();
    if (state.hasRolled || state.gamePhase !== 'rolling') return;

    const diceValue = Math.floor(Math.random() * 6) + 1;
    const currentPlayer = state.players[state.currentPlayerIndex];
    const currentPos = currentPlayer.position;
    let newPos = currentPos + diceValue;
    let actionMessage = '';

    set({ diceValue, hasRolled: true, gamePhase: 'rolling' });

    // Wait for the 3D dice to finish its "settle" animation (400ms) before continuing logic
    setTimeout(() => {
      set({ gamePhase: 'moving' });

      // Check if overshooting 100
      if (newPos > 100) {
        // Bounce back
        newPos = 100 - (newPos - 100);
        actionMessage = `Bounced back to ${newPos}!`;
      }

      // Check for exact 100
      if (newPos === 100) {
        // Winner!
        const updatedPlayers = [...state.players];
        updatedPlayers[state.currentPlayerIndex] = { ...currentPlayer, position: 100 };

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

      // Check for snake or ladder at landing position
      const specialTarget = BOARD_CONFIG[newPos];
      let finalPos = newPos;

      if (specialTarget !== undefined) {
        const entity = SNAKES_AND_LADDERS.find(s => s.from === newPos);
        if (entity) {
          if (entity.type === 'ladder') {
            actionMessage = `🪜 Climbed ladder from ${newPos} to ${specialTarget}!`;
          } else {
            actionMessage = `🐍 Bitten by snake! Slid from ${newPos} to ${specialTarget}!`;
          }
          finalPos = specialTarget;
        }
      }

      if (!actionMessage) {
        actionMessage = `Moved to ${newPos}`;
      }

      // Apply move with animation delay
      const updatedPlayers = [...state.players];
      // First move to the dice position
      updatedPlayers[state.currentPlayerIndex] = { ...currentPlayer, position: newPos };

      setTimeout(() => {
        set({
          players: [...updatedPlayers],
          lastAction: actionMessage,
          message: `${currentPlayer.name}: ${actionMessage}`,
        });

        // If there's a snake/ladder, apply the second move after a delay
        if (finalPos !== newPos) {
          setTimeout(() => {
            const players2 = [...get().players];
            players2[state.currentPlayerIndex] = { ...players2[state.currentPlayerIndex], position: finalPos };
            set({ players: players2 });

            // Move to next player
            setTimeout(() => {
              const gotSix = diceValue === 6;
              if (gotSix) {
                set({
                  diceValue: null,
                  hasRolled: false,
                  gamePhase: 'rolling',
                  message: `${currentPlayer.name} rolled 6! Bonus turn!`,
                });
              } else {
                const nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
                set({
                  currentPlayerIndex: nextIdx,
                  diceValue: null,
                  hasRolled: false,
                  gamePhase: 'rolling',
                  message: `${state.players[nextIdx].name}'s turn — Tap the dice to roll!`,
                });
              }
            }, 400);
          }, 600);
        } else {
          // No snake/ladder, just move to next player
          setTimeout(() => {
            const gotSix = diceValue === 6;
            if (gotSix) {
              set({
                diceValue: null,
                hasRolled: false,
                gamePhase: 'rolling',
                message: `${currentPlayer.name} rolled 6! Bonus turn!`,
              });
            } else {
              const nextIdx = (state.currentPlayerIndex + 1) % state.players.length;
              set({
                currentPlayerIndex: nextIdx,
                diceValue: null,
                hasRolled: false,
                gamePhase: 'rolling',
                message: `${state.players[nextIdx].name}'s turn — Tap the dice to roll!`,
              });
            }
          }, 800);
        }
      }, 500);
    }, 400); // Wait 400ms for dice to settle
  },

  resetGame: () => {
    set({
      players: [],
      currentPlayerIndex: 0,
      diceValue: null,
      hasRolled: false,
      gamePhase: 'setup',
      winner: null,
      message: 'Set up your game!',
      lastAction: '',
    });
  },
}));
