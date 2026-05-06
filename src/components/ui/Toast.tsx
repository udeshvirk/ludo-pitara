import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastTone = 'capture' | 'snake' | 'ladder' | 'info';

interface ToastProps {
  show: boolean;
  tone?: ToastTone;
  children: React.ReactNode;
  topOffset?: number; // px from top of board container
}

const TONES: Record<ToastTone, React.CSSProperties> = {
  capture: {
    background: 'linear-gradient(180deg, #ff7a5a, var(--rose))',
    color: '#fff',
    boxShadow: '0 8px 24px rgba(229, 57, 53, 0.45)',
  },
  snake: {
    background: 'linear-gradient(180deg, #4ec27c, var(--snake))',
    color: '#fff',
    boxShadow: '0 8px 24px rgba(44, 138, 74, 0.45)',
  },
  ladder: {
    background: 'linear-gradient(180deg, var(--gold-hi), var(--gold))',
    color: '#3a1f00',
    boxShadow: '0 8px 24px rgba(245, 184, 0, 0.45)',
  },
  info: {
    background: 'rgba(255,255,255,0.10)',
    color: 'var(--ink)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
  },
};

const Toast: React.FC<ToastProps> = ({ show, tone = 'info', children, topOffset = 0 }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: -6 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.2, 0.9, 0.3, 1.4] }}
        style={{
          position: 'absolute',
          top: topOffset,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 18px',
          borderRadius: 999,
          fontFamily: 'var(--font-ui)',
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: 0.2,
          zIndex: 30,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          ...TONES[tone],
        }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

export default Toast;
