import { useEffect, useRef } from 'react';
import { recordGame, type GameKey } from './stats';

// Record the result the first time the game flips to 'finished'.
// recordedRef gates this per-game; it resets when the game leaves the
// 'finished' phase (e.g. Play Again puts gamePhase back to 'setup').
//
// Both Ludo and SNL game pages used to inline this exact effect with
// only the game-id literal differing. One hook, two callers.
export function useRecordOnFinish(
  gameId: GameKey,
  finished: boolean,
  playerNames: string[],
  winnerName: string | undefined,
): void {
  const recordedRef = useRef(false);
  useEffect(() => {
    if (!finished) {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current || !winnerName) return;
    recordedRef.current = true;
    recordGame(gameId, playerNames, winnerName);
  }, [gameId, finished, playerNames, winnerName]);
}
