import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playTap } from '../lib/sound';
import { haptics } from '../lib/haptics';

interface UndoButtonProps {
  // ms timestamp until which the undo is valid; null = hide.
  undoableUntil: number | null;
  onUndo: () => void;
}

// Floating "Undo" pill — only renders while `undoableUntil` is in the
// future. Schedules its own re-render at the expiry moment so it can
// disappear cleanly without a polling interval.
const UndoButton: React.FC<UndoButtonProps> = ({ undoableUntil, onUndo }) => {
  // Treat the clock as an external system: lazy-initialise from
  // Date.now() and re-sync from setTimeout when undoableUntil ticks
  // past. Reading `now` during render is pure (it's React state); the
  // impure clock reads happen in initialiser/effect only.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (undoableUntil === null) return;
    const remaining = undoableUntil - Date.now();
    if (remaining <= 0) return;
    const t = setTimeout(() => setNow(Date.now()), remaining + 20);
    return () => clearTimeout(t);
  }, [undoableUntil]);

  const visible = undoableUntil !== null && now < undoableUntil;

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="undo-btn"
          onClick={() => { playTap(); haptics.tap(); onUndo(); }}
          aria-label="Undo last move"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          whileTap={{ scale: 0.94 }}
          style={{
            position: 'absolute',
            top: 64,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 999,
            background: 'rgba(42, 18, 72, 0.92)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
            color: 'var(--ink)',
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            fontSize: 13,
            letterSpacing: 0.4,
            cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M5 3L2 6l3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 6h6a4 4 0 010 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Undo
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export default UndoButton;
