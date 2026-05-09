import React from 'react';
import { motion } from 'framer-motion';
import type { PlayerColor } from '../types';
import { PLAYER_COLORS } from '../constants';
import { useLudoStore } from '../store';
import Coin from '../../../components/ui/Coin';

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
      <Coin color={colors.bg} active={isSelectable} />
    </motion.button>
  );
};

export default LudoToken;
