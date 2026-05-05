import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Dice3DProps {
  value: number | null;
  onRoll: () => void;
  disabled: boolean;
  playerColor?: string;
}

const DOT_POSITIONS: Record<number, number[][]> = {
  1: [[1, 1]],
  2: [[0, 2], [2, 0]],
  3: [[0, 2], [1, 1], [2, 0]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

const Dice3D: React.FC<Dice3DProps> = ({ value, onRoll, disabled, playerColor = '#6366f1' }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState<number>(1);

  const handleRoll = useCallback(() => {
    if (disabled || isRolling) return;

    setIsRolling(true);

    // Animate through random values
    let count = 0;
    const interval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count >= 8) {
        clearInterval(interval);
        setIsRolling(false);
        onRoll();
      }
    }, 80);
  }, [disabled, isRolling, onRoll]);

  const currentValue = isRolling ? displayValue : (value || 1);
  const dots = DOT_POSITIONS[currentValue] || DOT_POSITIONS[1];

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        onClick={handleRoll}
        disabled={disabled}
        className="relative cursor-pointer"
        style={{
          width: '72px',
          height: '72px',
          perspective: '200px',
        }}
        whileHover={!disabled ? { scale: 1.1 } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
        animate={isRolling ? {
          rotateX: [0, 360, 720],
          rotateY: [0, 360, 720],
          rotateZ: [0, 180, 360],
        } : {
          rotateX: 0,
          rotateY: 0,
          rotateZ: 0,
        }}
        transition={isRolling ? {
          duration: 0.6,
          ease: 'easeOut',
        } : {
          type: 'spring',
          stiffness: 200,
          damping: 15,
        }}
      >
        <div
          className="w-full h-full rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(145deg, #ffffff, #e6e6e6)',
            boxShadow: disabled
              ? '0 2px 8px rgba(0,0,0,0.2)'
              : `0 4px 20px rgba(0,0,0,0.3), 0 0 15px ${playerColor}40`,
            opacity: disabled ? 0.5 : 1,
            transition: 'opacity 0.3s, box-shadow 0.3s',
          }}
        >
          {/* 3x3 dot grid */}
          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: 'repeat(3, 1fr)',
              gridTemplateRows: 'repeat(3, 1fr)',
              width: '48px',
              height: '48px',
              padding: '4px',
            }}
          >
            {Array.from({ length: 9 }, (_, i) => {
              const row = Math.floor(i / 3);
              const col = i % 3;
              const hasDot = dots.some(d => d[0] === row && d[1] === col);

              return (
                <div
                  key={i}
                  className="flex items-center justify-center"
                >
                  <AnimatePresence>
                    {hasDot && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.15 }}
                        className="dice-dot"
                        style={{
                          width: '10px',
                          height: '10px',
                          minWidth: '10px',
                          minHeight: '10px',
                        }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </motion.button>

      {!disabled && !isRolling && (
        <motion.span
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-medium opacity-60"
        >
          Tap to roll
        </motion.span>
      )}
    </div>
  );
};

export default Dice3D;
