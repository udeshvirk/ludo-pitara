import React from 'react';
import { motion } from 'framer-motion';
import type { PlayerColor } from '../types';
import { PLAYER_COLORS } from '../constants';
import { useLudoStore } from '../store';
import Coin, { stackPlacement } from '../../../components/ui/Coin';

interface TokenProps {
  tokenId: string;
  color: PlayerColor;
  isSelectable: boolean;
  stackIndex: number;
  stackSize: number;
}

const LudoToken: React.FC<TokenProps> = ({ tokenId, color, isSelectable, stackIndex, stackSize }) => {
  const selectToken = useLudoStore(s => s.selectToken);
  const { sizePercent, leftPercent, topPercent } = stackPlacement(stackSize, stackIndex);

  return (
    <motion.button
      layoutId={tokenId}
      onClick={() => isSelectable && selectToken(tokenId)}
      aria-label={`${color} token`}
      style={{
        position: 'absolute',
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        width: `${sizePercent}%`,
        height: `${sizePercent}%`,
        padding: 0,
        background: 'transparent',
        border: 'none',
        cursor: isSelectable ? 'pointer' : 'default',
        zIndex: isSelectable ? 25 : 10 + stackIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 32, mass: 0.6 }}
    >
      <Coin color={PLAYER_COLORS[color].bg} active={isSelectable} />
    </motion.button>
  );
};

export default LudoToken;
