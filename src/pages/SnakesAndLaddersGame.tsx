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

  // Board sizing —
  //   Phone (portrait viewport): board is mildly portrait at 5:6 width:
  //     height. Cells become slightly tall, but not stretched.
  //   Wide / iPad (landscape viewport): board is square, sized to use
  //     the remaining horizontal space alongside the side rails. This
  //     prevents the big empty gutters on iPad landscape that a
  //     portrait board left behind.
  // The grid + SVG overlay both stretch via preserveAspectRatio="none",
  // so changing the wrapper's aspect ratio is enough.
  const boardWrapperStyle = isWide
    ? {
        aspectRatio: '1',
        // Whichever is the binding constraint: vertical budget, or
        // horizontal space minus two side rails (~150px each + gaps).
        height: 'min(calc(100vh - 100px), calc(100vw - 320px), 1000px)',
      }
    : {
        aspectRatio: '5 / 6',
        height: 'min(calc(100vh - 220px), calc(98vw * 6 / 5))',
      };

  return (
    <PhoneShell decorative={false} fluid>
      <Header title="Snakes & Ladders" onBack={() => { resetGame(); navigate('/select'); }} />

      {isWide ? (
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'minmax(140px, 1fr) auto minmax(140px, 1fr)',
            alignItems: 'center',
            gap: 14,
            padding: '0 10px 10px',
            maxWidth: 1600,
            margin: '0 auto',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
            {leftRailSlots(playerCount).map((idx, i) => (
              <SNLPlayerHalfRow key={`l-${i}`} slots={[idx]} top={false} onRoll={rollDice} compact />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ ...boardWrapperStyle, position: 'relative' }}>
              <SNLBoard />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
            {rightRailSlots(playerCount).map((idx, i) => (
              <SNLPlayerHalfRow key={`r-${i}`} slots={[idx]} top={false} onRoll={rollDice} compact />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 10px 10px', overflow: 'hidden', gap: 8 }}>
          <div style={{ width: '100%', maxWidth: '98vw' }}>
            <SNLPlayerHalfRow
              slots={topSlotsForCount(playerCount)}
              top
              onRoll={rollDice}
            />
          </div>

          <div style={{ ...boardWrapperStyle, alignSelf: 'center' }}>
            <SNLBoard />
          </div>

          <div style={{ width: '100%', maxWidth: '98vw' }}>
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
