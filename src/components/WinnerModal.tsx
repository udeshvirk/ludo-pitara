import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Btn from './ui/Btn';

interface WinnerModalProps {
  isOpen: boolean;
  winnerName: string;
  winnerColor: string;
  stat?: string;
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
  rotate: number;
}

const CONFETTI_COLORS = ['#e53935', '#2e9d4f', '#f5b800', '#1e6fdb', '#ff8a3d', '#ffd966'];

const WinnerModal: React.FC<WinnerModalProps> = ({ isOpen, winnerName, winnerColor, stat, onPlayAgain, onGoHome }) => {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isOpen) {
      const pieces: ConfettiPiece[] = Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 1.4,
        duration: 2 + Math.random() * 2.5,
        size: 6 + Math.random() * 8,
        rotate: Math.random() * 360,
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
          <div className="absolute inset-0" style={{ background: 'rgba(25, 10, 46, 0.78)', backdropFilter: 'blur(12px)' }} />

          {/* Expanding gold ring */}
          <motion.div
            initial={{ scale: 0, opacity: 0.7 }}
            animate={{ scale: 6, opacity: 0 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: '3px solid var(--gold)',
              boxShadow: '0 0 40px rgba(245,184,0,0.7)',
            }}
          />

          {/* Confetti */}
          {confetti.map(p => (
            <motion.div
              key={p.id}
              style={{
                position: 'absolute',
                top: 0,
                left: `${p.x}%`,
                width: p.size,
                height: p.size,
                background: p.color,
                borderRadius: 2,
              }}
              initial={{ y: -20, rotate: p.rotate, opacity: 1 }}
              animate={{ y: '110vh', rotate: p.rotate + 720, opacity: 0 }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
            />
          ))}

          <motion.div
            className="relative z-10 mx-4 max-w-sm w-full text-center"
            initial={{ scale: 0.7, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.7, y: 30 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            style={{
              padding: 28,
              borderRadius: 26,
              background: 'rgba(42, 18, 72, 0.85)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], rotate: [0, -6, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 96,
                height: 96,
                margin: '0 auto 16px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 30%, var(--gold-hi), var(--gold) 60%, var(--gold-deep))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                boxShadow: '0 0 40px rgba(245,184,0,0.55), inset 0 -8px 16px rgba(0,0,0,0.25)',
              }}
            >🏆</motion.div>

            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 36, lineHeight: 1.05, color: winnerColor }}>{winnerName}</div>
            <div style={{ marginTop: 6, fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--ink-dim)' }}>wins the round</div>

            {stat && <div style={{ marginTop: 14, fontSize: 13, color: 'var(--ink-dim)' }}>{stat}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
              <Btn variant="primary" fullWidth onClick={onPlayAgain}>Rematch</Btn>
              <Btn variant="ghost" fullWidth onClick={onGoHome}>Main menu</Btn>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WinnerModal;
