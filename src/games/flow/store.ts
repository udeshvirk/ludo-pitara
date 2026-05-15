import { create } from 'zustand';

export type GameId = 'ludo' | 'snl';

export interface FlowPlayer {
  name: string;
  color: string; // 'red' | 'green' | 'yellow' | 'blue' for Ludo
  isCPU: boolean;
}

// Per-game rules toggles surfaced on PlayerSetup. Defaults preserve the
// original behaviour, so a player who never opens "Game options" sees
// no change vs. the pre-options build.
export type CPUDifficulty = 'easy' | 'medium' | 'hard';

export interface LudoOptions {
  // 1 token per player starts already on its start cell. The other 3
  // still need a 6 to leave the yard.
  oneTokenOut: boolean;
  // First player to land any single token in home wins (instead of
  // having to bring all four home).
  firstHomeWins: boolean;
  // CPU strength. Easy = mostly random with a small yard-out bias.
  // Medium = the original heuristic. Hard = medium + opponent-threat
  // awareness (penalise moves that leave own tokens within 6 of a
  // captureable opponent next turn).
  cpuDifficulty: CPUDifficulty;
}
export interface SNLOptions {
  // Skip the "must roll a 1 to enter" rule — players can enter the
  // board on any roll.
  autoStart: boolean;
}
export interface GameOptions {
  ludo: LudoOptions;
  snl: SNLOptions;
}

export const DEFAULT_OPTIONS: GameOptions = {
  ludo: { oneTokenOut: false, firstHomeWins: false, cpuDifficulty: 'medium' },
  snl: { autoStart: false },
};

interface FlowStore {
  game: GameId | null;
  players: FlowPlayer[];
  options: GameOptions;
  setGame: (g: GameId) => void;
  setPlayers: (players: FlowPlayer[]) => void;
  setOptions: (options: GameOptions) => void;
  reset: () => void;
}

export const useFlow = create<FlowStore>((set) => ({
  game: null,
  players: [],
  options: DEFAULT_OPTIONS,
  setGame: (g) => set({ game: g }),
  setPlayers: (players) => set({ players }),
  setOptions: (options) => set({ options }),
  reset: () => set({ game: null, players: [], options: DEFAULT_OPTIONS }),
}));
