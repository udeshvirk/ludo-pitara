// Shared stack-placement: when N tokens share a cell, pick a size and a
// position (left/top %, relative to the cell) for the i-th token so they
// fan out diagonally and the pile-up is visible. Returns absolute
// percentages of the cell — caller just passes them straight to
// `style={{ left, top, width, height }}`. Using cell-percent (instead of
// transform offsets which are percent-of-element) keeps the visible
// offset proportional to the cell, not the (often tiny) token.

const STACK_OFFSETS: Record<number, ReadonlyArray<{ x: number; y: number }>> = {
  1: [{ x: 0, y: 0 }],
  2: [{ x: -10, y: -10 }, { x: 10, y: 10 }],
  3: [{ x: -10, y: -10 }, { x: 10, y: -10 }, { x: 0, y: 10 }],
  4: [{ x: -10, y: -10 }, { x: 10, y: -10 }, { x: -10, y: 10 }, { x: 10, y: 10 }],
};

// "split" layout for mixed-colour stacks (partner mode: teammate
// tokens sharing a cell). Tokens are pushed apart on the X axis so
// each has its own tap zone — at ±10 diagonal the second token always
// covered the first and the first became unselectable. Only used when
// the cell actually has tokens of different seat colours, so same-
// colour stacks (the only kind in solo Ludo) keep the diagonal look.
const SPLIT_OFFSETS: Record<number, ReadonlyArray<{ x: number; y: number }>> = {
  1: [{ x: 0, y: 0 }],
  2: [{ x: -20, y: 0 }, { x: 20, y: 0 }],
  3: [{ x: -22, y: -8 }, { x: 22, y: -8 }, { x: 0, y: 14 }],
  4: [{ x: -20, y: -12 }, { x: 20, y: -12 }, { x: -20, y: 12 }, { x: 20, y: 12 }],
};
const SPLIT_BASE_SIZE: Record<number, number> = { 1: 70, 2: 40, 3: 36, 4: 34 };

// `scale` shrinks (or grows) the token relative to the cell while
// keeping the same fan-out offsets — SNL passes 0.85 so its denser
// board doesn't get crowded by full-size coins. Defaults to 1 so Ludo
// callers see no change.
export function stackPlacement(
  stackSize: number,
  stackIndex: number,
  scale = 1,
  layout: 'diagonal' | 'split' = 'diagonal',
): {
  sizePercent: number;
  leftPercent: number;
  topPercent: number;
} {
  const clamped = Math.min(Math.max(stackSize, 1), 4) as 1 | 2 | 3 | 4;
  const baseSize = layout === 'split'
    ? SPLIT_BASE_SIZE[clamped]
    : (stackSize > 2 ? 42 : stackSize > 1 ? 50 : 70);
  const sizePercent = baseSize * scale;
  const offsets = layout === 'split' ? SPLIT_OFFSETS : STACK_OFFSETS;
  const offset = offsets[clamped][stackIndex] ?? { x: 0, y: 0 };
  // Place the token's top-left so that its CENTER lands at (50% + offset).
  return {
    sizePercent,
    leftPercent: 50 + offset.x - sizePercent / 2,
    topPercent: 50 + offset.y - sizePercent / 2,
  };
}
