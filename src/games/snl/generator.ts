// Per-game randomized Snakes & Ladders layout.
//
// House rules baked in:
//   - 3 snakes in the 90s: one head ≥ 98 dropping to a single-digit cell,
//     one head 95–96 dropping to ~30–40, one more filler.
//   - 3–4 additional snakes scattered across mid-board.
//   - 6–7 ladders. None end at 100 (the player must roll exactly).
//   - No two specials share a cell (head/tail/base/top all unique).
//   - Cells 1 and 100 are reserved (start / finish).
//   - Specials never start and end inside the same row of 10 — the SVG
//     would render as a stub and the move feels meaningless.

import type { SnakeOrLadder } from './types';

const BOARD_SIZE = 10;

function randInt(lo: number, hi: number): number {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function rowOf(cell: number): number {
  return Math.floor((cell - 1) / BOARD_SIZE);
}

function pickSnake(
  occupied: Set<number>,
  headLo: number,
  headHi: number,
  tailLo: number,
  tailHi: number,
  attempts = 60,
): SnakeOrLadder | null {
  for (let i = 0; i < attempts; i++) {
    const from = randInt(headLo, headHi);
    const to = randInt(tailLo, tailHi);
    if (from - to < 6) continue; // require a meaningful drop
    if (occupied.has(from) || occupied.has(to)) continue;
    if (rowOf(from) === rowOf(to)) continue;
    return { from, to, type: 'snake' };
  }
  return null;
}

function pickLadder(
  occupied: Set<number>,
  baseLo: number,
  baseHi: number,
  topLo: number,
  topHi: number,
  attempts = 60,
): SnakeOrLadder | null {
  for (let i = 0; i < attempts; i++) {
    const from = randInt(baseLo, baseHi);
    const to = randInt(topLo, topHi);
    if (to - from < 8) continue; // require a meaningful climb
    if (occupied.has(from) || occupied.has(to)) continue;
    if (rowOf(from) === rowOf(to)) continue;
    return { from, to, type: 'ladder' };
  }
  return null;
}

export function generateSNLLayout(): SnakeOrLadder[] {
  // Cells already taken. 1 (start) and 100 (finish) are reserved so nothing
  // teleports a player off-start or out of victory.
  const occupied = new Set<number>([1, 100]);
  const items: SnakeOrLadder[] = [];

  const tryAdd = (item: SnakeOrLadder | null): boolean => {
    if (!item) return false;
    if (occupied.has(item.from) || occupied.has(item.to)) return false;
    occupied.add(item.from);
    occupied.add(item.to);
    items.push(item);
    return true;
  };

  // Required scary snakes in the 90s.
  tryAdd(pickSnake(occupied, 98, 99, 2, 9));
  tryAdd(pickSnake(occupied, 95, 96, 30, 40));
  tryAdd(pickSnake(occupied, 91, 94, 12, 60));

  // 3–4 mid-board snakes for variety.
  let extraSnakes = 0;
  for (let i = 0; i < 80 && extraSnakes < 4; i++) {
    if (tryAdd(pickSnake(occupied, 35, 88, 5, 60))) extraSnakes++;
  }

  // 6–7 ladders, none reaching 100 (top capped at 95). Occasional mid-late
  // ladder so the board isn't a pure death zone above 50.
  let ladders = 0;
  for (let i = 0; i < 100 && ladders < 7; i++) {
    if (tryAdd(pickLadder(occupied, 2, 75, 15, 95))) ladders++;
  }

  // Guarantee at least one big early-game climb.
  tryAdd(pickLadder(occupied, 3, 18, 55, 88));

  return items;
}

// Derive a fast `from → to` lookup from a layout.
export function buildLayoutLookup(layout: SnakeOrLadder[]): Record<number, number> {
  const map: Record<number, number> = {};
  for (const item of layout) map[item.from] = item.to;
  return map;
}
