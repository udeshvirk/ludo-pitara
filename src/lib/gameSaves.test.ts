import { describe, it, expect, beforeEach } from 'vitest';
import { detectSavedFor, detectSaved, STORAGE_KEYS } from './gameSaves';
import { save } from './persist';

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

function ludoSave(opts: { players: number; tokensOut: number; gamePhase?: string }) {
  return {
    players: Array.from({ length: opts.players }, (_, i) => ({
      id: String(i),
      name: `P${i + 1}`,
      color: 'red',
      tokens: [
        { id: '0', color: 'red', state: i === 0 ? 'active' : 'yard', pathIndex: i === 0 ? 5 : -1 },
        { id: '1', color: 'red', state: 'yard', pathIndex: -1 },
        { id: '2', color: 'red', state: 'yard', pathIndex: -1 },
        { id: '3', color: 'red', state: 'yard', pathIndex: -1 },
      ].slice(0, opts.tokensOut + 1),
    })),
    gamePhase: opts.gamePhase ?? 'rolling',
  };
}

describe('detectSavedFor', () => {
  it('returns null when no save exists', () => {
    expect(detectSavedFor('ludo')).toBeNull();
    expect(detectSavedFor('snl')).toBeNull();
  });

  it('returns null when the saved game is finished', () => {
    save(STORAGE_KEYS.LUDO, ludoSave({ players: 2, tokensOut: 1, gamePhase: 'finished' }));
    expect(detectSavedFor('ludo')).toBeNull();
  });

  it('returns a hint with player count and tokens-out when a Ludo save is in progress', () => {
    save(STORAGE_KEYS.LUDO, ludoSave({ players: 3, tokensOut: 1 }));
    const result = detectSavedFor('ludo');
    expect(result).not.toBeNull();
    expect(result!.game).toBe('ludo');
    expect(result!.hint).toMatch(/3 players/);
    expect(result!.hint).toMatch(/tokens out/);
  });

  it('returns null for SNL when checking Ludo (and vice versa)', () => {
    save(STORAGE_KEYS.LUDO, ludoSave({ players: 2, tokensOut: 1 }));
    expect(detectSavedFor('snl')).toBeNull();
  });
});

describe('detectSaved', () => {
  it('prefers Ludo when both saves exist', () => {
    save(STORAGE_KEYS.LUDO, ludoSave({ players: 2, tokensOut: 1 }));
    save(STORAGE_KEYS.SNL, {
      players: [{ id: '0', name: 'P1', color: '#f00', position: 5 }],
      gamePhase: 'rolling',
      layout: [{ from: 17, to: 4, type: 'snake' }],
    });
    const result = detectSaved();
    expect(result?.game).toBe('ludo');
  });

  it('falls through to SNL when only SNL exists', () => {
    save(STORAGE_KEYS.SNL, {
      players: [{ id: '0', name: 'P1', color: '#f00', position: 12 }],
      gamePhase: 'rolling',
      layout: [{ from: 17, to: 4, type: 'snake' }],
    });
    const result = detectSaved();
    expect(result?.game).toBe('snl');
    expect(result?.hint).toMatch(/top at 12/);
  });
});
