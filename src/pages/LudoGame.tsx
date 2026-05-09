import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneShell from '../components/ui/PhoneShell';
import Header from '../components/ui/Header';
import SoundToggle from '../components/ui/SoundToggle';
import { useLudoStore } from '../games/ludo/store';
import { PLAYER_COLORS } from '../games/ludo/constants';
import LudoBoard from '../games/ludo/components/LudoBoard';
import PlayerHalfRow from '../games/ludo/components/PlayerHalfRow';
import type { Player, PlayerColor } from '../games/ludo/types';
import WinnerModal from '../components/WinnerModal';
import { useFlow } from '../games/flow/store';
import { pickCpuToken } from '../games/ludo/cpu';
import { useLayoutMode } from '../lib/useLayout';
import { useRecordOnFinish } from '../lib/useRecordOnFinish';

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

  useRecordOnFinish(
    'ludo',
    gamePhase === 'finished',
    React.useMemo(() => players.map(p => p.name), [players]),
    winner?.name,
  );

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

  // Board width = min(viewport-width budget, viewport-height budget).
  // Pods sit immediately above/below at gap 18 — the board is sized
  // explicitly via calc and centered horizontally. No flex-1 wrapper
  // around it, so no gutters between the board and the pods.
  // Chrome budget: header ~64, padding 27 (14 top so the active pod's
  // glow isn't clipped, 13 bottom), two pods ~52 each (Ludo pods carry
  // no name caption), two gaps of 18 → ~236 vertical.
  const boardStyle: React.CSSProperties = isWide
    ? {
        width: 'min(calc(100vw - 354px), calc(100vh - 90px))',
        aspectRatio: '1',
        position: 'relative',
      }
    : {
        width: 'min(calc(100vw - 26px), calc(100vh - 236px))',
        aspectRatio: '1',
        alignSelf: 'center',
        position: 'relative',
      };

  return (
    <PhoneShell decorative={false} fluid>
      <Header
        title="Ludo"
        onBack={() => { resetGame(); navigate('/select'); }}
        action={<SoundToggle />}
      />

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
            {slots.leftRail.map((idx, i) => (
              <PlayerHalfRow key={`l-${i}`} slots={[idx]} compact arrowSide="right" />
            ))}
          </div>
          <div style={boardStyle}>
            <LudoBoard />
          </div>
          <div style={{ width: 150, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {slots.rightRail.map((idx, i) => (
              <PlayerHalfRow key={`r-${i}`} slots={[idx]} compact arrowSide="left" />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', padding: '14px 13px 13px', overflow: 'hidden', gap: 18 }}>
          <PlayerHalfRow slots={slots.top} />
          <div style={boardStyle}>
            <LudoBoard />
          </div>
          <PlayerHalfRow slots={slots.bottom} />
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

// Each colour has a fixed yard corner on the board. A player's pod
// must sit beside its yard so the avatar/die line up with the colored
// 6×6 corner panel.
//
//   red    → top-left yard       → top row,    DOM[0] (screen-left)
//   green  → top-right yard      → top row,    DOM[1] (screen-right)
//   blue   → bottom-left yard    → bottom row, DOM[0] (screen-left)
//   yellow → bottom-right yard   → bottom row, DOM[1] (screen-right)
//
// Rows have no rotation, so DOM order maps directly to screen order.
//
// Wide-landscape rails: left rail holds colours with left-side yards
// (red top, blue bottom); right rail holds the right-side ones
// (green top, yellow bottom).

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

  if (redIdx >= 0) top[0] = redIdx;
  if (greenIdx >= 0) top[1] = greenIdx;
  if (blueIdx >= 0) bottom[0] = blueIdx;
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
