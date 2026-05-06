export const BOARD_SIZE = 10;
export const TOTAL_CELLS = 100;

// Player colors for SNL — match the Ludo player palette.
export const SNL_PLAYER_COLORS = [
  { name: 'Red', color: '#e53935', glow: 'rgba(229,57,53,0.5)' },
  { name: 'Blue', color: '#1e6fdb', glow: 'rgba(30,111,219,0.5)' },
  { name: 'Green', color: '#2e9d4f', glow: 'rgba(46,157,79,0.5)' },
  { name: 'Yellow', color: '#d99e00', glow: 'rgba(217,158,0,0.5)' },
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
