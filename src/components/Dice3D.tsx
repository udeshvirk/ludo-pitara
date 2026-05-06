import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

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

// Rotations required to show each face to the front
const FACE_ROTATIONS: Record<number, { x: number; y: number; z: number }> = {
  1: { x: 0, y: 0, z: 0 },
  6: { x: 180, y: 0, z: 0 },
  3: { x: 0, y: -90, z: 0 },
  4: { x: 0, y: 90, z: 0 },
  5: { x: -90, y: 0, z: 0 },
  2: { x: 90, y: 0, z: 0 },
};

const Dice3D: React.FC<Dice3DProps> = ({ value, onRoll, disabled, playerColor = '#6366f1' }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [targetRot, setTargetRot] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (value && !isRolling) {
      const baseRot = FACE_ROTATIONS[value] || FACE_ROTATIONS[1];
      // Add multiple of 360 to ensure it always spins forward
      setTargetRot(prev => ({
        x: baseRot.x + Math.ceil(prev.x / 360) * 360 + 360,
        y: baseRot.y + Math.ceil(prev.y / 360) * 360 + 360,
        z: 0, // Reset z so dots are oriented correctly
      }));
    }
  }, [value, isRolling]);

  const handleRoll = useCallback(() => {
    if (disabled || isRolling) return;

    setIsRolling(true);
    
    // Spin randomly a few times
    setTargetRot(prev => ({
      x: prev.x + 720 + Math.random() * 360,
      y: prev.y + 720 + Math.random() * 360,
      z: prev.z + 360 + Math.random() * 180,
    }));

    setTimeout(() => {
      setIsRolling(false);
      onRoll(); // This will update the `value` prop, which triggers useEffect
    }, 600);
  }, [disabled, isRolling, onRoll]);

  const renderFace = (faceValue: number, transform: string) => {
    const dots = DOT_POSITIONS[faceValue];
    return (
      <div
        className="absolute inset-0 w-full h-full rounded-2xl flex items-center justify-center border-[1.5px] border-black/10"
        style={{
          background: 'linear-gradient(145deg, #ffffff, #e6e6e6)',
          transform,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridTemplateRows: 'repeat(3, 1fr)',
            width: '60%',
            height: '60%',
          }}
        >
          {Array.from({ length: 9 }, (_, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const hasDot = dots.some(d => d[0] === row && d[1] === col);

            return (
              <div key={i} className="flex items-center justify-center">
                {hasDot && (
                  <div
                    className="dice-dot"
                    style={{ width: '12px', height: '12px', minWidth: '12px', minHeight: '12px', background: '#1a1a3e', borderRadius: '50%' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        style={{ perspective: '800px' }}
        className="relative"
      >
        <motion.div
          onClick={handleRoll}
          className={`relative cursor-pointer transition-opacity duration-300 ${disabled && !isRolling ? 'opacity-50' : 'opacity-100'}`}
          style={{
            width: '64px',
            height: '64px',
            transformStyle: 'preserve-3d',
            transformOrigin: 'center center',
          }}
          animate={{
            rotateX: targetRot.x,
            rotateY: targetRot.y,
            rotateZ: targetRot.z,
          }}
          transition={{
            duration: isRolling ? 0.6 : 0.4,
            ease: isRolling ? 'linear' : [0.2, 0.8, 0.2, 1], // snappy finish
          }}
          whileHover={!disabled ? { scale: 1.1 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
        >
          {/* Box shadow glow placed behind */}
          <div 
            className="absolute inset-0 rounded-2xl" 
            style={{ 
              boxShadow: disabled ? 'none' : `0 0 30px ${playerColor}60`,
              transform: 'translateZ(-32px) scale(0.9)',
              background: 'transparent'
            }} 
          />

          {renderFace(1, 'translateZ(32px)')}
          {renderFace(6, 'rotateX(180deg) translateZ(32px)')}
          {renderFace(3, 'rotateY(90deg) translateZ(32px)')}
          {renderFace(4, 'rotateY(-90deg) translateZ(32px)')}
          {renderFace(5, 'rotateX(90deg) translateZ(32px)')}
          {renderFace(2, 'rotateX(-90deg) translateZ(32px)')}
        </motion.div>
      </div>

      <div className="h-4 flex items-center justify-center">
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
    </div>
  );
};

export default Dice3D;
