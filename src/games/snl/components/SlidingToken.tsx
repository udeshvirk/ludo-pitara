import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import Coin from '../../../components/ui/Coin';
import { cellCenterPct, snakeGeometry, subsample, type Point } from './snakeGeometry';
import { SNL_TOKEN_SCALE } from './snlChrome';

// Floating token rendered on top of the board while a player is sliding
// down a snake or climbing a ladder. Animates left/top through ~16
// waypoints sampled along the entity's path.
interface SlidingTokenProps {
  color: string;
  fromCell: number;
  toCell: number;
  type: 'snake' | 'ladder';
  cellPct: number;
}

const SlidingToken: React.FC<SlidingTokenProps> = ({ color, fromCell, toCell, type, cellPct }) => {
  const waypoints = useMemo<Point[]>(() => {
    if (type === 'snake') {
      const { points } = snakeGeometry(fromCell, toCell, cellPct);
      return subsample(points, 16);
    }
    // Ladder: linear from base to top. Two endpoints + the same in
    // between is enough — the climb reads cleanly without wobble.
    const a = cellCenterPct(fromCell);
    const b = cellCenterPct(toCell);
    const pts: Point[] = [];
    const STEPS = 8;
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
    return pts;
  }, [fromCell, toCell, type, cellPct]);

  // Token size matches a single-player-in-cell coin (70% × SNL_TOKEN_SCALE
  // of cellPct in viewbox-percent terms).
  const tokenSize = cellPct * 0.7 * SNL_TOKEN_SCALE;
  const halfSize = tokenSize / 2;
  const lefts = waypoints.map(p => `${p.x - halfSize}%`);
  const tops = waypoints.map(p => `${p.y - halfSize}%`);
  const duration = type === 'snake' ? 0.85 : 0.55;

  return (
    <motion.div
      style={{
        position: 'absolute',
        width: `${tokenSize}%`,
        height: `${tokenSize}%`,
        left: lefts[0],
        top: tops[0],
        zIndex: 50,
        pointerEvents: 'none',
      }}
      animate={{ left: lefts, top: tops }}
      transition={{ duration, ease: 'easeInOut' }}
    >
      <Coin color={color} />
    </motion.div>
  );
};

export default SlidingToken;
