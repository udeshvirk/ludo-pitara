import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneShell from '../components/ui/PhoneShell';
import Header from '../components/ui/Header';
import Die from '../components/ui/Die';
import { playDice } from '../lib/sound';
import { haptics } from '../lib/haptics';
import { useLayoutMode } from '../lib/useLayout';

// Standalone physical-dice replacement: no players, no turns, no rules —
// tap the die, it tumbles, it lands. That's the whole feature.
const ROLL_MS = 780; // matches Die's internal tumble duration

const DiceGame: React.FC = () => {
  const navigate = useNavigate();
  const layout = useLayoutMode();
  const [value, setValue] = useState(1);
  const [rolling, setRolling] = useState(false);

  const size = layout === 'phone' ? 200 : 260;

  const roll = () => {
    if (rolling) return;
    const next = Math.floor(Math.random() * 6) + 1;
    playDice();
    haptics.diceRoll();
    setRolling(true);
    setValue(next);
    window.setTimeout(() => setRolling(false), ROLL_MS);
  };

  return (
    <PhoneShell contentMaxWidth={520}>
      <Header title="Dice" subtitle="Tap to roll" onBack={() => navigate('/select')} />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          padding: '0 22px 40px',
        }}
      >
        <Die value={value} size={size} rolling={rolling} onClick={roll} />

        <AnimatePresence mode="wait">
          <motion.div
            key={rolling ? 'rolling' : 'hint'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 12,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
              fontWeight: 700,
              color: 'var(--ink-dim)',
            }}
          >
            {rolling ? 'Rolling…' : 'Tap the die to roll'}
          </motion.div>
        </AnimatePresence>
      </div>
    </PhoneShell>
  );
};

export default DiceGame;
