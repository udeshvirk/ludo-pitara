import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneShell from '../components/ui/PhoneShell';
import Header from '../components/ui/Header';
import { useSNLStore } from '../games/snl/store';
import SNLBoard from '../games/snl/components/SNLBoard';
import SNLPlayerHalfRow from '../games/snl/components/SNLPlayerHalfRow';
import WinnerModal from '../components/WinnerModal';
import { useFlow } from '../games/flow/store';
import { useLayoutMode } from '../lib/useLayout';
import { recordGame } from '../lib/stats';

// Map the player-colour key chosen on PlayerSetup ('red' | 'green' |
// 'yellow' | 'blue') to the hex used by the SNL board. Falls back to
// passing the value through (so a hex from Play-Again still works).
const SNL_HEX_BY_NAME: Record<string, string> = {
  red: '#e53935',
  blue: '#1e6fdb',
  green: '#2e9d4f',
  yellow: '#d99e00',
};
const toSnlHex = (c: string) => SNL_HEX_BY_NAME[c] ?? c;

const SnakesAndLaddersGame: React.FC = () => {
  const navigate = useNavigate();
  const initialized = useRef(false);
  const recordedRef = useRef(false);
  const flowPlayers = useFlow(s => s.players);
  const { players, currentPlayerIndex, gamePhase, winner, isRolling, diceValue, rollDice, initGame, resetGame } = useSNLStore();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (gamePhase !== 'setup' && players.length > 0) return;
    if (!flowPlayers.length) {
      navigate('/select');
      return;
    }
    const names = flowPlayers.map(p => p.name);
    const cpuFlags = flowPlayers.map(p => p.isCPU);
    const colors = flowPlayers.map(p => toSnlHex(p.color));
    initGame(flowPlayers.length, names, cpuFlags, colors);
  }, [flowPlayers, navigate, initGame, gamePhase, players.length]);

  // Record the result the first time the game flips to 'finished'.
  // Resets on Play Again because resetGame() restores gamePhase to
  // 'setup', which clears the ref via the early return below.
  useEffect(() => {
    if (gamePhase !== 'finished') {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current || !winner) return;
    recordedRef.current = true;
    recordGame('snl', players.map(p => p.name), winner.name);
  }, [gamePhase, winner, players]);

  // CPU autoplay — auto-roll for CPU players' turns.
  const currentPlayer = players[currentPlayerIndex];
  useEffect(() => {
    if (!currentPlayer?.isCPU) return;
    if (gamePhase === 'rolling' && !isRolling && diceValue === null) {
      const t = setTimeout(rollDice, 700);
      return () => clearTimeout(t);
    }
  }, [currentPlayer, gamePhase, isRolling, diceValue, rollDice]);

  const playerCount = players.length;
  const layoutMode = useLayoutMode();
  const isWide = layoutMode === 'wide';

  // Board sizing — pure flex layout, no hand-tuned chrome heights.
  //
  // Pod rows are flex-shrink: 0 (always show their natural height).
  // The middle section has `flex: 1, minHeight/minWidth: 0` so it
  // takes whatever vertical (or horizontal, in wide mode) space is
  // left over after the pods + header.
  //
  // The board itself is `width: 100% + aspectRatio: 5/6 + maxHeight:
  // 100%`. Modern browsers honor aspect-ratio with max-height: when
  // the derived height exceeds maxHeight, both height and width are
  // shrunk together to keep the 5:6 ratio. On long/narrow phones the
  // board is width-bound (5:6 portrait); on iPad-style viewports it's
  // height-bound (still 5:6, just smaller). Either way the cap is
  // built in — no risk of a stretched board on tall phones.
  const boardStyle: React.CSSProperties = {
    width: '100%',
    aspectRatio: '5 / 6',
    maxHeight: '100%',
    position: 'relative',
  };

  return (
    <PhoneShell decorative={false} fluid>
      <Header title="Snakes & Ladders" onBack={() => { resetGame(); navigate('/select'); }} />

      {isWide ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'stretch',
            gap: 14,
            padding: '0 13px 13px',
            maxWidth: 1600,
            margin: '0 auto',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <div style={{ flex: '0 0 150px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, minWidth: 0 }}>
            {leftRailSlots(playerCount).map((idx, i) => (
              <SNLPlayerHalfRow key={`l-${i}`} slots={[idx]} top={false} onRoll={rollDice} compact />
            ))}
          </div>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={boardStyle}>
              <SNLBoard />
            </div>
          </div>
          <div style={{ flex: '0 0 150px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, minWidth: 0 }}>
            {rightRailSlots(playerCount).map((idx, i) => (
              <SNLPlayerHalfRow key={`r-${i}`} slots={[idx]} top={false} onRoll={rollDice} compact />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', padding: '6px 13px 13px', overflow: 'hidden', gap: 18 }}>
          <div style={{ flexShrink: 0 }}>
            <SNLPlayerHalfRow
              slots={topSlotsForCount(playerCount)}
              top
              onRoll={rollDice}
            />
          </div>

          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={boardStyle}>
              <SNLBoard />
            </div>
          </div>

          <div style={{ flexShrink: 0 }}>
            <SNLPlayerHalfRow
              slots={bottomSlotsForCount(playerCount)}
              top={false}
              onRoll={rollDice}
            />
          </div>
        </div>
      )}

      <WinnerModal
        isOpen={gamePhase === 'finished' && winner !== null}
        winnerName={winner?.name || ''}
        winnerColor={winner?.color || 'var(--gold-hi)'}
        onPlayAgain={() => {
          const count = players.length;
          const snapshotNames = players.map(p => p.name);
          const snapshotCpu = players.map(p => p.isCPU ?? false);
          const snapshotColors = players.map(p => p.color);
          resetGame();
          initGame(count, snapshotNames, snapshotCpu, snapshotColors);
        }}
        onGoHome={() => { resetGame(); navigate('/'); }}
      />
    </PhoneShell>
  );
};

// Slot layout — pods sit at the four corners of the board.
//   2 players  → diagonal: P0 bottom-left, P1 top-right
//   3 players  → P0 bottom-left, P1 top-left, P2 top-right
//   4 players  → all four corners (P0 BL, P1 BR, P2 TL, P3 TR)
function topSlotsForCount(count: number): Array<number | null> {
  if (count === 2) return [null, 1];
  if (count === 3) return [1, 2];
  return [2, 3];
}

function bottomSlotsForCount(count: number): Array<number | null> {
  if (count === 2) return [0, null];
  if (count === 3) return [0, null];
  return [0, 1];
}

function leftRailSlots(count: number): number[] {
  if (count === 2) return [0];
  if (count === 3) return [0, 1];
  return [0, 1];
}

function rightRailSlots(count: number): number[] {
  if (count === 2) return [1];
  if (count === 3) return [2];
  return [2, 3];
}

export default SnakesAndLaddersGame;
