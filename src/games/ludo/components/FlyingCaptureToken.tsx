import React from 'react';
import { motion } from 'framer-motion';
import { PLAYER_COLORS } from '../constants';
import Coin from '../../../components/ui/Coin';
import type { CaptureFly } from '../types';

// Floating token rendered while a captured token arcs back to its yard
// socket. Not a layoutId-tracked element — just a one-shot motion.div
// with keyframe-driven left/top + scale + rotate. The yard render
// skips the captured token until flyingCaptures clears, so visually
// the arc lands and the yard render takes over.
const FlyingCaptureToken: React.FC<{ fly: CaptureFly }> = ({ fly }) => {
  const cellPct = 100 / 15;
  const fromX = (fly.from.col + 0.5) * cellPct;
  const fromY = (fly.from.row + 0.5) * cellPct;
  const toX = (fly.to.col + 0.5) * cellPct;
  const toY = (fly.to.row + 0.5) * cellPct;
  // Arc peak — midpoint horizontally, lifted above the higher endpoint.
  const midX = (fromX + toX) / 2;
  const midY = Math.min(fromY, toY) - 12;
  const tokenSize = 5; // % of board, similar to a single-cell token
  const half = tokenSize / 2;
  const dir = toX < fromX ? -1 : 1;

  return (
    <motion.div
      style={{
        position: 'absolute',
        width: `${tokenSize}%`,
        height: `${tokenSize}%`,
        left: `${fromX - half}%`,
        top: `${fromY - half}%`,
        zIndex: 60,
        pointerEvents: 'none',
      }}
      animate={{
        left: [`${fromX - half}%`, `${midX - half}%`, `${toX - half}%`],
        top: [`${fromY - half}%`, `${midY - half}%`, `${toY - half}%`],
        scale: [1, 1.15, 0.85],
        rotate: [0, dir * 180, dir * 360],
      }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <Coin color={PLAYER_COLORS[fly.displayColor].bg} />
    </motion.div>
  );
};

export default FlyingCaptureToken;
