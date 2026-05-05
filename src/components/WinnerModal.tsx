import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WinnerModalProps {
  isOpen: boolean;
  winnerName: string;
  winnerColor: string;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

const CONFETTI_COLORS = ['#ef4444', '#22c55e', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];

const WinnerModal: React.FC<WinnerModalProps> = ({
  isOpen,
  winnerName,
  winnerColor,
  onPlayAgain,
  onGoHome,
}) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isOpen) {
      const pieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 3,
        size: 6 + Math.random() * 8,
      }));
      setConfetti(pieces);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Confetti */}
          {confetti.map(piece => (
            <motion.div
              key={piece.id}
              className="absolute top-0 rounded-sm"
              style={{
                left: `${piece.x}%`,
                width: piece.size,
                height: piece.size,
                background: piece.color,
              }}
              initial={{ y: -20, rotate: 0, opacity: 1 }}
              animate={{
                y: '100vh',
                rotate: 720,
                opacity: 0,
              }}
              transition={{
                duration: piece.duration,
                delay: piece.delay,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}

          {/* Modal */}
          <motion.div
            className="glass-strong rounded-3xl p-8 text-center z-10 mx-4 max-w-sm w-full"
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            {/* Trophy */}
            <motion.div
              className="text-6xl mb-4"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, -10, 10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              🏆
            </motion.div>

            <h2 className="text-2xl font-black mb-2" style={{ fontFamily: 'Outfit' }}>
              Congratulations!
            </h2>

            <motion.p
              className="text-xl font-bold mb-6"
              style={{ color: winnerColor }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {winnerName} Wins!
            </motion.p>

            <div className="flex flex-col gap-3">
              <button
                onClick={onPlayAgain}
                className="btn-primary w-full"
              >
                🎮 Play Again
              </button>
              <button
                onClick={onGoHome}
                className="w-full py-3 px-6 rounded-xl font-semibold text-sm opacity-70 hover:opacity-100 transition-opacity glass"
              >
                Back to Menu
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WinnerModal;
