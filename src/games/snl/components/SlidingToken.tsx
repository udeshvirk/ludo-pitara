import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { slideDurationMs } from '../timing';
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
  sweeping?: boolean;
}

const SlidingToken: React.FC<SlidingTokenProps> = ({ color, fromCell, toCell, type, cellPct, sweeping }) => {
  const reduced = useReducedMotion();
  const waypoints = useMemo<Point[]>(() => {
    if (type === 'snake') {
      const { points } = snakeGeometry(fromCell, toCell, cellPct, sweeping);
      return subsample(points, fromCell - toCell >= 45 ? 48 : 24);
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
  }, [fromCell, toCell, type, cellPct, sweeping]);

  // Token size matches a single-player-in-cell coin (70% × SNL_TOKEN_SCALE
  // of cellPct in viewbox-percent terms).
  const tokenSize = cellPct * 0.7 * SNL_TOKEN_SCALE;
  const halfSize = tokenSize / 2;
  const lefts = waypoints.map(p => `${p.x - halfSize}%`);
  const tops = waypoints.map(p => `${p.y - halfSize}%`);
  const duration = slideDurationMs(type, fromCell, toCell) / 1000;
  const trail = waypoints.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');

  return (
    <>
    <svg className={`journey-trail journey-${type}`} viewBox="0 0 100 100" aria-hidden="true">
      <path d={trail} fill="none" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <motion.path d={trail} fill="none" stroke="currentColor" strokeWidth="0.8"
        strokeLinecap="round" initial={{ pathLength: reduced ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration }} />
      <circle cx={waypoints.at(-1)!.x} cy={waypoints.at(-1)!.y} r="3.4" fill="none" stroke="currentColor" strokeWidth="0.5" />
    </svg>
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
      className={`journey-coin journey-${type}`}
      animate={{ left: reduced ? lefts.at(-1) : lefts, top: reduced ? tops.at(-1) : tops }}
      transition={{ duration: reduced ? 0 : duration, ease: 'easeInOut' }}
    >
      <motion.div style={{ width: '100%', height: '100%' }}
        animate={reduced ? {} : { scale: [1, 1.18, 1], rotate: type === 'snake' ? [0, -16, 16, 0] : [0, -8, 8, 0] }}
        transition={{ duration }}><Coin color={color} /></motion.div>
    </motion.div>
    </>
  );
};

export default SlidingToken;
