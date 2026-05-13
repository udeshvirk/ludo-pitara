// Pure helpers for Ludo moves. Everything here is a deterministic
// function of its inputs — no state reads, no side effects, no
// setTimeouts. Keeps the store's selectToken focused on orchestration
// (sound, haptics, the dice-settle / walk / settle pipeline) and lets
// the move logic be exercised in isolation.

import type { Player, PlayerColor, Token, TokenState, CaptureFly } from './types';
import {
  YARD_POSITIONS,
  isSafePosition,
  getBoardPosition,
} from './constants';

// ─── Move outcome ─────────────────────────────────────────────────────

export interface MoveOutcome {
  fromYard: boolean;
  startIndex: number;
  finalIndex: number;
  finalState: TokenState; // 'active' or 'home'
  // Yard exits are a single jump (yard → start cell). Path moves walk
  // cell-by-cell so framer-motion's layoutId doesn't tween diagonally
  // across path corners.
  stepsCount: number;
}

export function computeMoveOutcome(token: Token, diceValue: number): MoveOutcome {
  const fromYard = token.state === 'yard';
  const startIndex = token.pathIndex;
  const finalIndex = fromYard ? 0 : Math.min(startIndex + diceValue, 56);
  const finalState: TokenState = !fromYard && finalIndex >= 56 ? 'home' : 'active';
  const stepsCount = fromYard ? 1 : finalIndex - startIndex;
  return { fromYard, startIndex, finalIndex, finalState, stepsCount };
}

// Position on the path at step `step` of a walk. step=0 is the starting
// cell; step=stepsCount is the final cell. Yard exits stay at index 0
// (no intermediate cells).
export function intermediatePathIndex(outcome: MoveOutcome, step: number): number {
  return outcome.fromYard ? 0 : outcome.startIndex + step;
}

// ─── Capture detection ───────────────────────────────────────────────

export interface CaptureResult {
  // Players array with captured tokens sent back to yard.
  players: Player[];
  flyingCaptures: CaptureFly[];
  // Names of players whose tokens were captured (one entry per
  // captured token, in encounter order).
  capturedNames: string[];
}

// Returns `null` if no capture occurred. A capture is impossible if
// the landing cell is home, on the home stretch, or on a safe square.
export function detectCaptures(
  players: Player[],
  currentColor: PlayerColor,
  finalIndex: number,
  finalState: TokenState,
): CaptureResult | null {
  if (finalState !== 'active') return null;
  if (finalIndex >= 51) return null; // home stretch
  if (isSafePosition(currentColor, finalIndex)) return null;

  const landing = getBoardPosition(currentColor, finalIndex);
  const flyingCaptures: CaptureFly[] = [];
  const capturedNames: string[] = [];
  const updated = players.map(p => ({ ...p, tokens: [...p.tokens] }));

  for (let pi = 0; pi < updated.length; pi++) {
    const opp = updated[pi];
    if (opp.color === currentColor) continue;
    for (let ti = 0; ti < opp.tokens.length; ti++) {
      const ot = opp.tokens[ti];
      if (ot.state !== 'active') continue;
      const op = getBoardPosition(ot.color, ot.pathIndex);
      if (op.row === landing.row && op.col === landing.col) {
        flyingCaptures.push({
          tokenId: ot.id,
          color: ot.color,
          displayColor: ot.displayColor,
          from: op,
          to: YARD_POSITIONS[ot.color][ti],
        });
        opp.tokens[ti] = { ...ot, state: 'yard', pathIndex: -1 };
        capturedNames.push(opp.name);
      }
    }
  }

  if (flyingCaptures.length === 0) return null;
  return { players: updated, flyingCaptures, capturedNames };
}

// ─── Finish & game-over ──────────────────────────────────────────────

export function isPlayerFinished(player: Player): boolean {
  return player.tokens.every(t => t.state === 'home');
}

// If the player has cleared all four tokens and hasn't been assigned a
// finishOrder yet, return their assigned rank (1 = first, 2 = second…).
// Returns 0 if no change is needed.
export function nextFinishOrder(player: Player, players: Player[]): number {
  if (player.finishOrder > 0) return player.finishOrder;
  if (!isPlayerFinished(player)) return 0;
  const placed = players.filter(p => p.finishOrder > 0).length;
  return placed + 1;
}

// True when only ≤1 unfinished player remains — game over.
export function isGameOver(players: Player[]): boolean {
  return players.filter(p => p.finishOrder === 0).length <= 1;
}
