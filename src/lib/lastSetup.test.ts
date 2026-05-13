import { describe, it, expect, beforeEach } from 'vitest';
import { getLastSetup, saveLastSetup, loadOptionsOrDefault } from './lastSetup';
import { DEFAULT_OPTIONS } from '../games/flow/store';

class FakeStorage {
  private data = new Map<string, string>();
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
  clear() { this.data.clear(); }
}

beforeEach(() => {
  // @ts-expect-error attaching window.localStorage shim for node test env
  globalThis.window = { localStorage: new FakeStorage() };
});

describe('getLastSetup', () => {
  it('returns null when nothing is saved', () => {
    expect(getLastSetup()).toBeNull();
  });

  it('round-trips a valid setup', () => {
    saveLastSetup({
      count: 3,
      names: ['Alice', 'Bob', 'Bot 1'],
      colors: ['blue', 'red', 'green'],
      isCPU: [false, false, true],
      options: DEFAULT_OPTIONS,
    });
    const loaded = getLastSetup();
    expect(loaded?.count).toBe(3);
    expect(loaded?.names).toEqual(['Alice', 'Bob', 'Bot 1']);
    expect(loaded?.isCPU).toEqual([false, false, true]);
  });

  it('rejects malformed saves (count missing, arrays missing, out-of-range count)', () => {
    // count too low
    saveLastSetup({
      count: 1 as unknown as 2,
      names: ['Solo'],
      colors: ['blue'],
      isCPU: [false],
    });
    expect(getLastSetup()).toBeNull();

    // wrong shape entirely
    window.localStorage.setItem('ludopitara.v1.lastSetup', JSON.stringify({ junk: true }));
    expect(getLastSetup()).toBeNull();
  });
});

describe('loadOptionsOrDefault', () => {
  it('returns DEFAULT_OPTIONS when nothing is saved', () => {
    expect(loadOptionsOrDefault()).toEqual(DEFAULT_OPTIONS);
  });

  it('falls through to defaults when a saved setup has no options field', () => {
    saveLastSetup({
      count: 2,
      names: ['A', 'B'],
      colors: ['blue', 'green'],
      isCPU: [false, false],
      // no options key → loadOptionsOrDefault returns DEFAULT_OPTIONS.
    });
    expect(loadOptionsOrDefault()).toEqual(DEFAULT_OPTIONS);
  });

  it('merges partial saved options with defaults (forward-compat for new fields)', () => {
    // Simulate a save from an older build that lacks `cpuDifficulty`.
    saveLastSetup({
      count: 2,
      names: ['A', 'B'],
      colors: ['blue', 'green'],
      isCPU: [false, true],
      options: {
        // @ts-expect-error simulating older shape (no cpuDifficulty)
        ludo: { oneTokenOut: true, firstHomeWins: false },
        snl: { autoStart: false },
      },
    });
    const opts = loadOptionsOrDefault();
    // The user's pick wins.
    expect(opts.ludo.oneTokenOut).toBe(true);
    // The missing field is backfilled from defaults.
    expect(opts.ludo.cpuDifficulty).toBe('medium');
  });
});
