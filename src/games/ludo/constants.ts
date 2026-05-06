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
    bg: '#eab308',
    bgLight: '#fde68a',
    text: '#fff',
    glow: 'rgba(234,179,8,0.5)',
    gradient: 'linear-gradient(135deg, #eab308, #ca8a04)',
    homeGradient: 'linear-gradient(135deg, #fef9c3, #fde68a)',
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

// Home column entry point (the index on main path where a color turns into its home stretch)
// This is the last square on the main path before entering the home column
export const HOME_ENTRY_INDEX: Record<PlayerColor, number> = {
  red: 50, // at (6,0) then enters home stretch
  green: 11, // at (0,7) then enters home stretch — but actually the square before the home column
  yellow: 24, // at (7,14) then enters
  blue: 37, // at (14,7) then enters
};

// Build complete path for each color:
// path[0] = start position, path[1..50] = around the board, path[51..56] = home stretch
export function getFullPath(color: PlayerColor): BoardPosition[] {
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
  const fullPath = getFullPath(color);
  if (pathIndex >= fullPath.length) {
    return fullPath[fullPath.length - 1]; // home
  }
  return fullPath[pathIndex];
}

// Get all safe positions as board coordinates for rendering stars
export function getSafeSquares(): BoardPosition[] {
  return SAFE_POSITIONS_ON_MAIN.map(idx => MAIN_PATH[idx]);
}

// Home yard area boundaries (for rendering the colored areas)
export const HOME_AREAS: Record<PlayerColor, { startRow: number; startCol: number; endRow: number; endCol: number }> = {
  red: { startRow: 0, startCol: 0, endRow: 5, endCol: 5 },
  green: { startRow: 0, startCol: 9, endRow: 5, endCol: 14 },
  yellow: { startRow: 9, startCol: 9, endRow: 14, endCol: 14 },
  blue: { startRow: 9, startCol: 0, endRow: 14, endCol: 5 },
};

// Center home area (the triangular areas in the middle)
export const CENTER_AREA = {
  startRow: 6,
  startCol: 6,
  endRow: 8,
  endCol: 8,
};

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
