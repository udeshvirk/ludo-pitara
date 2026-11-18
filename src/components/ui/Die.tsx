import React, { useEffect, useRef } from 'react';
import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';

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
  const reduced = useReducedMotion();
  const cell = size / 4;
  const half = size / 2;
  const radius = size * 0.22;

  const faceBg = color !== '#ffffff'
    ? `linear-gradient(145deg, ${color}, #c6b893)`
    : 'linear-gradient(145deg, #fff2d3 0%, #f0dcaa 65%, #cfad65 100%)';

  const interactive = !!onClick && !disabled;

  const controls = useAnimationControls();
  const previousFace = useRef(value);
  useEffect(() => {
    const target = TARGET_ROTATION[value] || TARGET_ROTATION[1];
    controls.stop();
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!rolling || reduced || preference.matches) {
      controls.set({ rotateX: target.x, rotateY: target.y, rotateZ: 0, y: 0, scale: 1 });
      previousFace.current = value;
      return;
    }
    const start = TARGET_ROTATION[previousFace.current] || TARGET_ROTATION[1];
    // Lift, tumble, impact, then a small settling bounce. The final face
    // is exact; the store's 800ms settle remains later than this 780ms roll.
    void controls.start({
      rotateX: [start.x, start.x + 160, target.x + 470, target.x + 720, target.x + 720, target.x + 720],
      rotateY: [start.y, start.y + 100, target.y + 390, target.y + 720, target.y + 720, target.y + 720],
      rotateZ: [0, -15, 12, -3, 2, 0],
      y: [0, -size * .28, -size * .18, 0, -size * .055, 0],
      scale: [1, 1.04, 1.04, .94, 1.01, 1],
      transition: { duration: .78, times: [0, .2, .52, .78, .9, 1], ease: 'easeInOut' },
    });
    const onPreferenceChange = () => {
      if (preference.matches) {
        controls.stop();
        controls.set({ rotateX: target.x, rotateY: target.y, rotateZ: 0, y: 0, scale: 1 });
      }
    };
    preference.addEventListener('change', onPreferenceChange);
    return () => {
      preference.removeEventListener('change', onPreferenceChange);
      controls.stop();
    };
  }, [controls, reduced, rolling, size, value]);

  return (
    <button
      type="button"
      className="table-die"
      aria-label={rolling ? 'Rolling dice' : interactive ? `Roll dice, current value ${value}` : `Dice showing ${value}`}
      disabled={!interactive}
      onClick={interactive ? onClick : undefined}
      style={{
        width: size,
        height: size,
        perspective: size * 8,
        background: 'transparent',
        border: 'none',
        padding: 0,
        borderRadius: radius,
        display: 'block',
        boxShadow: '0 4px 6px #0005',
        cursor: interactive ? 'pointer' : 'default',
        opacity: 1,
        flexShrink: 0,
      }}
    >
      <motion.div
        aria-hidden="true"
        animate={controls}
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
              border: '1px solid #9c8c6d',
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
                  background: dotColor,
                  boxShadow: 'inset 0 1.5px 2px rgba(0,0,0,0.35)',
                }}
              />
            ))}
          </div>
        ))}
      </motion.div>
    </button>
  );
};

export default Die;
