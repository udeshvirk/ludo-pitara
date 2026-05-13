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
  const flowOptions = useFlow(s => s.options);

  // Per-field selectors so this page only re-renders on the slices it
  // actually uses. A whole-store destructure causes every `message`
  // tick (and many other transient updates) to trigger a full re-
  // render of LudoBoard via prop chains. Action fns are referentially
  // stable, but using selectors keeps the pattern consistent.
  const players = useLudoStore(s => s.players);
  const currentPlayerIndex = useLudoStore(s => s.currentPlayerIndex);
  const diceValue = useLudoStore(s => s.diceValue);
  const isRolling = useLudoStore(s => s.isRolling);
  const gamePhase = useLudoStore(s => s.gamePhase);
  const winner = useLudoStore(s => s.winner);
  const selectableTokenIds = useLudoStore(s => s.selectableTokenIds);
  const rollDice = useLudoStore(s => s.rollDice);
  const selectToken = useLudoStore(s => s.selectToken);
  const initGame = useLudoStore(s => s.initGame);
  const resetGame = useLudoStore(s => s.resetGame);

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
    // Seat (yard position) is FIXED by slot index AND player count.
    //   2 players → diagonal (BL + TR) so a shared-device game sits the
    //     two players across the board from each other.
    //   3 players → BL + TL + TR (three corners, skip BR).
    //   4 players → BL + TL + TR + BR (full CW spiral).
    // The colour the user picked in setup becomes the visual
    // `displayColor` only — it does NOT determine where the player
    // sits on the board.
    const SEATS_BY_COUNT: Record<number, PlayerColor[]> = {
      2: ['blue', 'green'],
      3: ['blue', 'red', 'green'],
      4: ['blue', 'red', 'green', 'yellow'],
    };
    const seats = SEATS_BY_COUNT[flowPlayers.length] ?? SEATS_BY_COUNT[4];
    const playersToInit = flowPlayers.map((p, i) => ({
      name: p.name,
      color: seats[i],                       // seat — drives yard, path start, home stretch
      displayColor: p.color as PlayerColor,  // visual — what the user picked
      isCPU: p.isCPU,
    }));
    const names = playersToInit.map(p => p.name);
    initGame(playersToInit.length, names, playersToInit, flowOptions.ludo);
  }, [flowPlayers, flowGame, flowOptions, navigate, initGame, gamePhase, players.length]);

  useRecordOnFinish(
    'ludo',
    gamePhase === 'finished',
    React.useMemo(() => players.map(p => p.name), [players]),
    winner?.name,
  );

  // CPU autoplay — when a CPU player's turn starts, auto-roll, then auto-pick
  // a token after the roll resolves.
  //
  // Deps key off PRIMITIVE signals (isCPU boolean, phase, dice, etc.)
  // so the effect doesn't re-run every 90 ms during a walk, where
  // `players` mutates per step. The fresh players/currentPlayer are
  // pulled from the store at the moment we actually need them.
  const currentIsCPU = !!players[currentPlayerIndex]?.isCPU;
  useEffect(() => {
    if (!currentIsCPU) return;
    if (gamePhase === 'rolling' && !isRolling && diceValue === null) {
      const t = setTimeout(rollDice, 700);
      return () => clearTimeout(t);
    }
    if (gamePhase === 'selecting' && diceValue !== null && selectableTokenIds.length > 0) {
      const fresh = useLudoStore.getState();
      const player = fresh.players[fresh.currentPlayerIndex];
      if (!player) return;
      const choice = pickCpuToken(player, selectableTokenIds, diceValue, fresh.players);
      if (choice) {
        const t = setTimeout(() => selectToken(choice), 600);
        return () => clearTimeout(t);
      }
    }
  }, [currentIsCPU, gamePhase, isRolling, diceValue, selectableTokenIds, rollDice, selectToken]);

  const layoutMode = useLayoutMode();
  const isWide = layoutMode === 'wide';

  // Each colour has a fixed yard corner, so a player's pod must always
  // sit beside its colour — independent of where they ended up in the
  // players[] array. Compute the slot layouts off the actual player
  // colours rather than array indices.
  const slots = React.useMemo(() => buildSlots(players), [players]);

  // Height-primary aspect-ratio sizing. The board fills its flex
  // parent's height and `aspect-ratio: 1` keeps it square. Both
  // `max-width` AND `max-height` are clamped to the same calc(...)
  // value so a too-tall row doesn't stretch the board into a non-
  // square box (the board MUST stay square — non-square Ludo cells
  // distort the path geometry). Wide rails: 2 × 180 + 2×14 (board↔
  // rail gaps) + 2×13 (page padding) = 414.
  const boardStyle: React.CSSProperties = isWide
    ? {
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
        maxWidth: 'calc(100vw - 26px)',
        maxHeight: 'calc(100vw - 26px)',
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
            minHeight: 0,
            display: 'flex',
            // `stretch` (not center) so the board child can resolve
            // `height: 100%` against the row's actual height. Rails
            // center their pods vertically via their own flex layout.
            alignItems: 'stretch',
            justifyContent: 'center',
            gap: 14,
            padding: '0 13px 13px',
            maxWidth: 1600,
            margin: '0 auto',
            width: '100%',
            overflow: 'hidden',
          }}
        >
          <div style={{ width: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
            {slots.leftRail.map((idx, i) => (
              <PlayerHalfRow key={`l-${i}`} slots={[idx]} compact arrowSide="right" />
            ))}
          </div>
          <div style={boardStyle}>
            <LudoBoard />
          </div>
          <div style={{ width: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
            {slots.rightRail.map((idx, i) => (
              <PlayerHalfRow key={`r-${i}`} slots={[idx]} compact arrowSide="left" />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', padding: '14px 13px 13px', overflow: 'hidden', gap: 18 }}>
          <PlayerHalfRow slots={slots.top} top />
          <div style={boardStyle}>
            <LudoBoard />
          </div>
          <PlayerHalfRow slots={slots.bottom} />
        </div>
      )}

      <WinnerModal
        isOpen={gamePhase === 'finished' && winner !== null}
        winnerName={winner?.name || ''}
        winnerColor={winner ? PLAYER_COLORS[winner.displayColor].bg : '#fff'}
        stat={`Tokens home: ${winner?.tokens.filter(t => t.state === 'home').length || 0}/4`}
        onPlayAgain={() => {
          const count = players.length;
          // Re-seat in slot order (already in slot order; preserve it).
          // displayColor flows from the existing players unchanged.
          const snapshot = players.map(p => ({
            name: p.name,
            color: p.color,
            displayColor: p.displayColor,
            isCPU: p.isCPU,
          }));
          // Preserve the live options across rematch — resetGame() wipes
          // them, so capture before resetting and pass back into initGame.
          const opts = useLudoStore.getState().options;
          resetGame();
          initGame(count, snapshot.map(s => s.name), snapshot, opts);
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
