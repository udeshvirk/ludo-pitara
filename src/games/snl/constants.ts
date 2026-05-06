import type { SnakeOrLadder } from './types';

export const BOARD_SIZE = 10;
export const TOTAL_CELLS = 100;

// Snakes: head (from) → tail (to) — going DOWN
// Ladders: bottom (from) → top (to) — going UP
export const SNAKES_AND_LADDERS: SnakeOrLadder[] = [
  // Ladders (8)
  { from: 2, to: 38, type: 'ladder' },
  { from: 7, to: 14, type: 'ladder' },
  { from: 8, to: 31, type: 'ladder' },
  { from: 15, to: 26, type: 'ladder' },
  { from: 21, to: 42, type: 'ladder' },
  { from: 28, to: 84, type: 'ladder' },
  { from: 36, to: 44, type: 'ladder' },
  { from: 51, to: 67, type: 'ladder' },
  { from: 71, to: 91, type: 'ladder' },

  // Snakes (13)
  { from: 16, to: 6, type: 'snake' },
  { from: 40, to: 3, type: 'snake' },
  { from: 46, to: 25, type: 'snake' },
  { from: 49, to: 11, type: 'snake' },
  { from: 62, to: 19, type: 'snake' },
  { from: 64, to: 60, type: 'snake' },
  { from: 72, to: 12, type: 'snake' },
  { from: 74, to: 53, type: 'snake' },
  { from: 88, to: 18, type: 'snake' },
  { from: 89, to: 68, type: 'snake' },
  { from: 92, to: 88, type: 'snake' },
  { from: 95, to: 75, type: 'snake' },
  { from: 97, to: 25, type: 'snake' },
  { from: 99, to: 7, type: 'snake' },
];

// Build lookup map for quick access
export const BOARD_CONFIG: Record<number, number> = {};
for (const item of SNAKES_AND_LADDERS) {
  BOARD_CONFIG[item.from] = item.to;
}

// Player colors for SNL
export const SNL_PLAYER_COLORS = [
  { name: 'Red', color: '#ef4444', glow: 'rgba(239,68,68,0.5)' },
  { name: 'Blue', color: '#3b82f6', glow: 'rgba(59,130,246,0.5)' },
  { name: 'Green', color: '#22c55e', glow: 'rgba(34,197,94,0.5)' },
  { name: 'Yellow', color: '#eab308', glow: 'rgba(234,179,8,0.5)' },
];

// Convert cell number (1-100) to row,col (0-indexed)
// Board numbering goes bottom-to-top, alternating direction each row
export function cellToRowCol(cellNum: number): { row: number; col: number } {
  if (cellNum < 1 || cellNum > 100) return { row: 9, col: 0 };

  const idx = cellNum - 1;
  const rowFromBottom = Math.floor(idx / BOARD_SIZE);
  const row = (BOARD_SIZE - 1) - rowFromBottom; // flip to top-indexed
  const colInRow = idx % BOARD_SIZE;

  // Even rows from bottom go left-to-right, odd rows go right-to-left
  const col = rowFromBottom % 2 === 0 ? colInRow : (BOARD_SIZE - 1 - colInRow);

  return { row, col };
}

// Get the cell number at a given grid position
export function rowColToCell(row: number, col: number): number {
  const rowFromBottom = (BOARD_SIZE - 1) - row;
  const colInRow = rowFromBottom % 2 === 0 ? col : (BOARD_SIZE - 1 - col);
  return rowFromBottom * BOARD_SIZE + colInRow + 1;
}

// Get cell center position as percentage (for SVG overlay positioning)
export function getCellCenter(cellNum: number): { x: number; y: number } {
  const { row, col } = cellToRowCol(cellNum);
  const cellSize = 100 / BOARD_SIZE;
  return {
    x: col * cellSize + cellSize / 2,
    y: row * cellSize + cellSize / 2,
  };
}

// Snake colors for visual variety
export const SNAKE_COLORS = [
  ['#22c55e', '#15803d'],
  ['#ef4444', '#b91c1c'],
  ['#8b5cf6', '#6d28d9'],
  ['#f97316', '#c2410c'],
  ['#06b6d4', '#0e7490'],
];

// Ladder colors
export const LADDER_COLORS = [
  '#92400e',
  '#78350f',
  '#854d0e',
  '#713f12',
];
