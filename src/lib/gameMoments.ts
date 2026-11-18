import { create } from 'zustand';

export type MomentKind = 'capture' | 'safe' | 'home' | 'snake' | 'ladder';
export type MomentGame = 'ludo' | 'snl';
export interface GameMoment {
  id: number;
  kind: MomentKind;
  x: number;
  y: number;
  detail?: string;
}

// Presentation-only events: never saved or used to advance gameplay.
export const MOMENT_DURATION_MS = 1400;
export const useGameMoments = create<Record<MomentGame, GameMoment | null>>(() => ({ ludo: null, snl: null }));
let sequence = 0;
const timers: Partial<Record<MomentGame, ReturnType<typeof setTimeout>>> = {};

export function clearMoment(game: MomentGame) {
  clearTimeout(timers[game]);
  useGameMoments.setState({ [game]: null });
}

export function showMoment(game: MomentGame, moment: Omit<GameMoment, 'id'>) {
  clearMoment(game);
  const id = ++sequence;
  useGameMoments.setState({ [game]: { ...moment, id } });
  timers[game] = setTimeout(() => {
    if (useGameMoments.getState()[game]?.id === id) clearMoment(game);
  }, MOMENT_DURATION_MS);
}
