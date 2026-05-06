// Per-game randomized Snakes & Ladders layout.
//
// Goals (informed by user feedback that prior boards looked cluttered):
//   - Lower density: 5 snakes + 4 ladders ≈ 9 specials total. Plenty of
//     teleports without the board feeling like a maze.
//   - 3 mandatory snakes in the 90s — one head ≥ 98 dropping to a single
//     digit, one head 95–96 dropping to 30–40, one filler. These are the
//     iconic high-board punishments.
//   - Mid-board snakes capped at 2-row drops so they don't smear across
//     the board.
//   - Short ladders (≤ 3 rows) plus exactly one guaranteed long early-game
//     climb so the board isn't a pure death zone above 50.
//   - Spatial spacing: heads / bases are kept ≥ 2 cells apart from any
//     other special's anchor in 2-D Manhattan distance, so the SVG bodies
//     and head ornaments don't visually collide.
//   - No specials at cells 1 or 100. Ladders never end at 100 (must roll
//     exactly to win).
//   - Specials always cross at least one row, otherwise the bezier renders
//     as a stub.

import type { SnakeOrLadder } from './types';

const BOARD_SIZE = 10;

function randInt(lo: number, hi: number): number {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function rowOf(cell: number): number {
  return Math.floor((cell - 1) / BOARD_SIZE);
}

// Convert cell number → (row, col) on the 10×10 boustrophedon board so
// spacing checks reflect the actual rendered position, not just numeric
// proximity (cells 11 and 20 share a row but sit at opposite columns).
function rowColOf(cell: number): { row: number; col: number } {
  const idx = cell - 1;
  const rowFromBottom = Math.floor(idx / BOARD_SIZE);
  const row = BOARD_SIZE - 1 - rowFromBottom;
  const colInRow = idx % BOARD_SIZE;
  const col = rowFromBottom % 2 === 0 ? colInRow : BOARD_SIZE - 1 - colInRow;
  return { row, col };
}

function manhattan(a: number, b: number): number {
  const ra = rowColOf(a);
  const rb = rowColOf(b);
  return Math.abs(ra.row - rb.row) + Math.abs(ra.col - rb.col);
}

interface Anchor { cell: number; }

function tooClose(cell: number, anchors: Anchor[], minDist: number): boolean {
  return anchors.some(a => manhattan(cell, a.cell) < minDist);
}

function pickSnake(
  occupied: Set<number>,
  anchors: Anchor[],
  headLo: number,
  headHi: number,
  tailLo: number,
  tailHi: number,
  opts: { minRowDrop?: number; maxRowDrop?: number; minSpacing?: number } = {},
  attempts = 80,
): SnakeOrLadder | null {
  const minRowDrop = opts.minRowDrop ?? 1;
  const maxRowDrop = opts.maxRowDrop ?? Number.POSITIVE_INFINITY;
  const minSpacing = opts.minSpacing ?? 2;

  for (let i = 0; i < attempts; i++) {
    const from = randInt(headLo, headHi);
    const to = randInt(tailLo, tailHi);
    if (from <= to) continue;
    const rowDrop = rowOf(from) - rowOf(to);
    if (rowDrop < minRowDrop || rowDrop > maxRowDrop) continue;
    if (occupied.has(from) || occupied.has(to)) continue;
    if (tooClose(from, anchors, minSpacing) || tooClose(to, anchors, minSpacing)) continue;
    return { from, to, type: 'snake' };
  }
  return null;
}

function pickLadder(
  occupied: Set<number>,
  anchors: Anchor[],
  baseLo: number,
  baseHi: number,
  topLo: number,
  topHi: number,
  opts: { minRowClimb?: number; maxRowClimb?: number; minSpacing?: number } = {},
  attempts = 80,
): SnakeOrLadder | null {
  const minRowClimb = opts.minRowClimb ?? 1;
  const maxRowClimb = opts.maxRowClimb ?? Number.POSITIVE_INFINITY;
  const minSpacing = opts.minSpacing ?? 2;

  for (let i = 0; i < attempts; i++) {
    const from = randInt(baseLo, baseHi);
    const to = randInt(topLo, topHi);
    if (to <= from) continue;
    const rowClimb = rowOf(to) - rowOf(from);
    if (rowClimb < minRowClimb || rowClimb > maxRowClimb) continue;
    if (occupied.has(from) || occupied.has(to)) continue;
    if (tooClose(from, anchors, minSpacing) || tooClose(to, anchors, minSpacing)) continue;
    return { from, to, type: 'ladder' };
  }
  return null;
}

export function generateSNLLayout(): SnakeOrLadder[] {
  const occupied = new Set<number>([1, 100]);
  const anchors: Anchor[] = [];
  const items: SnakeOrLadder[] = [];

  const tryAdd = (item: SnakeOrLadder | null): boolean => {
    if (!item) return false;
    if (occupied.has(item.from) || occupied.has(item.to)) return false;
    occupied.add(item.from);
    occupied.add(item.to);
    anchors.push({ cell: item.from }, { cell: item.to });
    items.push(item);
    return true;
  };

  // Three mandatory snakes in the 90s. Spacing relaxed slightly because
  // they all share row 9 by definition.
  tryAdd(pickSnake(occupied, anchors, 98, 99, 2, 9, { minSpacing: 1 }));
  tryAdd(pickSnake(occupied, anchors, 95, 96, 30, 40, { minSpacing: 1 }));
  tryAdd(pickSnake(occupied, anchors, 91, 94, 25, 60, { minSpacing: 1 }));

  // Two short mid-board snakes (≤ 2-row drop) so they don't smear across
  // the board and clutter it.
  let mid = 0;
  for (let i = 0; i < 60 && mid < 2; i++) {
    if (tryAdd(pickSnake(occupied, anchors, 35, 80, 10, 70, { minRowDrop: 1, maxRowDrop: 2, minSpacing: 2 }))) mid++;
  }

  // One guaranteed early-game big climb (3–6 rows).
  tryAdd(pickLadder(occupied, anchors, 4, 16, 55, 85, { minRowClimb: 3, maxRowClimb: 6, minSpacing: 2 }));

  // Three short ladders (1–3 row climb). Top stays below 95 so the path
  // to 100 still requires a careful exact roll.
  let shortLadders = 0;
  for (let i = 0; i < 80 && shortLadders < 3; i++) {
    if (tryAdd(pickLadder(occupied, anchors, 8, 70, 18, 90, { minRowClimb: 1, maxRowClimb: 3, minSpacing: 2 }))) shortLadders++;
  }

  return items;
}

// Derive a fast `from → to` lookup from a layout.
export function buildLayoutLookup(layout: SnakeOrLadder[]): Record<number, number> {
  const map: Record<number, number> = {};
  for (const item of layout) map[item.from] = item.to;
  return map;
}
