import type { BoardPosition, PlayerColor } from './types';

// Board is 15x15
export const BOARD_SIZE = 15;

// Colors and their visual properties
export const PLAYER_COLORS: Record<PlayerColor, {
  bg: string;
  bgLight: string;
  text: string;
  glow: string;
  gradient: string;
  homeGradient: string;
}> = {
  red: {
    bg: '#ef4444',
    bgLight: '#fca5a5',
    text: '#fff',
    glow: 'rgba(239,68,68,0.5)',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    homeGradient: 'linear-gradient(135deg, #fecaca, #fca5a5)',
  },
  green: {
    bg: '#22c55e',
    bgLight: '#86efac',
    text: '#fff',
    glow: 'rgba(34,197,94,0.5)',
    gradient: 'linear-gradient(135deg, #22c55e, #16a34a)',
    homeGradient: 'linear-gradient(135deg, #bbf7d0, #86efac)',
  },
  yellow: {
    bg: '#d99e00',
    bgLight: '#f4d27a',
    text: '#fff',
    glow: 'rgba(217, 158, 0, 0.5)',
    gradient: 'linear-gradient(135deg, #d99e00, #a87a00)',
    homeGradient: 'linear-gradient(135deg, #fce8a3, #f4d27a)',
  },
  blue: {
    bg: '#3b82f6',
    bgLight: '#93c5fd',
    text: '#fff',
    glow: 'rgba(59,130,246,0.5)',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    homeGradient: 'linear-gradient(135deg, #bfdbfe, #93c5fd)',
  },
};

// Player order for 2/3/4 players
export const PLAYER_ORDER: Record<number, PlayerColor[]> = {
  2: ['red', 'yellow'],
  3: ['red', 'green', 'blue'],
  4: ['red', 'green', 'yellow', 'blue'],
};

// Starting yard positions (where tokens sit before entering)
export const YARD_POSITIONS: Record<PlayerColor, BoardPosition[]> = {
  red: [
    { row: 1, col: 1 }, { row: 1, col: 4 },
    { row: 4, col: 1 }, { row: 4, col: 4 },
  ],
  green: [
    { row: 1, col: 10 }, { row: 1, col: 13 },
    { row: 4, col: 10 }, { row: 4, col: 13 },
  ],
  yellow: [
    { row: 10, col: 10 }, { row: 10, col: 13 },
    { row: 13, col: 10 }, { row: 13, col: 13 },
  ],
  blue: [
    { row: 10, col: 1 }, { row: 10, col: 4 },
    { row: 13, col: 1 }, { row: 13, col: 4 },
  ],
};

// The main path around the board (52 squares) — shared path positions
// This is the common track that all tokens move on
// Path goes: Red start → clockwise around the board
const MAIN_PATH: BoardPosition[] = [
  // Red exit → going up (column 6)
  { row: 6, col: 1 },
  { row: 6, col: 2 },
  { row: 6, col: 3 },
  { row: 6, col: 4 },
  { row: 6, col: 5 },
  // Turn up
  { row: 5, col: 6 },
  { row: 4, col: 6 },
  { row: 3, col: 6 },
  { row: 2, col: 6 },
  { row: 1, col: 6 },
  { row: 0, col: 6 },
  // Turn right
  { row: 0, col: 7 },
  // Turn down (green side)
  { row: 0, col: 8 },
  { row: 1, col: 8 },
  { row: 2, col: 8 },
  { row: 3, col: 8 },
  { row: 4, col: 8 },
  { row: 5, col: 8 },
  // Green exit → going right
  { row: 6, col: 9 },
  { row: 6, col: 10 },
  { row: 6, col: 11 },
  { row: 6, col: 12 },
  { row: 6, col: 13 },
  { row: 6, col: 14 },
  // Turn down
  { row: 7, col: 14 },
  // Turn left (yellow side)
  { row: 8, col: 14 },
  { row: 8, col: 13 },
  { row: 8, col: 12 },
  { row: 8, col: 11 },
  { row: 8, col: 10 },
  { row: 8, col: 9 },
  // Turn down
  { row: 9, col: 8 },
  { row: 10, col: 8 },
  { row: 11, col: 8 },
  { row: 12, col: 8 },
  { row: 13, col: 8 },
  { row: 14, col: 8 },
  // Turn left
  { row: 14, col: 7 },
  // Turn up (blue side)
  { row: 14, col: 6 },
  { row: 13, col: 6 },
  { row: 12, col: 6 },
  { row: 11, col: 6 },
  { row: 10, col: 6 },
  { row: 9, col: 6 },
  // Blue exit → going left
  { row: 8, col: 5 },
  { row: 8, col: 4 },
  { row: 8, col: 3 },
  { row: 8, col: 2 },
  { row: 8, col: 1 },
  { row: 8, col: 0 },
  // Turn up
  { row: 7, col: 0 },
  // Turn right (back to red side)
  { row: 6, col: 0 },
];

// Starting index on the main path for each color
export const START_INDEX: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
};

