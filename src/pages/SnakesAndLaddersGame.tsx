import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneShell from '../components/ui/PhoneShell';
import Header from '../components/ui/Header';
import { useSNLStore } from '../games/snl/store';
import SNLBoard from '../games/snl/components/SNLBoard';
import SNLPlayerHalfRow from '../games/snl/components/SNLPlayerHalfRow';
import WinnerModal from '../components/WinnerModal';
import { useFlow } from '../games/flow/store';
import { useLayoutMode } from '../lib/useLayout';

const SnakesAndLaddersGame: React.FC = () => {
  const navigate = useNavigate();
  const initialized = useRef(false);
  const flowPlayers = useFlow(s => s.players);
  const { players, currentPlayerIndex, gamePhase, winner, message, isRolling, diceValue, rollDice, initGame, resetGame } = useSNLStore();

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
    initGame(flowPlayers.length, names, cpuFlags);
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

  // Same sizing strategy as Ludo — compact pods + thin rails so the board
  // can use the rest of the horizontal space on iPad landscape.
  const railWidth = 'clamp(132px, 14vw, 160px)';
  const boardSizeStyle = isWide
    ? { width: 'min(86vh, calc(100vw - 380px))', maxWidth: 'min(86vh, 880px)' }
    : { width: '100%', maxWidth: 'min(96vw, 72vh)' };

  const statusPill = (
    <div style={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          style={{
            padding: '8px 18px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.10)',
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            fontSize: 13,
            color: 'var(--ink)',
            whiteSpace: 'nowrap',
            maxWidth: '92%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >{message}</motion.div>
      </AnimatePresence>
    </div>
  );

  return (
    <PhoneShell decorative={false}>
      <Header title="Snakes & Ladders" onBack={() => { resetGame(); navigate('/select'); }} />

      {isWide ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px 12px', overflow: 'hidden' }}>
          <div style={{ width: railWidth, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {leftRailSlots(playerCount).map((idx, i) => (
              <SNLPlayerHalfRow key={`l-${i}`} slots={[idx]} rotated={false} onRoll={rollDice} compact />
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, minWidth: 0 }}>
            {statusPill}
            <div style={{ ...boardSizeStyle, aspectRatio: '1', position: 'relative' }}>
              <SNLBoard />
            </div>
          </div>
          <div style={{ width: railWidth, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rightRailSlots(playerCount).map((idx, i) => (
              <SNLPlayerHalfRow key={`r-${i}`} slots={[idx]} rotated={false} onRoll={rollDice} compact />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px 16px', overflow: 'hidden' }}>
          <div style={{ width: '100%', maxWidth: 'min(96vw, 72vh)' }}>
            <SNLPlayerHalfRow
              slots={topSlotsForCount(playerCount)}
              rotated
              onRoll={rollDice}
            />
          </div>

          {statusPill}

          <div style={{ ...boardSizeStyle, aspectRatio: '1', alignSelf: 'center' }}>
            <SNLBoard />
          </div>

          <div style={{ width: '100%', maxWidth: 'min(96vw, 72vh)' }}>
            <SNLPlayerHalfRow
              slots={bottomSlotsForCount(playerCount)}
              rotated={false}
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
          resetGame();
          initGame(count, snapshotNames, snapshotCpu);
        }}
        onGoHome={() => { resetGame(); navigate('/'); }}
      />
    </PhoneShell>
  );
};

// Same head-to-head split as Ludo: with 2 players, 1 top / 1 bottom; with
// 3, 1 top / 2 bottom; with 4, 2 top / 2 bottom.
function topSlotsForCount(count: number): Array<number | null> {
  if (count === 2) return [1, null];
  if (count === 3) return [2, null];
  return [2, 3];
}

function bottomSlotsForCount(count: number): Array<number | null> {
  if (count === 2) return [0, null];
  if (count === 3) return [0, 1];
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
