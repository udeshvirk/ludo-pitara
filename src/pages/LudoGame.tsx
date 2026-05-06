import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneShell from '../components/ui/PhoneShell';
import Header from '../components/ui/Header';
import { useLudoStore } from '../games/ludo/store';
import { PLAYER_COLORS } from '../games/ludo/constants';
import LudoBoard from '../games/ludo/components/LudoBoard';
import PlayerHalfRow from '../games/ludo/components/PlayerHalfRow';
import type { Player, PlayerColor } from '../games/ludo/types';
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

  const layoutMode = useLayoutMode();
  const isWide = layoutMode === 'wide';

  // Each colour has a fixed yard corner, so a player's pod must always
  // sit beside its colour — independent of where they ended up in the
  // players[] array. Compute the slot layouts off the actual player
  // colours rather than array indices.
  const slots = React.useMemo(() => buildSlots(players), [players]);

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
            // Bumped past the board's 9px gold ring so rails have real
            // breathing room.
            gap: 18,
            padding: '0 12px 12px',
            maxWidth: 1600,
            margin: '0 auto',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
            {slots.leftRail.map((idx, i) => (
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
            {slots.rightRail.map((idx, i) => (
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
        // Stacked: status pill stays at the very top, then pods hug the
        // board with a small visible gap. The board has a 9px triple
        // gold-ring drop-shadow that paints into the gap, so the column
        // gap needs to be large enough to leave a few pixels of clear
        // space *outside* the ring.
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 12px 12px', overflow: 'hidden', gap: 16 }}>
          {statusPill}

          <div style={{ width: '100%', maxWidth: 'min(96vw, 72vh)' }}>
            <PlayerHalfRow
              slots={slots.top}
              rotated
              onRoll={rollDice}
              isRolling={isRolling}
              diceValue={diceValue}
              activeIndex={currentPlayerIndex}
              gamePhase={gamePhase}
            />
          </div>

          <div style={{ ...boardSizeStyle, aspectRatio: '1', position: 'relative' }}>
            <LudoBoard />
          </div>

          <div style={{ width: '100%', maxWidth: 'min(96vw, 72vh)' }}>
            <PlayerHalfRow
              slots={slots.bottom}
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

// Each colour has a fixed yard corner on the board. A player's pod has
// to sit next to its colour's yard, regardless of which slot in the
// players[] array that player landed in (PlayerSetup lets users cycle
// colours, so the array order isn't predictable).
//
//   red    → top-left yard       → top row, screen-left
//   green  → top-right yard      → top row, screen-right
//   yellow → bottom-right yard   → bottom row, screen-right
//   blue   → bottom-left yard    → bottom row, screen-left
//
// The top row uses `transform: rotate(180deg)`, which mirrors flex
// children: DOM-index 0 ends up visually on the right, DOM-index 1 on
// the left. So in the top row, red (which we want on screen-left) goes
// at DOM-index 1, and green at DOM-index 0.
//
// The bottom row has no rotation, so DOM order matches screen order.
//
// Wide-landscape rails: left rail holds the colours whose yards live
// on the board's left half (red top, blue bottom); right rail holds
// green top + yellow bottom.

function buildSlots(players: Player[]): {
  top: Array<number | null>;
  bottom: Array<number | null>;
  leftRail: number[];
  rightRail: number[];
} {
  const top: Array<number | null> = [null, null];
  const bottom: Array<number | null> = [null, null];

  const findIdx = (color: PlayerColor): number =>
    players.findIndex(p => p.color === color);

  const redIdx = findIdx('red');
  const greenIdx = findIdx('green');
  const yellowIdx = findIdx('yellow');
  const blueIdx = findIdx('blue');

  if (redIdx >= 0) top[1] = redIdx;       // rotated: DOM[1] = screen-left
  if (greenIdx >= 0) top[0] = greenIdx;   // rotated: DOM[0] = screen-right
  if (blueIdx >= 0) bottom[0] = blueIdx;  // bottom: DOM[0] = screen-left
  if (yellowIdx >= 0) bottom[1] = yellowIdx;

  const leftRail: number[] = [];
  const rightRail: number[] = [];
  if (redIdx >= 0) leftRail.push(redIdx);
  if (blueIdx >= 0) leftRail.push(blueIdx);
  if (greenIdx >= 0) rightRail.push(greenIdx);
  if (yellowIdx >= 0) rightRail.push(yellowIdx);

  return { top, bottom, leftRail, rightRail };
}

export default LudoGame;
