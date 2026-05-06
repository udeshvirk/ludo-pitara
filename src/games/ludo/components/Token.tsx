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

  // Size and offset based on how many tokens share this cell
  const sizePercent = stackSize > 2 ? 42 : stackSize > 1 ? 50 : 70;
  const offsets =
    stackSize <= 1
      ? [{ x: 0, y: 0 }]
      : stackSize === 2
      ? [{ x: -14, y: -14 }, { x: 14, y: 14 }]
      : stackSize === 3
      ? [{ x: -14, y: -14 }, { x: 14, y: -14 }, { x: 0, y: 14 }]
      : [{ x: -14, y: -14 }, { x: 14, y: -14 }, { x: -14, y: 14 }, { x: 14, y: 14 }];
  const offset = offsets[stackIndex] || { x: 0, y: 0 };

  return (
    <motion.button
      layoutId={tokenId}
      onClick={() => isSelectable && selectToken(tokenId)}
      aria-label={`${color} token`}
      style={{
        position: 'absolute',
        width: `${sizePercent}%`,
        height: `${sizePercent}%`,
        padding: 0,
        background: 'transparent',
        border: 'none',
        cursor: isSelectable ? 'pointer' : 'default',
        zIndex: isSelectable ? 25 : 10 + stackIndex,
        transform: `translate(${offset.x}%, ${offset.y}%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
    >
      {isSelectable && (
        <span
          aria-hidden
          className="animate-pulse-ring"
          style={{
            position: 'absolute',
            inset: -6,
            borderRadius: '50%',
            border: '2px solid var(--gold)',
            pointerEvents: 'none',
          }}
        />
      )}
      <svg viewBox="0 0 32 32" width="100%" height="100%" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.45))' }}>
        <defs>
          <radialGradient id={`tg-${tokenId}`} cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="35%" stopColor={colors.bg} />
            <stop offset="100%" stopColor={colors.bg} />
          </radialGradient>
        </defs>
        <ellipse cx="16" cy="28" rx="11" ry="2" fill="rgba(0,0,0,0.35)" />
        <circle cx="16" cy="16" r="13" fill="rgba(0,0,0,0.25)" />
        <circle cx="16" cy="16" r="11.5" fill={`url(#tg-${tokenId})`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.6" />
        <circle cx="16" cy="16" r="7.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        <ellipse cx="12" cy="11" rx="4" ry="2.5" fill="rgba(255,255,255,0.55)" />
      </svg>
    </motion.button>
  );
};

export default LudoToken;
