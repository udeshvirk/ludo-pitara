import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneShell from '../components/ui/PhoneShell';
import Header from '../components/ui/Header';
import SoundToggle from '../components/ui/SoundToggle';
import { useSNLStore } from '../games/snl/store';
import SNLBoard from '../games/snl/components/SNLBoard';
import SNLPlayerHalfRow from '../games/snl/components/SNLPlayerHalfRow';
import WinnerModal from '../components/WinnerModal';
import ConfirmExitModal from '../components/ConfirmExitModal';
import LiveRegion from '../components/ui/LiveRegion';
import { useFlow } from '../games/flow/store';
import { useLayoutMode } from '../lib/useLayout';
import { useRecordOnFinish } from '../lib/useRecordOnFinish';

// Map the player-colour key chosen on PlayerSetup ('red' | 'green' |
// 'yellow' | 'blue') to the hex used by the SNL board. Falls back to
// passing the value through (so a hex from Play-Again still works).
const SNL_HEX_BY_NAME: Record<string, string> = {
  red: '#cf304b',
  blue: '#286cd2',
  green: '#12965b',
  yellow: '#d7a719',
};
const toSnlHex = (c: string) => SNL_HEX_BY_NAME[c] ?? c;

const SnakesAndLaddersGame: React.FC = () => {
  const navigate = useNavigate();
  const initialized = useRef(false);
  const flowPlayers = useFlow(s => s.players);
  const flowOptions = useFlow(s => s.options);
  // Per-field selectors so the page only re-renders on the slices it
  // uses (avoid whole-store subscription pulling the board on every
  // unrelated set() like `message` / `lastAction` ticks).
  const players = useSNLStore(s => s.players);
  const currentPlayerIndex = useSNLStore(s => s.currentPlayerIndex);
  const gamePhase = useSNLStore(s => s.gamePhase);
  const winner = useSNLStore(s => s.winner);
  const isRolling = useSNLStore(s => s.isRolling);
  const diceValue = useSNLStore(s => s.diceValue);
  const message = useSNLStore(s => s.message);
  const rollDice = useSNLStore(s => s.rollDice);
  const initGame = useSNLStore(s => s.initGame);
  const resetGame = useSNLStore(s => s.resetGame);
  const [confirmExit, setConfirmExit] = useState(false);

  // See LudoGame for the back-confirmation rationale. Leaving without
  // resetGame() preserves the save so the user can resume.
  const handleBack = () => {
    if (gamePhase === 'setup' || gamePhase === 'finished') {
      resetGame();
      navigate('/select');
    } else {
      setConfirmExit(true);
    }
  };

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
    initGame(flowPlayers.length, names, cpuFlags, colors, flowOptions.snl);
  }, [flowPlayers, flowOptions, navigate, initGame, gamePhase, players.length]);

  useRecordOnFinish(
    'snl',
    gamePhase === 'finished',
    React.useMemo(() => players.map(p => p.name), [players]),
    winner?.name,
  );

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
  const isPhone = layoutMode === 'phone';

  // Board width = min(viewport-width budget, viewport-height budget).
  // The pods sit immediately above/below at gap 18, so the board is
  // explicitly sized via calc and centered horizontally — no flex-1
  // wrapper that would pad gutters between the board and the pods.
  // Every device uses square cells; stacked controls or side rails
  // determine the available space without stretching the artwork.
  // Height-primary aspect-ratio sizing — see LudoGame for the
  // matching `max-height = max-width` clamp pattern that keeps the
  // board square even when the parent row is taller than wide.
  const boardStyle: React.CSSProperties = isWide
    ? {
        // Wide rails: 2 × 180 + 2×14 (board↔rail gaps) + 2×13 (page padding) = 414.
        height: '100%',
        aspectRatio: '1',
        maxWidth: 'calc(100vw - 414px)',
        maxHeight: 'calc(100vw - 414px)',
        position: 'relative',
      }
    : {
        flex: 1,
        minHeight: 0,
        aspectRatio: '1',
        maxWidth: isPhone ? 'calc(100vw - 18px)' : 'calc(100vw - 26px)',
        maxHeight: isPhone ? 'calc(100vw - 18px)' : 'calc(100vw - 26px)',
        alignSelf: 'center',
        position: 'relative',
      };

  return (
    <PhoneShell decorative={false} fluid>
      <LiveRegion text={message} />
      <Header title="Snakes & Ladders" onBack={handleBack} action={<SoundToggle />} />

      {isWide ? (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            // `stretch` lets the board's `height: 100%` resolve against
            // the row's actual height. Rails center their pods via
            // their own flex layout.
            alignItems: 'stretch',
            justifyContent: 'center',
            gap: 14,
            // Top padding leaves room for the board's raised pastel frame,
            // which is a box-shadow drawn outside the board (overflow
            // is hidden here, so it would otherwise be clipped).
            padding: '12px 13px 18px',
            maxWidth: 1600,
            margin: '0 auto',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <div style={{ width: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
            {leftRailSlots(playerCount).map((idx, i) => (
              <SNLPlayerHalfRow key={`l-${i}`} slots={[idx]} top={false} compact arrowSide="right" />
            ))}
          </div>
          <div style={boardStyle}>
            <SNLBoard />
          </div>
          <div style={{ width: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
            {rightRailSlots(playerCount).map((idx, i) => (
              <SNLPlayerHalfRow key={`r-${i}`} slots={[idx]} top={false} compact arrowSide="left" />
            ))}
          </div>
        </div>
      ) : (
        <div className={isPhone ? 'snl-phone-layout' : undefined} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', padding: isPhone ? '10px 9px 12px' : '14px 13px 13px', overflow: 'hidden', gap: isPhone ? 24 : 18 }}>
          <SNLPlayerHalfRow slots={topSlotsForCount(playerCount)} top />
          <div style={boardStyle}>
            <SNLBoard />
          </div>
          <SNLPlayerHalfRow slots={bottomSlotsForCount(playerCount)} top={false} />
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
          // See LudoGame for why options are captured before reset.
          const opts = useSNLStore.getState().options;
          resetGame();
          initGame(count, snapshotNames, snapshotCpu, snapshotColors, opts);
        }}
        onGoHome={() => { resetGame(); navigate('/'); }}
      />

      <ConfirmExitModal
        isOpen={confirmExit}
        onCancel={() => setConfirmExit(false)}
        onConfirm={() => { setConfirmExit(false); navigate('/select'); }}
      />
    </PhoneShell>
  );
};

// Slot layout — pods sit at the four corners of the board. Turn order
// follows a clockwise spiral starting at bottom-left, matching Ludo:
//   2 players → diagonal: P0 BL, P1 TR
//   3 players → P0 BL, P1 TL, P2 TR
//   4 players → P0 BL, P1 TL, P2 TR, P3 BR (CW around the board)
function topSlotsForCount(count: number): Array<number | null> {
  if (count === 2) return [null, 1];
  if (count === 3) return [1, 2];
  return [1, 2];
}

function bottomSlotsForCount(count: number): Array<number | null> {
  if (count === 2) return [0, null];
  if (count === 3) return [0, null];
  return [0, 3];
}

// Wide-landscape rails mirror the CW order: left rail holds the two
// left-side seats (P1 top = TL, P0 bottom = BL); right rail holds the
// right-side seats (P2 top = TR, P3 bottom = BR).
function leftRailSlots(count: number): number[] {
  if (count === 2) return [0];
  if (count === 3) return [1, 0];
  return [1, 0];
}

function rightRailSlots(count: number): number[] {
  if (count === 2) return [1];
  if (count === 3) return [2];
  return [2, 3];
}

export default SnakesAndLaddersGame;
