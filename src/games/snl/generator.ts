// Per-game randomized Snakes & Ladders layout.
//
// The earlier version added a body-intersection rule, but a board where
// no two specials may cross gets squeezed into roughly parallel
// arrangements. Real Snakes & Ladders boards have crossings — the visual
// variety comes *from* mixed slopes. So crossings are allowed; the rules
// that actually matter for "doesn't look cluttered" are:
//
//   - No two specials share a cell (head/tail/base/top all unique).
//   - Same-type anchors stay Manhattan ≥ 3 apart (no two ladders
//     starting / ending at almost the same place).
//   - Cross-type anchors stay Manhattan ≥ 2 apart.
//   - Specials cross at least one full row (no stub-length specials).
//   - Three iconic 90s snakes are mandatory: head ≥ 98 → single digit,
//     head 95–96 → 30s, plus a third in 91–94. Their heads legitimately
//     share row 0 so their inter-spacing is relaxed.
//   - One guaranteed 3–6 row early-game ladder.
//   - Cells 1 and 100 reserved. No ladder ends at 100.

import type { SnakeOrLadder } from './types';

const BOARD_SIZE = 10;

interface Point { row: number; col: number; }

interface Anchor { cell: number; type: 'snake' | 'ladder'; }

function randInt(lo: number, hi: number): number {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function rowOf(cell: number): number {
  return Math.floor((cell - 1) / BOARD_SIZE);
}

// Convert a cell number to its rendered (row, col) on the boustrophedon
// 10×10 board. Required for spatial spacing — numeric cell distance is
// misleading because cells 11 and 20 share a row but live on opposite
// columns.
function rowColOf(cell: number): Point {
  const idx = cell - 1;
  const rowFromBottom = Math.floor(idx / BOARD_SIZE);
  const row = BOARD_SIZE - 1 - rowFromBottom;
  const colInRow = idx % BOARD_SIZE;
  const col = rowFromBottom % 2 === 0 ? colInRow : BOARD_SIZE - 1 - colInRow;
  return { row, col };
}

function manhattan(a: Point, b: Point): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

interface Constraints {
  type: 'snake' | 'ladder';
  fromRange: [number, number];
  toRange: [number, number];
  minRowSpan: number;
  maxRowSpan: number;
  minSameTypeDist: number; // anchor-to-anchor for matching type
  minCrossTypeDist: number; // anchor-to-anchor for the other type
  // Minimum cell-number impact (|from - to|). Filters out long-body /
  // low-impact specials like 61 → 51, where the bezier covers half the
  // board but the player only loses 10 cells. 0 = no minimum.
  minImpact?: number;
}

function pickSpecial(
  occupied: Set<number>,
  anchors: Anchor[],
  c: Constraints,
  attempts = 200,
): SnakeOrLadder | null {
  for (let i = 0; i < attempts; i++) {
    const from = randInt(c.fromRange[0], c.fromRange[1]);
    const to = randInt(c.toRange[0], c.toRange[1]);
    if (c.type === 'snake' && from <= to) continue;
    if (c.type === 'ladder' && to <= from) continue;
    if (occupied.has(from) || occupied.has(to)) continue;

    const rowSpan = Math.abs(rowOf(from) - rowOf(to));
    if (rowSpan < c.minRowSpan || rowSpan > c.maxRowSpan) continue;

    if (c.minImpact && Math.abs(from - to) < c.minImpact) continue;

    const fromPt = rowColOf(from);
    const toPt = rowColOf(to);

    // Anchor proximity. Same-type anchors get a stricter cushion so two
    // ladders never start adjacent; cross-type can be closer because the
    // ornaments are visually distinguishable.
    let bad = false;
    for (const a of anchors) {
      const dist = c.type === a.type ? c.minSameTypeDist : c.minCrossTypeDist;
      if (manhattan(fromPt, rowColOf(a.cell)) < dist) { bad = true; break; }
      if (manhattan(toPt, rowColOf(a.cell)) < dist) { bad = true; break; }
    }
    if (bad) continue;

    return { from, to, type: c.type };
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
    anchors.push({ cell: item.from, type: item.type });
    anchors.push({ cell: item.to, type: item.type });
    items.push(item);
    return true;
  };

  // Mandatory 90s snakes — relaxed spacing because all three heads sit
  // in row 0 by definition.
  tryAdd(pickSpecial(occupied, anchors, {
    type: 'snake', fromRange: [98, 99], toRange: [2, 9],
    minRowSpan: 8, maxRowSpan: 9, minSameTypeDist: 1, minCrossTypeDist: 2,
  }));
  tryAdd(pickSpecial(occupied, anchors, {
    type: 'snake', fromRange: [95, 96], toRange: [30, 40],
    minRowSpan: 5, maxRowSpan: 7, minSameTypeDist: 1, minCrossTypeDist: 2,
  }));
  tryAdd(pickSpecial(occupied, anchors, {
    type: 'snake', fromRange: [91, 94], toRange: [25, 60],
    minRowSpan: 3, maxRowSpan: 7, minSameTypeDist: 1, minCrossTypeDist: 2,
  }));

  // Guaranteed early-game big climb (3–6 rows, ≥ 30 cells).
  tryAdd(pickSpecial(occupied, anchors, {
    type: 'ladder', fromRange: [4, 18], toRange: [55, 88],
    minRowSpan: 3, maxRowSpan: 6, minImpact: 30,
    minSameTypeDist: 3, minCrossTypeDist: 2,
  }));

  // Second guaranteed big jump — rooted in the mid board and climbing
  // 3–5 rows. This gives players a second realistic escape route.
  tryAdd(pickSpecial(occupied, anchors, {
    type: 'ladder', fromRange: [22, 50], toRange: [62, 90],
    minRowSpan: 3, maxRowSpan: 5, minImpact: 25,
    minSameTypeDist: 3, minCrossTypeDist: 2,
  }));

  // Three mid-board snakes — meaningful drops (≥ 12 cells) so they're
  // not "long body, low impact" like 61 → 51.
  let midSnakes = 0;
  for (let i = 0; i < 200 && midSnakes < 3; i++) {
    if (tryAdd(pickSpecial(occupied, anchors, {
      type: 'snake',
      fromRange: [25, 85],
      toRange: [4, 70],
      minRowSpan: 2,
      maxRowSpan: 4,
      minImpact: 14,
      minSameTypeDist: 3,
      minCrossTypeDist: 2,
    }))) midSnakes++;
  }

  // At most 1 short ladder (1-row climb) for variety. The rest of the
  // ladders are 2-3 row climbs with at least 12 cells of impact, so they
  // actually help the player.
  tryAdd(pickSpecial(occupied, anchors, {
    type: 'ladder',
    fromRange: [10, 70],
    toRange: [15, 85],
    minRowSpan: 1,
    maxRowSpan: 1,
    minImpact: 8,
    minSameTypeDist: 3,
    minCrossTypeDist: 2,
  }));

  // Three medium ladders. minImpact ≥ 14 means each ladder advances you
  // by at least one-and-a-half rows of progress.
  let mediumLadders = 0;
  for (let i = 0; i < 250 && mediumLadders < 3; i++) {
    if (tryAdd(pickSpecial(occupied, anchors, {
      type: 'ladder',
      fromRange: [4, 75],
      toRange: [15, 90],
      minRowSpan: 2,
      maxRowSpan: 3,
      minImpact: 14,
      minSameTypeDist: 3,
      minCrossTypeDist: 2,
    }))) mediumLadders++;
  }

  return items;
}

export function buildLayoutLookup(layout: SnakeOrLadder[]): Record<number, number> {
  const map: Record<number, number> = {};
  for (const item of layout) map[item.from] = item.to;
  return map;
}
