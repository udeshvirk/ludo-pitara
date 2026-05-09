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
  isCPU?: boolean;
}

// Set briefly after a capture so the captured token can animate in an
// arc from its path cell back to its yard socket. Game state has
// already moved the token to 'yard' — this list just tells the board
// to render a floating token along the arc and skip the yard render
// for that token until the flight settles.
export interface CaptureFly {
  tokenId: string;
  color: PlayerColor;
  from: BoardPosition;
  to: BoardPosition;
}

export interface LudoGameOptions {
  oneTokenOut: boolean;
  firstHomeWins: boolean;
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
  flyingCaptures: CaptureFly[];
  // Token currently walking cell-by-cell. Pass-through cells exclude
  // it from their stack count so a 1-token cell doesn't briefly resize
  // to fit two and flash the count badge as the walker passes over.
  movingTokenId: string | null;
  options: LudoGameOptions;
}

export interface BoardPosition {
  row: number;
  col: number;
}
