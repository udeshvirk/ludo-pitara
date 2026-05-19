import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playUndo } from '../lib/sound';
import { haptics } from '../lib/haptics';

interface UndoButtonProps {
  // ms timestamp until which the undo is valid; null = hide.
  undoableUntil: number | null;
  onUndo: () => void;
}

// Inline "Undo" pill — designed to sit beside the player's pod (so it
// inherits whatever rotation the parent applies for across-table
// players). Pure layout flow; the caller positions it.
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
          onClick={() => { playUndo(); haptics.tap(); onUndo(); }}
          aria-label="Undo last move"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.16 }}
          whileTap={{ scale: 0.94 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 11px',
            borderRadius: 999,
            background: 'rgba(42, 18, 72, 0.92)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.32)',
            color: 'var(--ink)',
            fontFamily: 'var(--font-ui)',
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
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
