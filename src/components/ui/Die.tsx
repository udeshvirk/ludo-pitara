import React from 'react';
import { motion } from 'framer-motion';

interface DieProps {
  value?: number;
  size?: number;
  color?: string;
  dotColor?: string;
  active?: boolean;
  rolling?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const POSITIONS: Record<number, [number, number][]> = {
  1: [[2, 2]],
  2: [[1, 1], [3, 3]],
  3: [[1, 1], [2, 2], [3, 3]],
  4: [[1, 1], [1, 3], [3, 1], [3, 3]],
  5: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]],
  6: [[1, 1], [1, 2], [1, 3], [3, 1], [3, 2], [3, 3]],
};

const Die: React.FC<DieProps> = ({
  value = 6,
  size = 56,
  color = '#ffffff',
  dotColor = '#1a0e2e',
  active = false,
  rolling = false,
  onClick,
  disabled,
}) => {
  const dots = POSITIONS[value] || POSITIONS[6];
  const cell = size / 4;

  const faceBg = active
    ? `linear-gradient(135deg, var(--gold-hi) 0%, var(--gold) 60%, var(--gold-deep) 100%)`
    : `linear-gradient(135deg, #ffffff 0%, ${color} 60%, #f0e4c8 100%)`;

  const shadow = active
    ? 'var(--shadow-dice-active)'
    : `0 ${size * 0.1}px ${size * 0.18}px rgba(0,0,0,0.32), inset 0 2px 0 rgba(255,255,255,0.85), inset 0 -3px 0 rgba(0,0,0,0.14)`;

  const interactive = !!onClick && !disabled;

  return (
    <motion.div
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      animate={
        rolling
          ? { rotate: [0, 90, -180, 270, 0], scale: [1, 0.92, 1.05, 0.96, 1] }
          : { rotate: 0, scale: 1 }
      }
      transition={
        rolling
          ? { duration: 0.55, ease: 'easeOut' }
          : { type: 'spring', stiffness: 280, damping: 22 }
      }
      whileTap={interactive ? { scale: 0.94 } : undefined}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: faceBg,
        boxShadow: shadow,
        position: 'relative',
        border: '1px solid rgba(0,0,0,0.08)',
        cursor: interactive ? 'pointer' : 'default',
        opacity: disabled && !active ? 0.55 : 1,
        flexShrink: 0,
      }}
    >
      {dots.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: p[0] * cell - cell * 0.35,
            top: p[1] * cell - cell * 0.35,
            width: cell * 0.7,
            height: cell * 0.7,
            borderRadius: '50%',
            background: active ? '#3a1f00' : dotColor,
            boxShadow: 'inset 0 1.5px 2px rgba(0,0,0,0.35)',
          }}
        />
      ))}
    </motion.div>
  );
};

export default Die;
