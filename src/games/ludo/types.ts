export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';
export type TokenState = 'yard' | 'active' | 'home';
export type GamePhase = 'setup' | 'rolling' | 'selecting' | 'moving' | 'finished';

export interface Token {
  id: string;
  color: PlayerColor;
  state: TokenState;
  pathIndex: number; // -1 for yard, 0-56 for path (56 = home)
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  tokens: Token[];
  finishOrder: number; // 0 = not finished, 1 = first, 2 = second, etc.
}

export interface LudoGameState {
  players: Player[];
  currentPlayerIndex: number;
  diceValue: number | null;
  isRolling: boolean;
  hasRolled: boolean;
  consecutiveSixes: number;
  gamePhase: GamePhase;
  winner: Player | null;
  message: string;
  selectableTokenIds: string[];
}

export interface BoardPosition {
  row: number;
  col: number;
}
