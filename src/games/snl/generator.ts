// Per-game randomized Snakes & Ladders layout.
//
// Goals (taking user feedback into account):
//   - Solid density of teleports — boards with too few specials feel
//     empty. Target ~6 snakes + ~6 ladders.
//   - No two specials' bodies cross each other on the rendered board:
//     line-segment intersection check between every pair.
//   - Same-type anchors stay spatially apart (Manhattan ≥ 3 between two
//     ladder bases / tops, or two snake heads / tails) so we never get
//     "two ladders starting from almost the same point".
//   - Cross-type anchors keep at least Manhattan ≥ 2.
//   - Three iconic 90s snakes are still mandatory: head ≥ 98 → single
//     digit, head 95–96 → 30s, plus a third in 91–94. Their heads
//     legitimately share the same row so we relax their inter-spacing.
//   - One guaranteed early-game big climb (3–6 row ladder rooted in the
//     bottom two rows). The rest of the ladders cap at 3 rows so the
//     board doesn't turn into a freeway.
//   - Cells 1 and 100 reserved. No ladder ends at 100.

import type { SnakeOrLadder } from './types';

const BOARD_SIZE = 10;

interface Point { row: number; col: number; }

interface Anchor { cell: number; type: 'snake' | 'ladder'; role: 'head' | 'tail' | 'base' | 'top'; }

interface PlacedSegment {
  type: 'snake' | 'ladder';
  from: Point;
  to: Point;
}

function randInt(lo: number, hi: number): number {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function rowOf(cell: number): number {
  return Math.floor((cell - 1) / BOARD_SIZE);
}

// Convert a cell number to its rendered (row, col) on the boustrophedon
// 10×10 board. Required for spatial spacing and intersection checks —
// numeric cell distance is misleading because cells 11 and 20 share a
// row but live on opposite columns.
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

// Standard CCW-based segment-intersection test. Counts a real crossing
// only — touching at endpoints does NOT count, otherwise we'd reject
// every shared-anchor case (already handled separately).
function segmentsIntersect(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  function cross(a: Point, b: Point, c: Point): number {
    return (b.col - a.col) * (c.row - a.row) - (b.row - a.row) * (c.col - a.col);
  }
  const d1 = cross(p3, p4, p1);
  const d2 = cross(p3, p4, p2);
  const d3 = cross(p1, p2, p3);
  const d4 = cross(p1, p2, p4);
  if (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  ) {
    return true;
  }
  return false;
}

interface Constraints {
  type: 'snake' | 'ladder';
  fromRange: [number, number];
  toRange: [number, number];
  minRowSpan: number;
  maxRowSpan: number;
  minSameTypeDist: number; // anchor-to-anchor for matching type
  minCrossTypeDist: number; // anchor-to-anchor for the other type
}

function pickSpecial(
  occupied: Set<number>,
  anchors: Anchor[],
  segments: PlacedSegment[],
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

    const fromPt = rowColOf(from);
    const toPt = rowColOf(to);

    // Anchor proximity. Same-type anchors get a stricter cushion; cross-
    // type can be closer because the visuals are distinguishable.
    let bad = false;
    for (const a of anchors) {
      const dist = c.type === a.type ? c.minSameTypeDist : c.minCrossTypeDist;
      if (manhattan(fromPt, rowColOf(a.cell)) < dist) { bad = true; break; }
      if (manhattan(toPt, rowColOf(a.cell)) < dist) { bad = true; break; }
    }
    if (bad) continue;

    // Body intersection: candidate's straight line vs. every existing one.
    let crosses = false;
    for (const seg of segments) {
      if (segmentsIntersect(fromPt, toPt, seg.from, seg.to)) { crosses = true; break; }
    }
    if (crosses) continue;

    return { from, to, type: c.type };
  }
  return null;
}

export function generateSNLLayout(): SnakeOrLadder[] {
  const occupied = new Set<number>([1, 100]);
  const anchors: Anchor[] = [];
  const segments: PlacedSegment[] = [];
  const items: SnakeOrLadder[] = [];

  const tryAdd = (item: SnakeOrLadder | null): boolean => {
    if (!item) return false;
    if (occupied.has(item.from) || occupied.has(item.to)) return false;
    occupied.add(item.from);
    occupied.add(item.to);
    const from = rowColOf(item.from);
    const to = rowColOf(item.to);
    if (item.type === 'snake') {
      anchors.push({ cell: item.from, type: 'snake', role: 'head' });
      anchors.push({ cell: item.to, type: 'snake', role: 'tail' });
    } else {
      anchors.push({ cell: item.from, type: 'ladder', role: 'base' });
      anchors.push({ cell: item.to, type: 'ladder', role: 'top' });
    }
    segments.push({ type: item.type, from, to });
    items.push(item);
    return true;
  };

  // Mandatory 90s snakes — relaxed spacing because all three heads sit
  // in row 0 by definition.
  tryAdd(pickSpecial(occupied, anchors, segments, {
    type: 'snake', fromRange: [98, 99], toRange: [2, 9],
    minRowSpan: 8, maxRowSpan: 9, minSameTypeDist: 1, minCrossTypeDist: 2,
  }));
  tryAdd(pickSpecial(occupied, anchors, segments, {
    type: 'snake', fromRange: [95, 96], toRange: [30, 40],
    minRowSpan: 5, maxRowSpan: 7, minSameTypeDist: 1, minCrossTypeDist: 2,
  }));
  tryAdd(pickSpecial(occupied, anchors, segments, {
    type: 'snake', fromRange: [91, 94], toRange: [25, 60],
    minRowSpan: 3, maxRowSpan: 7, minSameTypeDist: 1, minCrossTypeDist: 2,
  }));

  // Place the guaranteed big climb (3–6 rows from near the bottom) before
  // the mid-board snakes — placing snakes first sometimes blocks all
  // candidate paths and we'd lose the early-game escape route.
  tryAdd(pickSpecial(occupied, anchors, segments, {
    type: 'ladder', fromRange: [4, 18], toRange: [55, 88],
    minRowSpan: 3, maxRowSpan: 6, minSameTypeDist: 3, minCrossTypeDist: 2,
  }));

  // Three mid-board snakes — short drops, kept well-spaced from existing
  // specials and never crossing them.
  let midSnakes = 0;
  for (let i = 0; i < 200 && midSnakes < 3; i++) {
    const placed = tryAdd(pickSpecial(occupied, anchors, segments, {
      type: 'snake',
      fromRange: [25, 85],
      toRange: [4, 70],
      minRowSpan: 1,
      maxRowSpan: 3,
      minSameTypeDist: 3,
      minCrossTypeDist: 2,
    }));
    if (placed) midSnakes++;
  }

  // Five more shorter ladders scattered through the board. Top capped at
  // 90 so the run-up to 100 still demands an exact roll.
  let extraLadders = 0;
  for (let i = 0; i < 250 && extraLadders < 5; i++) {
    const placed = tryAdd(pickSpecial(occupied, anchors, segments, {
      type: 'ladder',
      fromRange: [4, 75],
      toRange: [15, 90],
      minRowSpan: 1,
      maxRowSpan: 3,
      minSameTypeDist: 3,
      minCrossTypeDist: 2,
    }));
    if (placed) extraLadders++;
  }

  return items;
}

export function buildLayoutLookup(layout: SnakeOrLadder[]): Record<number, number> {
  const map: Record<number, number> = {};
  for (const item of layout) map[item.from] = item.to;
  return map;
}
