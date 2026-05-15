import { describe, it, expect } from 'vitest';
import {
  computeMoveOutcome,
  intermediatePathIndex,
  detectCaptures,
  nextFinishOrder,
  isPlayerFinished,
  isGameOver,
} from './moves';
import type { Player, Token, PlayerColor } from './types';

// ─── Fixtures ─────────────────────────────────────────────────────────

function makeToken(color: PlayerColor, idx: number, pathIndex: number, state: Token['state']): Token {
  return { id: `${color}-${idx}`, color, displayColor: color, state, pathIndex };
}

function makePlayer(color: PlayerColor, tokens: Token[], finishOrder = 0): Player {
  return { id: color, name: color, color, displayColor: color, tokens, finishOrder, lastRoll: null };
}

// ─── computeMoveOutcome ───────────────────────────────────────────────

describe('computeMoveOutcome', () => {
  it('yard exit on a 6: single jump to start cell (index 0)', () => {
    const token = makeToken('blue', 0, -1, 'yard');
    const o = computeMoveOutcome(token, 6);
    expect(o.fromYard).toBe(true);
    expect(o.startIndex).toBe(-1);
    expect(o.finalIndex).toBe(0);
    expect(o.finalState).toBe('active');
    expect(o.stepsCount).toBe(1);
  });

  it('regular path step: stepsCount equals the dice value', () => {
    const token = makeToken('red', 0, 10, 'active');
    const o = computeMoveOutcome(token, 4);
    expect(o.fromYard).toBe(false);
    expect(o.finalIndex).toBe(14);
    expect(o.finalState).toBe('active');
    expect(o.stepsCount).toBe(4);
  });

  it('lands on home (pathIndex 56): finalState becomes "home"', () => {
    const token = makeToken('green', 0, 53, 'active');
    const o = computeMoveOutcome(token, 3);
    expect(o.finalIndex).toBe(56);
    expect(o.finalState).toBe('home');
  });

  it('overshoots 56: clamps finalIndex to 56 (still home)', () => {
    const token = makeToken('yellow', 0, 53, 'active');
    const o = computeMoveOutcome(token, 6);
    expect(o.finalIndex).toBe(56);
    expect(o.finalState).toBe('home');
    // Walks 53 → 54 → 55 → 56, which is 3 steps (not 6).
    expect(o.stepsCount).toBe(3);
  });
});

describe('intermediatePathIndex', () => {
  it('yard exit stays at 0 for every step', () => {
    const o = computeMoveOutcome(makeToken('blue', 0, -1, 'yard'), 6);
    expect(intermediatePathIndex(o, 1)).toBe(0);
  });

  it('path move: walks startIndex + step', () => {
    const o = computeMoveOutcome(makeToken('red', 0, 10, 'active'), 4);
    expect(intermediatePathIndex(o, 1)).toBe(11);
    expect(intermediatePathIndex(o, 4)).toBe(14);
  });
});

// ─── detectCaptures ──────────────────────────────────────────────────

