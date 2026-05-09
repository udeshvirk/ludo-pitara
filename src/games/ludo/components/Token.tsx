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
      // Linear tween that's intentionally LONGER than the store's 90 ms
      // step interval (see store's `setTimeout(advance, 90)`). At
      // duration === step the tween lands exactly at each cell before
      // the next step re-renders — the small re-render gap reads as
      // "stop-and-go" at every cell. With duration > step the previous
      // tween is always still in-flight when the next setState fires,
      // so framer-motion just re-aims the in-progress animation at the
      // new target — continuous motion, no per-cell pause. The single
      // remaining settle (after the final step) is bounded by the
      // store's 120 ms post-walk delay.
      transition={{ type: 'tween', ease: 'linear', duration: 0.16 }}
    >
      <Coin color={PLAYER_COLORS[color].bg} active={isSelectable} />
    </motion.button>
  );
};

export default LudoToken;
