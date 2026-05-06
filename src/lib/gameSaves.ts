// Inspect localStorage for in-progress saves, so the splash can offer
// "Continue" without booting the full game store.

import { load } from './persist';
import type { LudoGameState } from '../games/ludo/types';
import type { SNLGameState } from '../games/snl/types';

const LUDO_KEY = 'game.ludo';
const SNL_KEY = 'game.snl';

export interface SavedGame {
  game: 'ludo' | 'snl';
  hint: string; // e.g. "3 players · 12 turns played"
}

export function detectSaved(): SavedGame | null {
  const ludo = load<LudoGameState | null>(LUDO_KEY, null);
  if (ludo && ludo.players.length > 0 && ludo.gamePhase !== 'finished') {
    return {
      game: 'ludo',
      hint: `${ludo.players.length} players · ${countMoved(ludo)} tokens out`,
    };
  }
  const snl = load<SNLGameState | null>(SNL_KEY, null);
  if (snl && snl.players.length > 0 && snl.gamePhase !== 'finished') {
    return {
      game: 'snl',
      hint: `${snl.players.length} players · top at ${Math.max(...snl.players.map(p => p.position))}`,
    };
  }
  return null;
}

function countMoved(state: LudoGameState): number {
  return state.players.reduce(
    (acc, p) => acc + p.tokens.filter(t => t.state !== 'yard').length,
    0,
  );
}

export const STORAGE_KEYS = { LUDO: LUDO_KEY, SNL: SNL_KEY };
