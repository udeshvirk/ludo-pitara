import { describe, expect, it } from 'vitest';
import { turnGuidance } from './turnGuidance';
import type { Player } from './types';

const player: Player = {
  id: 'blue', name: 'Asha', color: 'blue', displayColor: 'blue', finishOrder: 0, lastRoll: 6,
  tokens: [
    { id: 'yard', color: 'blue', displayColor: 'blue', state: 'yard', pathIndex: -1 },
    { id: 'path', color: 'blue', displayColor: 'blue', state: 'active', pathIndex: 4 },
  ],
};
const state = { players: [player], currentPlayerIndex: 0, gamePhase: 'selecting' as const, isRolling: false, diceValue: 6, selectableTokenIds: ['yard', 'path'], message: '' };

describe('turn guidance', () => {
  it('explains both choices on a six, and yard-only entry', () => {
    expect(turnGuidance(state).detail).toContain('or move one 6 spaces');
    expect(turnGuidance({ ...state, selectableTokenIds: ['yard'] }).detail).toContain('in your yard');
  });
  it('does not ask humans to act during bot or automatic movement', () => {
    expect(turnGuidance({ ...state, players: [{ ...player, isCPU: true }] }).detail).toContain('automatically');
    expect(turnGuidance({ ...state, gamePhase: 'moving' }).detail).toContain('automatically');
  });
  it('shows a roll instruction only when another roll is available', () => {
    expect(turnGuidance({ ...state, gamePhase: 'rolling', diceValue: null }).title).toContain('tap your dice');
    expect(turnGuidance({ ...state, gamePhase: 'rolling', message: 'No valid moves!' }).title).toBe('No valid moves!');
    expect(turnGuidance({ ...state, isRolling: true }).title).toContain('is rolling');
  });
  it('explains ordinary moves without suggesting a yard exit', () => {
    expect(turnGuidance({ ...state, diceValue: 3, selectableTokenIds: ['path'] }).detail).toBe('Tap a marked coin on the board to move 3 spaces.');
  });
});
