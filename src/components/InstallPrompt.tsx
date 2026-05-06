import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Btn from './ui/Btn';
import { useInstallStatus, install } from '../lib/install';

// A subtle "Install" affordance that appears only on browsers that support
// it (or on iOS Safari, where it shows the manual Share→Add hint).
const InstallPrompt: React.FC<{ variant?: 'pill' | 'inline' }> = ({ variant = 'pill' }) => {
  const status = useInstallStatus();
  const [showHint, setShowHint] = useState(false);

  if (status.kind === 'unavailable') return null;

  const onClick = async () => {
    if (status.kind === 'prompt') {
      await install();
    } else {
      setShowHint(true);
    }
  };

  const button = variant === 'pill' ? (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        borderRadius: 999,
        border: '1px solid rgba(245, 184, 0, 0.5)',
        background: 'rgba(245, 184, 0, 0.10)',
        color: 'var(--gold-hi)',
        fontFamily: 'var(--font-ui)',
        fontWeight: 700,
        fontSize: 12,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12" />
        <path d="M7 10l5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
      Install app
    </button>
  ) : (
    <Btn variant="ghost" small onClick={onClick}>Install app</Btn>
  );

  return (
    <>
      {button}
      <AnimatePresence>
        {showHint && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0"
              onClick={() => setShowHint(false)}
              style={{ background: 'rgba(25, 10, 46, 0.78)', backdropFilter: 'blur(10px)' }}
            />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              style={{
                position: 'relative',
                zIndex: 1,
                margin: 16,
                padding: 22,
                borderRadius: 22,
                background: 'rgba(42, 18, 72, 0.92)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'var(--ink)',
                maxWidth: 380,
                width: '100%',
              }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, marginBottom: 8 }}>Install on iOS</div>
              <div style={{ fontSize: 14, color: 'var(--ink-dim)', lineHeight: 1.5, marginBottom: 16 }}>
                Safari won't let an app install itself, but you can add Ludo Pitara to your home screen in two taps:
              </div>
              <ol style={{ paddingLeft: 20, margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--ink)' }}>
                <li>
                  Tap the <strong>Share</strong>{' '}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px' }}>
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>{' '}
                  button in Safari's toolbar.
                </li>
                <li>Choose <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong>. Done — open it from your home screen.</li>
              </ol>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
                <Btn variant="primary" small onClick={() => setShowHint(false)}>Got it</Btn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default InstallPrompt;
