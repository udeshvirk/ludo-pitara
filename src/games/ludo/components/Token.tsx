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

// Deeper variant per colour, used for the coin's outer rim. Picked to
// be 2 shades darker than the main bg so the rim reads as a metallic
// edge rather than a flat outline.
const COIN_RIM: Record<PlayerColor, string> = {
  red: '#7a1310',
  green: '#155020',
  yellow: '#604700',
  blue: '#0a3066',
};

const LudoToken: React.FC<TokenProps> = ({ tokenId, color, isSelectable, stackIndex, stackSize }) => {
  const selectToken = useLudoStore(s => s.selectToken);
  const colors = PLAYER_COLORS[color];
  const rim = COIN_RIM[color];

  // Size + offsets used when multiple tokens share a cell.
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
      <svg viewBox="0 0 32 32" width="100%" height="100%" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}>
        <defs>
          {/* Rim gradient — light at the top to read as metallic edge */}
          <radialGradient id={`rim-${tokenId}`} cx="50%" cy="32%" r="80%">
            <stop offset="0%" stopColor={colors.bgLight} />
            <stop offset="55%" stopColor={colors.bg} />
            <stop offset="100%" stopColor={rim} />
          </radialGradient>
          {/* Face gradient — top-left highlight, fading to base color */}
          <radialGradient id={`face-${tokenId}`} cx="35%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="35%" stopColor={colors.bgLight} />
            <stop offset="100%" stopColor={colors.bg} />
          </radialGradient>
        </defs>
        {/* Ground shadow */}
        <ellipse cx="16" cy="29" rx="12" ry="2.2" fill="rgba(0,0,0,0.45)" />
        {/* Outer rim */}
        <circle cx="16" cy="16" r="14" fill={`url(#rim-${tokenId})`} stroke={rim} strokeWidth="0.4" />
        {/* Inner face */}
        <circle cx="16" cy="16" r="11" fill={`url(#face-${tokenId})`} stroke={rim} strokeWidth="0.5" strokeOpacity="0.5" />
        {/* Center stamp — gives the coin a visible medallion */}
        <circle cx="16" cy="16" r="5.2" fill="rgba(255,255,255,0.18)" stroke={rim} strokeWidth="0.4" strokeOpacity="0.55" />
        <circle cx="16" cy="16" r="2.2" fill={rim} fillOpacity="0.45" />
        {/* Top specular highlight on the rim */}
        <ellipse cx="14" cy="6.2" rx="4.5" ry="1.6" fill="rgba(255,255,255,0.5)" />
      </svg>
    </motion.button>
  );
};

export default LudoToken;
