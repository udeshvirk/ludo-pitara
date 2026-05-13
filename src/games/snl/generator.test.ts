import { describe, it, expect } from 'vitest';
import {
  generateSNLLayout,
  buildLayoutLookup,
  makeRNG,
  randomBoardCode,
  normaliseBoardCode,
} from './generator';

describe('makeRNG', () => {
  it('produces the same sequence from the same seed', () => {
    const a = makeRNG(12345);
    const b = makeRNG(12345);
    const seqA = Array.from({ length: 8 }, () => a());
    const seqB = Array.from({ length: 8 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produces a different sequence from a different seed', () => {
    const a = Array.from({ length: 8 }, makeRNG(1));
    const b = Array.from({ length: 8 }, makeRNG(2));
    // Same first call would be coincidence; check overall sequences.
    expect(a).not.toEqual(b);
  });

  it('xorshift output lies in [0, 1)', () => {
    const rng = makeRNG(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('generateSNLLayout', () => {
  it('is deterministic for a given board code', () => {
    const a = generateSNLLayout('K7Q3MX');
    const b = generateSNLLayout('K7Q3MX');
    expect(a).toEqual(b);
  });

  it('different codes produce different layouts', () => {
    const a = generateSNLLayout('K7Q3MX');
    const b = generateSNLLayout('ABCDEF');
    expect(a).not.toEqual(b);
  });

  it('never anchors a snake/ladder on cells 1 or 100', () => {
    const layout = generateSNLLayout('AAAAAA');
    for (const item of layout) {
      expect(item.from).not.toBe(1);
      expect(item.to).not.toBe(1);
      expect(item.from).not.toBe(100);
      expect(item.to).not.toBe(100);
    }
  });

  it('no two entities share a cell', () => {
    const layout = generateSNLLayout('SAMPLE');
    const cells = layout.flatMap(e => [e.from, e.to]);
    expect(new Set(cells).size).toBe(cells.length);
  });

  it('snakes go DOWN (from > to), ladders go UP (from < to)', () => {
    const layout = generateSNLLayout('GAME01');
    for (const item of layout) {
      if (item.type === 'snake')  expect(item.from).toBeGreaterThan(item.to);
      if (item.type === 'ladder') expect(item.from).toBeLessThan(item.to);
    }
  });

  it('all 7 mandatory snakes are placed', () => {
    const layout = generateSNLLayout('TEST01');
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

describe('randomBoardCode', () => {
  it('returns a 6-character code from the legibility alphabet', () => {
    const code = randomBoardCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  });

  it('does not include the confusable characters I/L/O/0/1', () => {
    for (let i = 0; i < 500; i++) {
      const code = randomBoardCode();
      expect(code).not.toMatch(/[ILO01]/);
    }
  });
});

describe('normaliseBoardCode', () => {
  it('upper-cases, trims, and strips non-alphanumeric characters', () => {
    expect(normaliseBoardCode('  k7-q3.mx  ')).toBe('K7Q3MX');
  });

  it('caps the length at 6 characters', () => {
    expect(normaliseBoardCode('ABCDEFGH')).toBe('ABCDEF');
  });

  it('returns empty string for blank/garbage input', () => {
    expect(normaliseBoardCode('   ')).toBe('');
    expect(normaliseBoardCode('!!! @@@')).toBe('');
  });
});
