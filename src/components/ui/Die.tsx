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

// Each face is positioned by translating it half a cube-size along its
// outward normal. Opposite faces sum to 7 (Western dice convention).
//   1 → +Z (front)         6 → -Z (back)
//   2 → +X (right)         5 → -X (left)
//   3 → -Y (top)           4 → +Y (bottom, CSS Y goes down)
const FACE_TRANSFORM: Record<number, string> = {
  1: 'rotateY(0deg)',
  6: 'rotateY(180deg)',
  2: 'rotateY(90deg)',
  5: 'rotateY(-90deg)',
  3: 'rotateX(90deg)',
  4: 'rotateX(-90deg)',
};

// Cube rotation that brings face N to the viewer (+Z).
const TARGET_ROTATION: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 },
};

const Die: React.FC<DieProps> = ({
  value = 1,
  size = 56,
  color = '#ffffff',
  dotColor = '#1a0e2e',
  active = false,
  rolling = false,
  onClick,
  disabled,
}) => {
  const cell = size / 4;
  const half = size / 2;
  const radius = size * 0.22;

  const faceBg = active
    ? `linear-gradient(135deg, var(--gold-hi) 0%, var(--gold) 60%, var(--gold-deep) 100%)`
    : `linear-gradient(135deg, #ffffff 0%, ${color} 60%, #f0e4c8 100%)`;

  const interactive = !!onClick && !disabled;

  const target = TARGET_ROTATION[value] || TARGET_ROTATION[1];
  // While rolling, end at the target +2 full turns so the cube
  // visibly tumbles. After rolling stops, snap to the bare target so
  // we don't unwind those extra turns visibly.
  const targetX = rolling ? 720 + target.x : target.x;
  const targetY = rolling ? 720 + target.y : target.y;

  return (
    <div
      onClick={interactive ? onClick : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      style={{
        width: size,
        height: size,
        perspective: size * 4,
        cursor: interactive ? 'pointer' : 'default',
        opacity: disabled && !active ? 0.55 : 1,
        flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ rotateX: targetX, rotateY: targetY }}
        transition={
          rolling
            ? { duration: 0.78, ease: 'easeOut' }
            : { duration: 0 }
        }
        whileTap={interactive ? { scale: 0.94 } : undefined}
        style={{
          width: size,
          height: size,
          position: 'relative',
          transformStyle: 'preserve-3d',
        }}
      >
        {[1, 2, 3, 4, 5, 6].map(n => (
          <div
            key={n}
            style={{
              position: 'absolute',
              inset: 0,
              width: size,
              height: size,
              borderRadius: radius,
              background: faceBg,
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: active
                ? 'inset 0 2px 0 rgba(255,255,255,0.6), inset 0 -2px 0 rgba(0,0,0,0.18)'
                : 'inset 0 2px 0 rgba(255,255,255,0.85), inset 0 -3px 0 rgba(0,0,0,0.14)',
              transform: `${FACE_TRANSFORM[n]} translateZ(${half}px)`,
              backfaceVisibility: 'hidden',
            }}
          >
            {POSITIONS[n].map((p, i) => (
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
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default Die;
