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

