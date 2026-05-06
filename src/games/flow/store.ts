import { create } from 'zustand';

export type GameId = 'ludo' | 'snl';
export type Mode = 'pass' | 'cpu';

export interface FlowPlayer {
  name: string;
  color: string; // 'red' | 'green' | 'yellow' | 'blue' for Ludo
  isCPU: boolean;
}

interface FlowStore {
  game: GameId | null;
  mode: Mode | null;
  players: FlowPlayer[];
  setGame: (g: GameId) => void;
  setMode: (m: Mode) => void;
  setPlayers: (players: FlowPlayer[]) => void;
  reset: () => void;
}

export const useFlow = create<FlowStore>((set) => ({
  game: null,
  mode: null,
  players: [],
  setGame: (g) => set({ game: g }),
  setMode: (m) => set({ mode: m }),
  setPlayers: (players) => set({ players }),
  reset: () => set({ game: null, mode: null, players: [] }),
}));
