import { describe, it, expect, beforeEach, vi } from 'vitest';
import { load, save, clear, saveDebounced, flushSaves } from './persist';

// jsdom isn't loaded for this suite (test env is 'node'), so polyfill
// just enough of localStorage for the helpers under test. A simple
// Map-backed implementation is sufficient.
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

describe('save / load / clear', () => {
  it('save → load round-trips a JSON-serialisable value', () => {
    save('greet', { hello: 'world', n: 42 });
    expect(load('greet', null)).toEqual({ hello: 'world', n: 42 });
  });

  it('load returns the fallback when the key is missing', () => {
    expect(load('missing', 'fallback')).toBe('fallback');
  });

  it('load swallows parse errors and returns the fallback', () => {
    window.localStorage.setItem('ludopitara.v1.broken', '{not json}');
    expect(load('broken', 'safe')).toBe('safe');
  });

  it('clear removes the key', () => {
    save('temp', 1);
    clear('temp');
    expect(load('temp', null)).toBeNull();
  });
});

describe('saveDebounced', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('writes only once for many rapid calls (trailing edge)', () => {
    saveDebounced('k', 1);
    saveDebounced('k', 2);
    saveDebounced('k', 3);
    expect(load('k', 0)).toBe(0); // nothing flushed yet
    vi.advanceTimersByTime(260);
    expect(load('k', 0)).toBe(3); // latest value wins
  });

  it('clear cancels a pending debounced write for the same key', () => {
    saveDebounced('k', 99);
    clear('k');
    vi.advanceTimersByTime(500);
    // Nothing should land — the pending write was cancelled along
    // with the clear. Without that cancellation, the trailing save
    // would have overwritten the clear.
    expect(load('k', null)).toBeNull();
  });

  it('flushSaves drains all pending writes synchronously', () => {
    saveDebounced('a', 'A');
    saveDebounced('b', 'B');
    flushSaves();
    expect(load('a', null)).toBe('A');
    expect(load('b', null)).toBe('B');
  });
});
