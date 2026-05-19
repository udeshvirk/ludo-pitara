export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';
export type TokenState = 'yard' | 'active' | 'home';
export type GamePhase = 'setup' | 'rolling' | 'selecting' | 'moving' | 'finished';

// `color` on Token/Player is the SEAT identifier — a positional label
// that drives yard corner, path start index, home-stretch column, etc.
// It is set by slot index at setup time and is fully decoupled from
// the visual colour the user picks (`displayColor`). The historical
// names red/green/yellow/blue are preserved so the existing
// PLAYER_COLORS / YARD_POSITIONS / HOME_STRETCHES tables keep working
// without renames:
//   blue   → bottom-left  yard   (slot 0)
//   red    → top-left     yard   (slot 1)
//   green  → top-right    yard   (slot 2)
//   yellow → bottom-right yard   (slot 3)
// `displayColor` is the user's visual pick (avatar/token/yard fill).
export interface Token {
  id: string;
  color: PlayerColor;        // seat
  displayColor: PlayerColor; // visual
  state: TokenState;
  pathIndex: number; // -1 for yard, 0-56 for path (56 = home)
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;        // seat
  displayColor: PlayerColor; // visual
  tokens: Token[];
  finishOrder: number; // 0 = not finished, 1 = first, 2 = second, etc.
  isCPU?: boolean;
  // Partners mode (2v2): team 0 = blue+green diagonal, team 1 = red+yellow.
  // Undefined in solo play. Two seats sharing a team also share name +
  // isCPU (one human / bot controls both colours).
  team?: 0 | 1;
  // Most recent dice face this player rolled. Pods of inactive players
  // display this so each die "stays put" like a real tabletop die,
  // instead of resetting to 1 between turns.
  lastRoll: number | null;
}

// Set briefly after a capture so the captured token can animate in an
// arc from its path cell back to its yard socket. Game state has
// already moved the token to 'yard' — this list just tells the board
// to render a floating token along the arc and skip the yard render
// for that token until the flight settles.
export interface CaptureFly {
  tokenId: string;
  color: PlayerColor;        // seat (yard target)
  displayColor: PlayerColor; // visual
  from: BoardPosition;
  to: BoardPosition;
}

export type CPUDifficulty = 'easy' | 'medium' | 'hard';

export interface LudoGameOptions {
  oneTokenOut: boolean;
  firstHomeWins: boolean;
  cpuDifficulty: CPUDifficulty;
  // Partner mode: 2 teams of 2 seats each. Team A = blue+green
  // diagonal, Team B = red+yellow. firstHomeWins is forced off when
  // partners is on (team wins only when all 8 of their tokens are home).
  partners: boolean;
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
