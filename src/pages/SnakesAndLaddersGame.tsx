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

  // Board width = min(viewport-width budget, viewport-height budget).
  // The pods sit immediately above/below at gap 18, so the board is
  // explicitly sized via calc and centered horizontally — no flex-1
  // wrapper that would pad gutters between the board and the pods.
  //   phone  → 5:6 (slightly tall cells, Ludo King reference)
  //   tablet → 1:1 (square fills iPad-portrait width)
  //   wide   → 1:1 (square between the two side rails)
  // Chrome budget: header ≈ 64, top+bottom padding ≈ 19, two pods ≈ 70
  // each, two gaps of 18 → ~260 vertical chrome on phone/tablet.
  const isPhone = layoutMode === 'phone';
  const boardStyle: React.CSSProperties = isWide
    ? {
        width: 'min(calc(100vw - 354px), calc(100vh - 90px))',
        aspectRatio: '1',
        position: 'relative',
      }
    : isPhone
      ? {
          width: 'min(calc(100vw - 26px), calc((100vh - 260px) * 5 / 6))',
          aspectRatio: '5 / 6',
          alignSelf: 'center',
          position: 'relative',
        }
      : {
          width: 'min(calc(100vw - 26px), calc(100vh - 260px))',
          aspectRatio: '1',
          alignSelf: 'center',
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
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            padding: '0 13px 13px',
            maxWidth: 1600,
            margin: '0 auto',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <div style={{ width: 150, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {leftRailSlots(playerCount).map((idx, i) => (
              <SNLPlayerHalfRow key={`l-${i}`} slots={[idx]} top={false} onRoll={rollDice} compact />
            ))}
          </div>
          <div style={boardStyle}>
            <SNLBoard />
          </div>
          <div style={{ width: 150, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rightRailSlots(playerCount).map((idx, i) => (
              <SNLPlayerHalfRow key={`r-${i}`} slots={[idx]} top={false} onRoll={rollDice} compact />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', padding: '6px 13px 13px', overflow: 'hidden', gap: 18 }}>
          <SNLPlayerHalfRow
            slots={topSlotsForCount(playerCount)}
            top
            onRoll={rollDice}
          />
          <div style={boardStyle}>
            <SNLBoard />
          </div>
          <SNLPlayerHalfRow
            slots={bottomSlotsForCount(playerCount)}
            top={false}
            onRoll={rollDice}
          />
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
