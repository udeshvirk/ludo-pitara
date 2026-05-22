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

// `scale` shrinks (or grows) the token relative to the cell while
// keeping the same fan-out offsets — SNL passes 0.85 so its denser
// board doesn't get crowded by full-size coins. Defaults to 1 so Ludo
// callers see no change.
export function stackPlacement(stackSize: number, stackIndex: number, scale = 1): {
  sizePercent: number;
  leftPercent: number;
  topPercent: number;
} {
  const baseSize = stackSize > 2 ? 42 : stackSize > 1 ? 50 : 70;
  const sizePercent = baseSize * scale;
  const clamped = Math.min(Math.max(stackSize, 1), 4) as 1 | 2 | 3 | 4;
  const offset = STACK_OFFSETS[clamped][stackIndex] ?? { x: 0, y: 0 };
  // Place the token's top-left so that its CENTER lands at (50% + offset).
  return {
    sizePercent,
    leftPercent: 50 + offset.x - sizePercent / 2,
    topPercent: 50 + offset.y - sizePercent / 2,
  };
}
