// Picks the best token for a CPU to move. Ranks (highest first):
// 1. Captures an opponent — preferred always.
// 2. Brings a token home (exact roll into home column).
// 3. Frees a token from the yard (only on a 6).
// 4. Otherwise the farthest-back active token, so progress stays even.

import type { Player, Token } from './types';
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
): string | null {
  if (selectableIds.length === 0) return null;
  if (selectableIds.length === 1) return selectableIds[0];

  const moves: Move[] = selectableIds.map((id) => {
    const token = player.tokens.find(t => t.id === id)!;
    return { tokenId: id, score: scoreMove(token, diceValue, player, allPlayers) };
  });
  moves.sort((a, b) => b.score - a.score);
  return moves[0].tokenId;
}

function scoreMove(token: Token, diceValue: number, player: Player, allPlayers: Player[]): number {
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
  if (newPathIndex < 51 && !isSafePosition(player.color, newPathIndex)) {
    const newPos = getBoardPosition(player.color, newPathIndex);
    for (const other of allPlayers) {
      if (other.color === player.color) continue;
      for (const ot of other.tokens) {
        if (ot.state !== 'active') continue;
        const op = getBoardPosition(other.color, ot.pathIndex);
        if (op.row === newPos.row && op.col === newPos.col) {
          score += 1000; // captures dominate
        }
      }
    }
  }

  // Slight bonus for landing on a star (safety)
  if (isSafePosition(player.color, newPathIndex)) score += 30;

  // Mild penalty for a token that's already very advanced — don't over-stack
  if (token.pathIndex > 45) score -= 10;

  return score;
}

function countActive(player: Player): number {
  return player.tokens.filter(t => t.state === 'active').length;
}
