// Snakes & Ladders layout generator — spec-driven.
//
// Each snake / ladder is defined by inclusive cell ranges; the generator
// picks one cell at random from each range and verifies all cross-rules
// (no overlap, no adjacent snake heads, snake.start > snake.end,
// ladder.start < ladder.end). Cells 1 and 100 are reserved.
//
// "Primary" snakes / ladders are mandatory. "Occasional" snakes have a
// per-game probability so the board changes shape between sessions.

import type { SnakeOrLadder } from './types';

type Range = [number, number]; // both ends inclusive

// 7 mandatory snakes
const PRIMARY_SNAKES: Array<{ head: Range; tail: Range }> = [
  { head: [98, 99], tail: [2, 5] },
  { head: [92, 94], tail: [64, 67] },
  { head: [81, 82], tail: [60, 62] },
  { head: [68, 70], tail: [47, 50] },
  { head: [56, 59], tail: [34, 37] },
  { head: [41, 43], tail: [18, 20] },
  { head: [31, 33], tail: [12, 14] },
];

// Toggled per game so each session feels different.
const OCCASIONAL_SNAKES: Array<{ head: number; tail: Range; chance: number }> = [
  { head: 96, tail: [44, 47], chance: 0.6 },
  { head: 76, tail: [33, 35], chance: 0.6 },
];

// Ladder #2 has two alternate top ranges — pick one per game.
const LADDERS: Array<{ base: Range; tops: Range[] }> = [
  { base: [2, 4], tops: [[22, 25]] },
  { base: [7, 9], tops: [[45, 47], [62, 65]] },
  { base: [14, 17], tops: [[36, 38]] },
  { base: [28, 30], tops: [[54, 56]] },
  { base: [37, 39], tops: [[78, 80]] },
  { base: [31, 33], tops: [[68, 70]] },
  { base: [53, 56], tops: [[91, 94]] },
  { base: [62, 63], tops: [[82, 84]] },
  { base: [75, 77], tops: [[94, 96]] },
];

type RNG = () => number;

// Hash a 6-char board code into a 32-bit seed for the xorshift PRNG.
// FNV-1a-ish — small, no deps, mixes letters/digits reasonably.
function seedFromCode(code: string): number {
  let h = 2166136261;
  for (let i = 0; i < code.length; i++) {
    h ^= code.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) || 1;
}

export function makeRNG(seed: number): RNG {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x100000000;
  };
}

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // skip I/L/O/0/1 for readability

export function randomBoardCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

// Accept lowercased / spaced user input.
export function normaliseBoardCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

function expandRange(r: Range, exclude: Set<number>): number[] {
  const cells: number[] = [];
  for (let n = r[0]; n <= r[1]; n++) {
    if (!exclude.has(n)) cells.push(n);
  }
  return cells;
}

function pickRandom<T>(arr: T[], rng: RNG): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(rng() * arr.length)];
}

function shuffle<T>(arr: T[], rng: RNG): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isHeadAdjacent(cell: number, heads: Set<number>): boolean {
  return heads.has(cell - 1) || heads.has(cell + 1);
}

// Try to place a snake whose head is in `headRange` and tail is in
// `tailRange`, avoiding cells in `used`. Snake heads must not sit on a
// cell adjacent to an existing head. Returns true if placed.
function placeSnake(
  headOptions: number[],
  tailRange: Range,
  used: Set<number>,
  heads: Set<number>,
  out: SnakeOrLadder[],
  attempts: number,
  rng: RNG,
): boolean {
  const shuffledHeads = shuffle(headOptions, rng);
  for (let i = 0; i < Math.min(attempts, shuffledHeads.length); i++) {
    const head = shuffledHeads[i];
    if (used.has(head)) continue;
    if (isHeadAdjacent(head, heads)) continue;
    const tailCandidates = expandRange(tailRange, used);
    const tail = pickRandom(tailCandidates, rng);
    if (tail === null) continue;
    if (head <= tail) continue;
    used.add(head);
    used.add(tail);
    heads.add(head);
    out.push({ from: head, to: tail, type: 'snake' });
    return true;
  }
  return false;
}

function placeLadder(
  baseRange: Range,
  tops: Range[],
  used: Set<number>,
  out: SnakeOrLadder[],
  attempts: number,
  rng: RNG,
): boolean {
  for (let i = 0; i < attempts; i++) {
    const baseCandidates = expandRange(baseRange, used);
    const base = pickRandom(baseCandidates, rng);
    if (base === null) continue;
    const top = pickRandom(expandRange(pickRandom(tops, rng)!, used), rng);
    if (top === null) continue;
    if (top <= base) continue;
    used.add(base);
    used.add(top);
    out.push({ from: base, to: top, type: 'ladder' });
    return true;
  }
  return false;
}

// Seeded so the same board code always reproduces the same layout.
// Pass an empty/undefined code for a random board; the caller can read
// the actually-used code back via `randomBoardCode()` to display it.
export function generateSNLLayout(boardCode: string): SnakeOrLadder[] {
  const rng = makeRNG(seedFromCode(boardCode));
  // Cells 1 (start) and 100 (finish) are reserved so no special anchors there.
  const used = new Set<number>([1, 100]);
  const heads = new Set<number>();
  const layout: SnakeOrLadder[] = [];

  // Place primary snakes first — they're mandatory and have the tightest
  // cell-range constraints. Shuffling the order avoids systematic bias
  // when two specs share a cell window.
  for (const spec of shuffle(PRIMARY_SNAKES, rng)) {
    placeSnake(expandRange(spec.head, used), spec.tail, used, heads, layout, 30, rng);
  }

  // Probabilistic snakes — single-cell heads, so we either fit them or
  // skip without retrying.
  for (const spec of OCCASIONAL_SNAKES) {
    if (rng() > spec.chance) continue;
    placeSnake([spec.head], spec.tail, used, heads, layout, 1, rng);
  }

  // Ladders.
  for (const spec of shuffle(LADDERS, rng)) {
    placeLadder(spec.base, spec.tops, used, layout, 30, rng);
  }

  return layout;
}

// Memoised by layout reference — called once per roll, the layout
// itself doesn't change during a game, so we hand back the cached
// lookup for the same array. WeakMap keeps it GC-friendly across
// many rematches.
const lookupCache = new WeakMap<SnakeOrLadder[], Record<number, number>>();

export function buildLayoutLookup(layout: SnakeOrLadder[]): Record<number, number> {
  const cached = lookupCache.get(layout);
  if (cached) return cached;
  const map: Record<number, number> = {};
  for (const item of layout) map[item.from] = item.to;
  lookupCache.set(layout, map);
  return map;
}
