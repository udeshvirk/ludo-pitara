// Picks the best token for a CPU to move. Behaviour depends on
// difficulty (defaults to 'medium', the original heuristic).
//
//   easy   — picks at random, with a small bias toward freeing a yard
//            token on a 6 (so a 6 isn't wasted moving an already-out
//            token if a fresh one could enter the path).
//   medium — original heuristic: capture > home > yard exit > farthest
//            back, with a star-square bonus and an over-stack penalty.
//   hard   — medium plus opponent-threat awareness. A move that leaves
//            the moved token within 6 squares of a captureable opponent
//            on the next turn takes a hefty penalty unless it's a
//            capture or lands on a safe square.

import type { Player, Token, CPUDifficulty } from './types';
import { getBoardPosition, isSafePosition } from './constants';

interface Move {
  tokenId: string;
  score: number;
}

export function pickCpuToken(
  player: Player,
  selectableIds: string[],
  diceValue: number,
  allPlayers: Player[],
  difficulty: CPUDifficulty = 'medium',
): string | null {
  if (selectableIds.length === 0) return null;
  if (selectableIds.length === 1) return selectableIds[0];

  if (difficulty === 'easy') {
    // On a 6, prefer freeing a yard token if one is selectable —
    // wasting a 6 on an already-out token is the most common cheap
    // mistake, and we want Easy to be "novice", not "self-sabotaging".
    if (diceValue === 6) {
      const yardChoice = selectableIds.find(id => {
        const t = player.tokens.find(tk => tk.id === id);
        return t?.state === 'yard';
      });
      if (yardChoice) return yardChoice;
    }
    return selectableIds[Math.floor(Math.random() * selectableIds.length)];
  }

  const moves: Move[] = selectableIds.map((id) => {
    const token = player.tokens.find(t => t.id === id)!;
    return { tokenId: id, score: scoreMove(token, diceValue, player, allPlayers, difficulty) };
  });
  moves.sort((a, b) => b.score - a.score);
  return moves[0].tokenId;
}

function scoreMove(
  token: Token,
  diceValue: number,
  player: Player,
  allPlayers: Player[],
  difficulty: CPUDifficulty,
): number {
  if (token.state === 'yard') {
    // Free a token from the yard. Worth doing but less than a capture.
    return 200 + (4 - countActive(player));
  }

  const newPathIndex = token.pathIndex + diceValue;
  if (newPathIndex >= 56) {
    // Reaches home — high reward, plus a tiny bonus for actually finishing.
    return 600 + (newPathIndex - 56);
  }

  let score = 100 + newPathIndex; // farther forward = better tiebreaker

  // Capture detection
  let willCapture = false;
  if (newPathIndex < 51 && !isSafePosition(player.color, newPathIndex)) {
    const newPos = getBoardPosition(player.color, newPathIndex);
    for (const other of allPlayers) {
      if (other.color === player.color) continue;
      for (const ot of other.tokens) {
        if (ot.state !== 'active') continue;
        const op = getBoardPosition(other.color, ot.pathIndex);
        if (op.row === newPos.row && op.col === newPos.col) {
          score += 1000; // captures dominate
          willCapture = true;
        }
      }
    }
  }

  // Slight bonus for landing on a star (safety)
  const landsSafe = isSafePosition(player.color, newPathIndex);
  if (landsSafe) score += 30;

  // Mild penalty for a token that's already very advanced — don't over-stack
  if (token.pathIndex > 45) score -= 10;

  // Hard: look one turn ahead. If this move leaves the token in the
  // capture range of an opponent (1..6 cells behind, same path), it's
  // a risky move. Captures and safe-landings skip the penalty.
  if (difficulty === 'hard' && newPathIndex < 51 && !willCapture && !landsSafe) {
    const myPos = getBoardPosition(player.color, newPathIndex);
    for (const other of allPlayers) {
      if (other.color === player.color) continue;
      for (const ot of other.tokens) {
        if (ot.state !== 'active') continue;
        // Distance from the opponent token to our landing cell along
        // their own path. If any opponent can land here on a 1..6,
        // we're a target. Walking their path forward up to 6 steps is
        // cheap (≤ 6 lookups per opponent token).
        for (let step = 1; step <= 6; step++) {
          const reach = ot.pathIndex + step;
          if (reach > 56) break;
          const pos = getBoardPosition(other.color, reach);
          if (pos.row === myPos.row && pos.col === myPos.col) {
            score -= 120; // big enough to dominate the +30 safe bonus
            break;
          }
        }
      }
    }
  }

  return score;
}

function countActive(player: Player): number {
  return player.tokens.filter(t => t.state === 'active').length;
}