// The home stretch (final 5 squares before home) for each color
const HOME_STRETCHES: Record<PlayerColor, BoardPosition[]> = {
  red: [
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
    { row: 7, col: 6 }, // home center
  ],
  green: [
    { row: 1, col: 7 },
    { row: 2, col: 7 },
    { row: 3, col: 7 },
    { row: 4, col: 7 },
    { row: 5, col: 7 },
    { row: 6, col: 7 }, // home center
  ],
  yellow: [
    { row: 7, col: 13 },
    { row: 7, col: 12 },
    { row: 7, col: 11 },
    { row: 7, col: 10 },
    { row: 7, col: 9 },
    { row: 7, col: 8 }, // home center
  ],
  blue: [
    { row: 13, col: 7 },
    { row: 12, col: 7 },
    { row: 11, col: 7 },
    { row: 10, col: 7 },
    { row: 9, col: 7 },
    { row: 8, col: 7 }, // home center
  ],
};

// Build complete path for each color:
// path[0] = start position, path[1..50] = around the board, path[51..56] = home stretch
function buildFullPath(color: PlayerColor): BoardPosition[] {
  const startIdx = START_INDEX[color];
  const path: BoardPosition[] = [];

  // Main path (52 squares, starting from color's start position)
  for (let i = 0; i < 51; i++) {
    path.push(MAIN_PATH[(startIdx + i) % 52]);
  }

  // Home stretch (6 squares, last one is home)
  path.push(...HOME_STRETCHES[color]);

  return path; // Total: 57 positions (index 0-56, where 56 = home)
}

// Precomputed full paths — called per token per render in
// getBoardPosition; rebuilding the 57-cell array each time is pure
// waste. Computed once at module load.
const FULL_PATHS: Record<PlayerColor, BoardPosition[]> = {
  red: buildFullPath('red'),
  green: buildFullPath('green'),
  yellow: buildFullPath('yellow'),
  blue: buildFullPath('blue'),
};

export function getFullPath(color: PlayerColor): BoardPosition[] {
  return FULL_PATHS[color];
}

// Safe positions on the main path (star squares) — indices on the main path
// These are the positions where tokens cannot be captured
export const SAFE_POSITIONS_ON_MAIN: number[] = [0, 8, 13, 21, 26, 34, 39, 47];

// Check if a position on the full path is safe
export function isSafePosition(color: PlayerColor, pathIndex: number): boolean {
  if (pathIndex < 0 || pathIndex > 56) return false;
  if (pathIndex >= 51) return true; // Home stretch is always safe

  // Convert the pathIndex back to main path index
  const startIdx = START_INDEX[color];
  const mainPathIdx = (startIdx + pathIndex) % 52;
  return SAFE_POSITIONS_ON_MAIN.includes(mainPathIdx);
}

// Get board position from path index
export function getBoardPosition(color: PlayerColor, pathIndex: number): BoardPosition {
  if (pathIndex < 0) {
    // In yard - return yard position (use token index)
    return YARD_POSITIONS[color][0];
  }
  const fullPath = FULL_PATHS[color];
  if (pathIndex >= fullPath.length) {
    return fullPath[fullPath.length - 1]; // home
  }
  return fullPath[pathIndex];
}

// Get all safe positions as board coordinates for rendering stars
export function getSafeSquares(): BoardPosition[] {
  return SAFE_POSITIONS_ON_MAIN.map(idx => MAIN_PATH[idx]);
}

// Path colored cells (the colored cells on the path and home stretch)
export function getColoredCells(): Map<string, PlayerColor> {
  const map = new Map<string, PlayerColor>();

  // Home stretches
  const colors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
  for (const color of colors) {
    const homeStretch = HOME_STRETCHES[color];
    for (const pos of homeStretch) {
      map.set(`${pos.row},${pos.col}`, color);
    }
    // Starting square
    const startPos = MAIN_PATH[START_INDEX[color]];
    map.set(`${startPos.row},${startPos.col}`, color);
  }

  return map;
}

// Partners mode (2v2) seat→team map. Diagonal pairing: BL+TR vs TL+BR.
//   team 0 → blue (BL) + green (TR)
//   team 1 → red  (TL) + yellow (BR)
export const TEAM_OF_SEAT: Record<PlayerColor, 0 | 1> = {
  blue: 0,
  green: 0,
  red: 1,
  yellow: 1,
};
export const TEAM_SEATS: Record<0 | 1, PlayerColor[]> = {
  0: ['blue', 'green'],
  1: ['red', 'yellow'],
};

// Check if a cell is part of the path
export function isPathCell(row: number, col: number): boolean {
  // Middle row
  if (row === 7 && col >= 0 && col <= 14) return true;
  // Middle column
  if (col === 7 && row >= 0 && row <= 14) return true;
  // Row 6 (horizontal path)
  if (row === 6 && (col <= 6 || col >= 8)) return true;
  // Row 8 (horizontal path)
  if (row === 8 && (col <= 6 || col >= 8)) return true;
  // Col 6 (vertical path)
  if (col === 6 && (row <= 6 || row >= 8)) return true;
  // Col 8 (vertical path)
  if (col === 8 && (row <= 6 || row >= 8)) return true;

  return false;
}
