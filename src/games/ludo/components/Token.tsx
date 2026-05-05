import React from 'react';
import { motion } from 'framer-motion';
import type { PlayerColor } from '../types';
import { PLAYER_COLORS } from '../constants';
import { useLudoStore } from '../store';

interface TokenProps {
  tokenId: string;
  color: PlayerColor;
  isSelectable: boolean;
  stackIndex: number;
  stackSize: number;
}

const LudoToken: React.FC<TokenProps> = ({ tokenId, color, isSelectable, stackIndex, stackSize }) => {
  const selectToken = useLudoStore(s => s.selectToken);
  const colors = PLAYER_COLORS[color];

  // Size calculation based on stacking
  const sizePercent = stackSize > 2 ? 40 : stackSize > 1 ? 45 : 65;

  // Offset for stacked tokens
  const offsets = stackSize <= 1
    ? [{ x: 0, y: 0 }]
    : stackSize === 2
    ? [{ x: -15, y: -15 }, { x: 15, y: 15 }]
    : stackSize === 3
    ? [{ x: -15, y: -15 }, { x: 15, y: -15 }, { x: 0, y: 15 }]
    : [{ x: -15, y: -15 }, { x: 15, y: -15 }, { x: -15, y: 15 }, { x: 15, y: 15 }];

  const offset = offsets[stackIndex] || { x: 0, y: 0 };

  return (
    <motion.button
      layoutId={tokenId}
      onClick={() => isSelectable && selectToken(tokenId)}
      className="rounded-full absolute"
      style={{
        width: `${sizePercent}%`,
        height: `${sizePercent}%`,
        background: colors.gradient,
        border: '2px solid rgba(255,255,255,0.7)',
        boxShadow: isSelectable
          ? `0 0 12px ${colors.glow}, 0 0 24px ${colors.glow}, 0 2px 4px rgba(0,0,0,0.3)`
          : `0 2px 4px rgba(0,0,0,0.3)`,
        cursor: isSelectable ? 'pointer' : 'default',
        zIndex: isSelectable ? 20 : 10 + stackIndex,
        transform: `translate(${offset.x}%, ${offset.y}%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      animate={isSelectable ? {
        scale: [1, 1.15, 1],
      } : {}}
      transition={isSelectable ? {
        duration: 0.8,
        repeat: Infinity,
        ease: 'easeInOut',
      } : {
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
      whileTap={isSelectable ? { scale: 0.9 } : {}}
    >
      {/* Inner circle for depth effect */}
      <div
        className="rounded-full"
        style={{
          width: '55%',
          height: '55%',
          background: 'rgba(255,255,255,0.3)',
          border: '1px solid rgba(255,255,255,0.4)',
        }}
      />
    </motion.button>
  );
};

export default LudoToken;
