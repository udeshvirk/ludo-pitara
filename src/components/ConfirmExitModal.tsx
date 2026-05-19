import React, { useEffect, useId, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Btn from './ui/Btn';

interface ConfirmExitModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

// Confirm-before-leave for an in-progress game. The active save in
// localStorage is preserved either way; "Leave game" just navigates,
// and the user can resume from the Continue strip on Home / Game
// Select.
const ConfirmExitModal: React.FC<ConfirmExitModalProps> = ({ isOpen, onCancel, onConfirm }) => {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => cancelRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) return;
    previouslyFocused.current?.focus?.();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === 'Tab') {
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === cancelRef.current) {
            e.preventDefault();
            confirmRef.current?.focus();
          }
        } else {
          if (active === confirmRef.current) {
            e.preventDefault();
            cancelRef.current?.focus();
          }
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(25, 10, 46, 0.7)', backdropFilter: 'blur(8px)' }}
            onClick={onCancel}
          />
          <motion.div
            className="relative z-10 mx-4 max-w-sm w-full text-center"
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            style={{
              padding: 24,
              borderRadius: 22,
              background: 'rgba(42, 18, 72, 0.92)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <div
              id={titleId}
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 22,
                color: 'var(--ink)',
              }}
            >
              Leave the game?
            </div>
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.4 }}>
              Your progress will be saved — you can resume from the Home screen.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
              <Btn variant="primary" fullWidth onClick={onCancel} buttonRef={cancelRef}>Keep playing</Btn>
              <Btn variant="ghost" fullWidth onClick={onConfirm} buttonRef={confirmRef}>Leave game</Btn>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmExitModal;
