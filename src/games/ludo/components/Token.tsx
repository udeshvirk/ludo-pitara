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

const LudoTokenInner: React.FC<TokenProps> = ({ tokenId, color, isSelectable, stackIndex, stackSize }) => {
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
      // Linear tween whose duration matches the store's per-cell step
      // interval (90 ms — see `setTimeout(advance, 90)`). Going LONGER
      // looks smoother in isolation but the next step re-aims the
      // running tween before it reaches its target, so the path's
      // corner cells get visually skipped. Matching the step keeps
      // every cell on the walk visible — slight settle at each cell
      // is preferred over a corner-cutting glide.
      transition={{ type: 'tween', ease: 'linear', duration: 0.09 }}
    >
      <Coin color={PLAYER_COLORS[color].bg} active={isSelectable} />
    </motion.button>
  );
};

// React.memo so a cell's resident tokens don't re-render when an
// unrelated token moves. All props are primitives — default shallow
// comparison is sufficient.
const LudoToken = React.memo(LudoTokenInner);
export default LudoToken;
