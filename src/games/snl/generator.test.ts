import { describe, it, expect } from 'vitest';
import { generateSNLLayout, buildLayoutLookup } from './generator';

describe('generateSNLLayout', () => {
  it('never anchors a snake/ladder on cells 1 or 100', () => {
    const layout = generateSNLLayout();
    for (const item of layout) {
      expect(item.from).not.toBe(1);
      expect(item.to).not.toBe(1);
      expect(item.from).not.toBe(100);
      expect(item.to).not.toBe(100);
    }
  });

  it('no two entities share a cell', () => {
    const layout = generateSNLLayout();
    const cells = layout.flatMap(e => [e.from, e.to]);
    expect(new Set(cells).size).toBe(cells.length);
  });

  it('snakes go DOWN (from > to), ladders go UP (from < to)', () => {
    const layout = generateSNLLayout();
    for (const item of layout) {
      if (item.type === 'snake')  expect(item.from).toBeGreaterThan(item.to);
      if (item.type === 'ladder') expect(item.from).toBeLessThan(item.to);
    }
  });

  it('all 7 mandatory snakes are placed', () => {
    const layout = generateSNLLayout();
    const snakeCount = layout.filter(e => e.type === 'snake').length;
    // Mandatory 7 + up to 2 occasional.
    expect(snakeCount).toBeGreaterThanOrEqual(7);
    expect(snakeCount).toBeLessThanOrEqual(9);
  });
});

describe('buildLayoutLookup', () => {
  it('maps every from-cell to its to-cell', () => {
    const layout = [
      { from: 17, to: 4,  type: 'snake'  as const },
      { from: 9,  to: 31, type: 'ladder' as const },
    ];
    const lookup = buildLayoutLookup(layout);
    expect(lookup[17]).toBe(4);
    expect(lookup[9]).toBe(31);
    expect(lookup[5]).toBeUndefined();
  });

  it('returns the same object for the same layout reference (memoised)', () => {
    const layout = [{ from: 17, to: 4, type: 'snake' as const }];
    const a = buildLayoutLookup(layout);
    const b = buildLayoutLookup(layout);
    expect(a).toBe(b);
  });

  it('returns different objects for different layout references', () => {
    const a = buildLayoutLookup([{ from: 17, to: 4, type: 'snake' as const }]);
    const b = buildLayoutLookup([{ from: 17, to: 4, type: 'snake' as const }]);
    // Same content, different references → different cached result.
    expect(a).not.toBe(b);
  });
});
