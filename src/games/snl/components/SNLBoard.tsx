import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BOARD_SIZE } from '../constants';
import { useSNLStore } from '../store';
import type { SNLPlayer } from '../types';
import SNLCells from './SNLCells';
import LadderShape from './LadderShape';
import { SnakeBody, SnakeHead } from './SnakeShape';
import SlidingToken from './SlidingToken';

// Orchestrator. Reads per-field slices, derives anchor sets + the
// per-cell occupant map once, then composes:
//
//   SNLCells     → 100-cell grid (number badges, anchor highlights,
//                  resident + walker token rendering).
//   LadderShape  → SVG ladder shapes (one per ladder).
//   SnakeBody    → wavy body (one pass for all snakes).
//   SnakeHead    → diamond head (second pass so heads always layer
//                  above any other snake body).
//   SlidingToken → floating token that animates along a snake / ladder
//                  while the player is sliding.
const SNLBoard: React.FC = () => {
  const players = useSNLStore(s => s.players);
  const layout = useSNLStore(s => s.layout);
  const sliding = useSNLStore(s => s.sliding);
  const walkingPlayerId = useSNLStore(s => s.walkingPlayerId);
  const cellPct = 100 / BOARD_SIZE;

  const snakes = useMemo(() => layout.filter(s => s.type === 'snake'),   [layout]);
  const ladders = useMemo(() => layout.filter(s => s.type === 'ladder'), [layout]);
  const ladderBases = useMemo(() => new Set(ladders.map(l => l.from)),  [ladders]);
  const ladderTops  = useMemo(() => new Set(ladders.map(l => l.to)),    [ladders]);
  const snakeHeads  = useMemo(() => new Set(snakes.map(s => s.from)),   [snakes]);
  const snakeTails  = useMemo(() => new Set(snakes.map(s => s.to)),     [snakes]);

  const slidingPlayer = sliding ? players.find(p => p.id === sliding.playerId) ?? null : null;

  // Each occupant carries an `isMoving` flag so the cell render can
  // split the walker (renders solo on top) from the residents (lay out
  // off their own count, never re-flow as a walker passes over).
  type CellOccupant = { player: SNLPlayer; isMoving: boolean };
  const playerPositions = useMemo(() => {
    const map = new Map<number, CellOccupant[]>();
    for (const p of players) {
      if (sliding && p.id === sliding.playerId) continue;
      if (p.position === 0) continue;
      if (!map.has(p.position)) map.set(p.position, []);
      map.get(p.position)!.push({ player: p, isMoving: p.id === walkingPlayerId });
    }
    return map;
  }, [players, sliding, walkingPlayerId]);

  return (
    <motion.div
      className="relative mx-auto"
      style={{
        width: '100%',
        height: '100%',
        background: 'var(--bg-board-cream)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-board)',
      }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, type: 'spring' }}
    >
      <SNLCells
        playerPositions={playerPositions}
        ladderBases={ladderBases}
        ladderTops={ladderTops}
        snakeHeads={snakeHeads}
        snakeTails={snakeTails}
      />

      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {ladders.map(l => (
          <LadderShape key={`l-${l.from}-${l.to}`} from={l.from} to={l.to} cellPct={cellPct} />
        ))}
        {/* Two passes so every snake's head sits above every body, even
            when bodies cross other heads. */}
        {snakes.map(s => (
          <SnakeBody key={`sb-${s.from}-${s.to}`} from={s.from} to={s.to} cellPct={cellPct} />
        ))}
        {snakes.map(s => (
          <SnakeHead key={`sh-${s.from}-${s.to}`} from={s.from} to={s.to} cellPct={cellPct} />
        ))}
      </svg>

      {sliding && slidingPlayer && (
        <SlidingToken
          color={slidingPlayer.color}
          fromCell={sliding.fromCell}
          toCell={sliding.toCell}
          type={sliding.type}
          cellPct={cellPct}
        />
      )}
    </motion.div>
  );
};

export default SNLBoard;
