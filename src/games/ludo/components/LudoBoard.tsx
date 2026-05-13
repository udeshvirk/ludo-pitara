import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLudoStore } from '../store';
import {
  BOARD_SIZE,
  getColoredCells,
  getSafeSquares,
  getBoardPosition,
  START_INDEX,
} from '../constants';
import type { PlayerColor } from '../types';
import LudoCells from './LudoCells';
import LudoCenter from './LudoCenter';
import LudoYards from './LudoYards';
import FlyingCaptureToken from './FlyingCaptureToken';
import { IDENTITY_SEAT_MAP } from './boardChrome';

// Orchestrator. Pulls slices from the store, derives the per-cell /
// per-yard maps once, then hands them to focused sub-components:
//
//   LudoCells  → the 225 non-corner cells (path / start / home stretch
//                / safe stars, plus on-cell tokens).
//   LudoCenter → centre 3×3 with the four wedges, gold medallion, and
//                home-token clusters.
//   LudoYards  → four yard corner panels (background, sockets, nameplate).
//   FlyingCaptureToken → the arc animation a captured token follows
//                back to its yard.
const LudoBoard: React.FC = () => {
  // Per-field selectors — a whole-store destructure would re-render
  // the 225-cell board on every unrelated set() (e.g. `message` ticks).
  const players = useLudoStore(s => s.players);
  const selectableTokenIds = useLudoStore(s => s.selectableTokenIds);
  const flyingCaptures = useLudoStore(s => s.flyingCaptures);
  const movingTokenId = useLudoStore(s => s.movingTokenId);
  const flyingIds = useMemo(() => new Set(flyingCaptures.map(f => f.tokenId)), [flyingCaptures]);

  const coloredCells = useMemo(() => getColoredCells(), []);
  const safeSquares = useMemo(() => getSafeSquares(), []);
  const safeSquareSet = useMemo(
    () => new Set(safeSquares.map(s => `${s.row},${s.col}`)),
    [safeSquares],
  );

  // Map seat → start cell (for highlighting).
  const startCells = useMemo(() => {
    const map = new Map<string, PlayerColor>();
    (Object.keys(START_INDEX) as PlayerColor[]).forEach(color => {
      const pos = getBoardPosition(color, 0);
      map.set(`${pos.row},${pos.col}`, color);
    });
    return map;
  }, []);

  // Path tokens. The walking token (if any) carries `isMoving: true`
  // so the cell render can exclude it from the stack count and render
  // it solo on top.
  const tokenPositions = useMemo(() => {
    const map = new Map<string, { tokenId: string; color: PlayerColor; yardIndex: number; isMoving: boolean }[]>();
    for (const player of players) {
      player.tokens.forEach((token, idx) => {
        if (token.state !== 'active') return;
        const pos = getBoardPosition(token.color, token.pathIndex);
        const key = `${pos.row},${pos.col}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({
          tokenId: token.id,
          color: token.color,
          yardIndex: idx,
          isMoving: token.id === movingTokenId,
        });
      });
    }
    return map;
  }, [players, movingTokenId]);

  // Yard tokens, indexed by ORIGINAL token slot (0..3). Pinning to the
  // original index means a token leaving the yard doesn't cause the
  // remaining ones to shift slots — which previously made siblings
  // briefly disappear / re-appear during a move animation.
  const yardTokens = useMemo(() => {
    const map: Record<PlayerColor, Array<{ tokenId: string; isSelectable: boolean } | null>> = {
      red: [null, null, null, null],
      green: [null, null, null, null],
      yellow: [null, null, null, null],
      blue: [null, null, null, null],
    };
    for (const player of players) {
      player.tokens.forEach((t, idx) => {
        if (t.state === 'yard' && !flyingIds.has(t.id)) {
          map[t.color][idx] = { tokenId: t.id, isSelectable: selectableTokenIds.includes(t.id) };
        }
      });
    }
    return map;
  }, [players, selectableTokenIds, flyingIds]);

  // Home tokens grouped by colour — placed at their wedge centroid
  // inside the centre 3×3 instead of all piling at (7,7).
  const homeTokens = useMemo(() => {
    const map: Record<PlayerColor, string[]> = { red: [], green: [], yellow: [], blue: [] };
    for (const player of players) {
      for (const token of player.tokens) {
        if (token.state === 'home') map[token.color].push(token.id);
      }
    }
    return map;
  }, [players]);

  // Player name keyed by seat, so each yard panel can label itself
  // (Ludo-King-style nameplate on the coloured corner).
  const nameByColor = useMemo(() => {
    const map: Partial<Record<PlayerColor, string>> = {};
    for (const p of players) map[p.color] = p.name;
    return map;
  }, [players]);

  // Active seats = ones with a player. LudoYards hides empty corners
  // (the board-cream background shows through) so an empty seat's
  // namesake colour can't collide with a user-picked one.
  const activeSeats = useMemo(() => new Set(players.map(p => p.color)), [players]);

  // Seat → visual colour. Active seats use the seated player's
  // displayColor; empty seats get a leftover colour (any of the four
  // not already claimed by an active player), shuffled randomly so
  // each board renders with all four yards in distinct colours.
  //
  // The dep is a stable seat+colour key, NOT the players array —
  // depending on `[players]` would re-roll Math.random on every walk
  // step (since `players` mutates per cell tween) and the empty
  // corners would visibly flicker between leftover colours.
  const seatKey = players
    .map(p => `${p.color}:${p.displayColor}`)
    .sort()
    .join(',');
  const seatToDisplay = useMemo(() => {
    const map: Record<PlayerColor, PlayerColor> = { ...IDENTITY_SEAT_MAP };
    const used = new Set<PlayerColor>();
    for (const p of players) {
      map[p.color] = p.displayColor;
      used.add(p.displayColor);
    }
    const allColors: PlayerColor[] = ['red', 'green', 'yellow', 'blue'];
    const leftover = allColors.filter(c => !used.has(c));
    // Fisher–Yates so the random fill doesn't always prefer the same
    // emptied seat for a given leftover colour.
    for (let i = leftover.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [leftover[i], leftover[j]] = [leftover[j], leftover[i]];
    }
    const emptySeats = (Object.keys(map) as PlayerColor[]).filter(
      seat => !players.some(p => p.color === seat),
    );
    emptySeats.forEach((seat, i) => {
      map[seat] = leftover[i] ?? seat;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seatKey]);

  return (
    <motion.div
      className="relative mx-auto"
      style={{
        width: '100%',
        height: '100%',
        aspectRatio: '1',
        background: 'var(--bg-board-cream)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-board)',
        display: 'grid',
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
      }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, type: 'spring' }}
    >
      <LudoCells
        tokenPositions={tokenPositions}
        coloredCells={coloredCells}
        startCells={startCells}
        safeSquareSet={safeSquareSet}
        seatToDisplay={seatToDisplay}
        selectableTokenIds={selectableTokenIds}
      />
      <LudoCenter
        seatToDisplay={seatToDisplay}
        homeTokens={homeTokens}
      />
      <LudoYards
        seatToDisplay={seatToDisplay}
        yardTokens={yardTokens}
        nameByColor={nameByColor}
        activeSeats={activeSeats}
      />
      {flyingCaptures.map(fly => (
        <FlyingCaptureToken key={fly.tokenId} fly={fly} />
      ))}
    </motion.div>
  );
};

export default LudoBoard;