describe('detectCaptures', () => {
  it('returns null when no opponent shares the landing cell', () => {
    // Red lands at path index 5; no other tokens at all.
    const red = makePlayer('red', [makeToken('red', 0, 5, 'active')]);
    const green = makePlayer('green', [makeToken('green', 0, -1, 'yard')]);
    expect(detectCaptures([red, green], 'red', 5, 'active')).toBeNull();
  });

  it('returns null when the landing cell is a safe square', () => {
    // Red's start index (0) is a SAFE_POSITION_ON_MAIN. Green token sits
    // on red's start cell (green pathIndex such that getBoardPosition
    // green→that pathIndex = red's start). The start cell at path
    // index 0 for red is also a star — so even with a collision,
    // capture must be suppressed.
    const red = makePlayer('red', [makeToken('red', 0, 0, 'active')]);
    // Green's start (green pathIndex 39 for the same main-path cell —
    // green starts 13 cells later, so green needs to be at (52 - 13)
    // = 39 to share red's start. Easier: just put a green token at the
    // same main-path cell via path index 39 for green = cell index 0
    // on main path.
    const green = makePlayer('green', [makeToken('green', 0, 39, 'active')]);
    expect(detectCaptures([red, green], 'red', 0, 'active')).toBeNull();
  });

  it('captures an opponent on a non-safe path cell', () => {
    // Red lands at path index 5 (not safe). Green has a token on the
    // same main-path cell (green's path index 5 - 13 + 52 = 44 mod 52
    // → green pathIndex 44 corresponds to the same cell as red 5).
    const red = makePlayer('red', [makeToken('red', 0, 5, 'active')]);
    const green = makePlayer('green', [makeToken('green', 0, 44, 'active')]);
    const result = detectCaptures([red, green], 'red', 5, 'active');
    expect(result).not.toBeNull();
    expect(result!.flyingCaptures).toHaveLength(1);
    expect(result!.flyingCaptures[0].tokenId).toBe('green-0');
    // The captured token is now back in the yard.
    expect(result!.players[1].tokens[0].state).toBe('yard');
    expect(result!.players[1].tokens[0].pathIndex).toBe(-1);
  });

  it('does NOT capture a same-coloured stack', () => {
    // Red lands at path index 5 (not safe). Another red token already
    // sits there. Same color → no capture.
    const red = makePlayer('red', [
      makeToken('red', 0, 5, 'active'),
      makeToken('red', 1, 5, 'active'),
    ]);
    expect(detectCaptures([red], 'red', 5, 'active')).toBeNull();
  });

  it('does not capture when token finishes home', () => {
    // finalState 'home' → no capture detection.
    const red = makePlayer('red', [makeToken('red', 0, 56, 'home')]);
    const green = makePlayer('green', [makeToken('green', 0, 44, 'active')]);
    expect(detectCaptures([red, green], 'red', 56, 'home')).toBeNull();
  });

  it('does not capture on the home stretch', () => {
    // Home stretch is path index 51+. Suppress capture there.
    const red = makePlayer('red', [makeToken('red', 0, 53, 'active')]);
    const green = makePlayer('green', [makeToken('green', 0, 53, 'active')]);
    expect(detectCaptures([red, green], 'red', 53, 'active')).toBeNull();
  });
});

// ─── finish + game over ──────────────────────────────────────────────

describe('isPlayerFinished', () => {
  it('false when any token is still in yard or on path', () => {
    const p = makePlayer('blue', [
      makeToken('blue', 0, 56, 'home'),
      makeToken('blue', 1, 56, 'home'),
      makeToken('blue', 2, 30, 'active'),
      makeToken('blue', 3, 56, 'home'),
    ]);
    expect(isPlayerFinished(p)).toBe(false);
  });

  it('true when all four tokens are home', () => {
    const p = makePlayer('blue', Array.from({ length: 4 }, (_, i) =>
      makeToken('blue', i, 56, 'home')));
    expect(isPlayerFinished(p)).toBe(true);
  });
});

describe('nextFinishOrder', () => {
  it('returns 0 if the player is not yet finished', () => {
    const p = makePlayer('red', [makeToken('red', 0, 10, 'active')]);
    expect(nextFinishOrder(p, [p])).toBe(0);
  });

  it('returns existing finishOrder if already assigned', () => {
    const p = makePlayer('red', Array.from({ length: 4 }, (_, i) =>
      makeToken('red', i, 56, 'home')), 2);
    expect(nextFinishOrder(p, [p])).toBe(2);
  });

  it('returns placed-count + 1 for a newly finished player', () => {
    const winner = makePlayer('green', Array.from({ length: 4 }, (_, i) =>
      makeToken('green', i, 56, 'home')), 1);
    const justFinished = makePlayer('red', Array.from({ length: 4 }, (_, i) =>
      makeToken('red', i, 56, 'home')));
    expect(nextFinishOrder(justFinished, [winner, justFinished])).toBe(2);
  });
});

describe('isGameOver', () => {
  it('false while 2+ players remain unfinished', () => {
    const a = makePlayer('red',   [makeToken('red',   0, 10, 'active')]);
    const b = makePlayer('green', [makeToken('green', 0, 10, 'active')]);
    const c = makePlayer('blue',  [makeToken('blue',  0, 10, 'active')]);
    expect(isGameOver([a, b, c])).toBe(false);
  });

  it('true when only one unfinished player remains', () => {
    const winner1 = makePlayer('red',   [makeToken('red', 0, 56, 'home')], 1);
    const winner2 = makePlayer('green', [makeToken('green', 0, 56, 'home')], 2);
    const last    = makePlayer('blue',  [makeToken('blue', 0, 10, 'active')]);
    expect(isGameOver([winner1, winner2, last])).toBe(true);
  });
});
