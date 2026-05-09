import React from 'react';
import { motion } from 'framer-motion';
import Avatar from './Avatar';
import Die from './Die';

interface PodProps {
  color: string;       // base hex (avatar fill + active border/glow)
  label: string;       // avatar single-char label
  isActive: boolean;   // highlight + dice ring
  isRolling: boolean;  // dice tumble animation
  diceValue: number | null;
  onRoll?: () => void; // dice tap handler when canRoll
  canRoll: boolean;    // whether the dice should be tappable
  compact?: boolean;   // smaller variant for side rails
}

// Avatar + die in a card with active-state border/glow. Shared by Ludo
// and Snakes & Ladders pod rows. The two games used to inline this with
// near-identical sizing constants and styling — pull it once and let
// each game's row component frame whatever else it needs (e.g. SNL's
// name caption) outside the pod.
const SIZES = {
  full:    { avatar: 36, die: 40, gap: 8, padding: '6px 9px', radius: 14 },
  compact: { avatar: 28, die: 30, gap: 6, padding: '5px 7px', radius: 12 },
} as const;

const Pod: React.FC<PodProps> = ({
  color,
  label,
  isActive,
  isRolling,
  diceValue,
  onRoll,
  canRoll,
  compact = false,
}) => {
  const s = compact ? SIZES.compact : SIZES.full;
  return (
    <motion.div
      animate={{ scale: isActive ? 1.04 : 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: s.padding,
        borderRadius: s.radius,
        background: isActive
          ? `linear-gradient(135deg, ${color}26, transparent 70%)`
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.10)'}`,
        boxShadow: isActive ? `0 0 16px ${color}66` : 'none',
        flexShrink: 0,
      }}
    >
      <Avatar color={color} label={label} size={s.avatar} ring active={isActive} />
      <Die
        value={isActive && diceValue ? diceValue : 1}
        size={s.die}
        active={isActive}
        rolling={isActive && isRolling}
        onClick={isActive && canRoll ? onRoll : undefined}
        disabled={!isActive || !canRoll}
      />
    </motion.div>
  );
};

export default Pod;
