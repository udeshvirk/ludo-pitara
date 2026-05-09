export interface SNLPlayer {
  id: string;
  name: string;
  color: string;
  position: number; // 0 = not started, 1-100
  isCPU?: boolean;
}

export type SNLGamePhase = 'setup' | 'rolling' | 'moving' | 'finished';

// Set while a token is sliding down a snake or climbing a ladder. The
// affected player is excluded from cell-based rendering and a floating
// token is animated along the entity's path instead.
export interface Slide {
  playerId: string;
  fromCell: number;
  toCell: number;
  type: 'snake' | 'ladder';
}

export interface SNLGameOptions {
  autoStart: boolean;
}

export interface SNLGameState {
  players: SNLPlayer[];
  currentPlayerIndex: number;
  diceValue: number | null;
  isRolling: boolean;
  hasRolled: boolean;
  gamePhase: SNLGamePhase;
  winner: SNLPlayer | null;
  message: string;
  lastAction: string;
  // Per-game randomized snakes & ladders. Empty before the first initGame.
  layout: SnakeOrLadder[];
  sliding: Slide | null;
  options: SNLGameOptions;
}

export interface SnakeOrLadder {
  from: number;
  to: number;
  type: 'snake' | 'ladder';
}
