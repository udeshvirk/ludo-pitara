import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneShell from '../components/ui/PhoneShell';
import Header from '../components/ui/Header';
import { useLudoStore } from '../games/ludo/store';
import { PLAYER_COLORS } from '../games/ludo/constants';
import LudoBoard from '../games/ludo/components/LudoBoard';
import PlayerHalfRow from '../games/ludo/components/PlayerHalfRow';
import type { PlayerColor } from '../games/ludo/types';
import WinnerModal from '../components/WinnerModal';
import { useFlow } from '../games/flow/store';
import { pickCpuToken } from '../games/ludo/cpu';
import { useLayoutMode } from '../lib/useLayout';

const LudoGame: React.FC = () => {
  const navigate = useNavigate();
  const initialized = useRef(false);
  const flowPlayers = useFlow(s => s.players);
  const flowGame = useFlow(s => s.game);

  const {
    players,
    currentPlayerIndex,
    diceValue,
    isRolling,
    gamePhase,
    winner,
    message,
    rollDice,
    selectToken,
    initGame,
    resetGame,
    selectableTokenIds,
  } = useLudoStore();

  // Bootstrap on mount. Three cases:
  //  1. Resumed from a save → store has players, gamePhase != 'setup'. Do nothing.
  //  2. Fresh setup just completed → flowPlayers populated. Init the game.
  //  3. Landed cold (e.g. deep link) with neither → bounce back to game select.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (gamePhase !== 'setup' && players.length > 0) return;
    if (!flowPlayers.length) {
      navigate('/select');
      return;
    }
    const playersToInit = flowPlayers.map(p => ({
      name: p.name,
      color: p.color as PlayerColor,
      isCPU: p.isCPU,
    }));
    const names = playersToInit.map(p => p.name);
    initGame(playersToInit.length, names, playersToInit);
  }, [flowPlayers, flowGame, navigate, initGame, gamePhase, players.length]);

  // CPU autoplay — when a CPU player's turn starts, auto-roll, then auto-pick
  // a token after the roll resolves.
  const currentPlayer = players[currentPlayerIndex];
  useEffect(() => {
    if (!currentPlayer?.isCPU) return;
    if (gamePhase === 'rolling' && !isRolling && diceValue === null) {
      const t = setTimeout(rollDice, 700);
      return () => clearTimeout(t);
    }
    if (gamePhase === 'selecting' && diceValue !== null && selectableTokenIds.length > 0) {
      const choice = pickCpuToken(currentPlayer, selectableTokenIds, diceValue, players);
      if (choice) {
        const t = setTimeout(() => selectToken(choice), 600);
        return () => clearTimeout(t);
      }
    }
  }, [currentPlayer, gamePhase, isRolling, diceValue, selectableTokenIds, players, rollDice, selectToken]);

  const playerCount = players.length || flowPlayers.length;
  const layoutMode = useLayoutMode();
  const isWide = layoutMode === 'wide';

  // On phones / tablet portrait we stack vertically (pods top + bottom).
  // On wide landscape we put the board in the centre and pods on the
  // left + right rails. The rails are kept narrow and the pods compact so
  // the board can grow to fill the remaining horizontal space.
  // Wide-mode layout uses CSS grid `1fr auto 1fr` so the side rails flex
  // to absorb whatever horizontal space the board doesn't claim — no more
  // wasted gutters on any iPad size. The board sizes itself off the
  // available vertical budget (header ~70px + status ~50px + padding) and
  // is capped so XL displays don't overrun.
  const boardSizeStyle = isWide
    ? { width: 'min(calc(100vh - 140px), 960px)' }
    : { width: '100%', maxWidth: 'min(96vw, 72vh)' };

  const statusPill = (
    <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
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
            maxWidth: '90%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >{message}</motion.div>
      </AnimatePresence>
    </div>
  );

  return (
    <PhoneShell decorative={false} fluid>
      <Header
        title="Ludo"
        onBack={() => { resetGame(); navigate('/select'); }}
      />

      {isWide ? (
        // Wide landscape: rails flex-fill, board sized at its content width.
        // Grid itself caps at 1600px and centres on huge monitors so the
        // rails don't grow to absurd widths.
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'minmax(150px, 1fr) auto minmax(150px, 1fr)',
            alignItems: 'center',
            gap: 12,
            padding: '0 12px 12px',
            maxWidth: 1600,
            margin: '0 auto',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
            {leftRailSlots(playerCount).map((idx, i) => (
              <PlayerHalfRow
                key={`l-${i}`}
                slots={[idx]}
                rotated={false}
                onRoll={rollDice}
                isRolling={isRolling}
                diceValue={diceValue}
                activeIndex={currentPlayerIndex}
                gamePhase={gamePhase}
                compact
              />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {statusPill}
            <div style={{ ...boardSizeStyle, aspectRatio: '1', position: 'relative' }}>
              <LudoBoard />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
            {rightRailSlots(playerCount).map((idx, i) => (
              <PlayerHalfRow
                key={`r-${i}`}
                slots={[idx]}
                rotated={false}
                onRoll={rollDice}
                isRolling={isRolling}
                diceValue={diceValue}
                activeIndex={currentPlayerIndex}
                gamePhase={gamePhase}
                compact
              />
            ))}
          </div>
        </div>
      ) : (
        // Stacked: pods on top (rotated 180°) and bottom.
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px 16px', overflow: 'hidden' }}>
          <div style={{ width: '100%', maxWidth: 'min(96vw, 72vh)' }}>
            <PlayerHalfRow
              slots={topSlotsForCount(playerCount)}
              rotated
              onRoll={rollDice}
              isRolling={isRolling}
              diceValue={diceValue}
              activeIndex={currentPlayerIndex}
              gamePhase={gamePhase}
            />
          </div>

          {statusPill}

          <div style={{ ...boardSizeStyle, aspectRatio: '1', position: 'relative' }}>
            <LudoBoard />
          </div>

          <div style={{ width: '100%', maxWidth: 'min(96vw, 72vh)' }}>
            <PlayerHalfRow
              slots={bottomSlotsForCount(playerCount)}
              rotated={false}
              onRoll={rollDice}
              isRolling={isRolling}
              diceValue={diceValue}
              activeIndex={currentPlayerIndex}
              gamePhase={gamePhase}
            />
          </div>
        </div>
      )}

      <WinnerModal
        isOpen={gamePhase === 'finished' && winner !== null}
        winnerName={winner?.name || ''}
        winnerColor={winner ? PLAYER_COLORS[winner.color].bg : '#fff'}
        stat={`Tokens home: ${winner?.tokens.filter(t => t.state === 'home').length || 0}/4`}
        onPlayAgain={() => {
          const count = players.length;
          const snapshot = players.map(p => ({ name: p.name, color: p.color, isCPU: p.isCPU }));
          resetGame();
          initGame(count, snapshot.map(s => s.name), snapshot);
        }}
        onGoHome={() => {
          resetGame();
          navigate('/');
        }}
      />
    </PhoneShell>
  );
};

// Split the player slots into top half (rotated 180°) and bottom half so two
// people can sit head-to-head. With 2 players, top:1 / bottom:1. With 3,
// top:1 / bottom:2. With 4, top:2 / bottom:2.
function topSlotsForCount(count: number): Array<number | null> {
  if (count === 2) return [0, null];
  if (count === 3) return [1, null];
  return [1, 2]; // 4-player: green + yellow on top
}

function bottomSlotsForCount(count: number): Array<number | null> {
  if (count === 2) return [1, null];
  if (count === 3) return [0, 2];
  return [0, 3]; // red + blue on bottom
}

// Wide-landscape rails: half the players on each side, top-to-bottom.
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

export default LudoGame;
