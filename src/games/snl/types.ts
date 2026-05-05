export interface SNLPlayer {
  id: string;
  name: string;
  color: string;
  position: number; // 0 = not started, 1-100
}

export type SNLGamePhase = 'setup' | 'rolling' | 'moving' | 'finished';

export interface SNLGameState {
  players: SNLPlayer[];
  currentPlayerIndex: number;
  diceValue: number | null;
  hasRolled: boolean;
  gamePhase: SNLGamePhase;
  winner: SNLPlayer | null;
  message: string;
  lastAction: string;
}

export interface SnakeOrLadder {
  from: number;
  to: number;
  type: 'snake' | 'ladder';
}
