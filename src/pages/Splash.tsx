import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneShell from '../components/ui/PhoneShell';
import Mandala from '../components/ui/Mandala';
import Token from '../components/ui/Token';
import Die from '../components/ui/Die';
import Btn from '../components/ui/Btn';
import { playTap } from '../lib/sound';
import { detectSaved } from '../lib/gameSaves';

const Splash: React.FC = () => {
  const navigate = useNavigate();
  // Detect once via useState initializer — keeps the localStorage
  // read off the render path and avoids the (now-redundant) sync
  // effect that used to clamp autoAdvance off when a save existed.
  const [saved] = useState(detectSaved);
  // Auto-advance to /select after a short hold, unless there's a save
  // — then the user gets the Continue / New-game CTAs and we wait.
  const autoAdvance = !saved;

  const proceed = () => {
    playTap();
    navigate('/select');
  };

  const continueGame = () => {
    if (!saved) return;
    playTap();
    navigate(saved.game === 'ludo' ? '/ludo' : '/snakes-and-ladders');
  };

  useEffect(() => {
    if (!autoAdvance) return;
    const t = window.setTimeout(() => navigate('/select'), 2400);
    return () => window.clearTimeout(t);
  }, [navigate, autoAdvance]);

  return (
    <PhoneShell contentMaxWidth={520}>
      {/* Centered ambient mandala */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <Mandala size={420} opacity={0.08} />
      </div>

      <motion.div
        onClick={proceed}
        className="flex flex-col items-center justify-center text-center px-8"
        style={{ flex: 1, cursor: 'pointer' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 30%, rgba(255,217,102,0.95), rgba(245,184,0,0.65) 60%, rgba(176,122,0,0.3) 100%)',
            boxShadow: '0 0 48px rgba(245,184,0,0.55), inset 0 -8px 16px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 28,
          }}
        >
          <Die value={5} size={46} active />
          <div style={{ position: 'relative', top: 16, marginLeft: -8 }}>
            <Token color="var(--p-red)" size={32} />
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 56,
            lineHeight: 1.0,
            color: 'var(--ink)',
            letterSpacing: -0.5,
            margin: 0,
          }}
        >
          Ludo Pitara
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{
            color: 'var(--saffron)',
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            fontSize: 12,
            marginTop: 14,
          }}
        >
          Two classics. One pitara.
        </motion.p>
      </motion.div>

      <AnimatePresence>
        {saved ? (
          <motion.div
            key="resume"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ padding: '0 24px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-dim)', fontFamily: 'var(--font-ui)', letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 700 }}>
              Saved {saved.game === 'ludo' ? 'Ludo' : 'Snakes & Ladders'} · {saved.hint}
            </div>
            <Btn variant="primary" fullWidth onClick={continueGame}>Continue</Btn>
            <Btn variant="ghost" fullWidth onClick={proceed}>New game</Btn>
          </motion.div>
        ) : (
          <motion.div
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            style={{
              textAlign: 'center',
              fontFamily: 'var(--font-ui)',
              fontSize: 11,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
              paddingBottom: 32,
            }}
          >
            Tap to begin · Offline · No accounts
          </motion.div>
        )}
      </AnimatePresence>
    </PhoneShell>
  );
};

export default Splash;
