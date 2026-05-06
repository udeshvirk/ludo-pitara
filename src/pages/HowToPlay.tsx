import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PhoneShell from '../components/ui/PhoneShell';
import Header from '../components/ui/Header';

const LUDO_RULES = [
  { icon: '🎲', title: 'Roll a 6 to enter', body: 'Tokens leave the yard only on a 6. The 6 also gives you a bonus roll.' },
  { icon: '🏃', title: 'Move clockwise', body: 'Walk your token forward by the dice value. You can stack on safe star squares.' },
  { icon: '⚔', title: 'Capture sends home', body: "Land on an opponent's token (off a star) and they head back to the yard." },
  { icon: '🎯', title: 'Exact roll to finish', body: 'You need the exact value to enter the home column. Any extra is wasted.' },
  { icon: '🏆', title: 'Bring all 4 home', body: 'First player to finish all 4 tokens wins the round.' },
];

const SNL_RULES = [
  { icon: '🎲', title: 'Roll a 1 to start', body: "You can't enter the board until your first 1. Anything else passes the turn." },
  { icon: '🏃', title: 'Move & pass', body: 'Once on the board, roll and walk forward. No bonus turn for sixes.' },
  { icon: '🪜', title: 'Climb ladders', body: 'Land on a ladder base — zip up to its top.' },
  { icon: '🐍', title: 'Mind the snakes', body: 'Land on a snake head — slide down to its tail.' },
  { icon: '💯', title: 'Exactly 100', body: 'Overshoot 100 and you stay put. Need an exact roll to win.' },
];

const HowToPlay: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'ludo' | 'snl'>('ludo');
  const rules = tab === 'ludo' ? LUDO_RULES : SNL_RULES;

  return (
    <PhoneShell>
      <Header title="How to play" onBack={() => navigate(-1)} />

      <div style={{ padding: '0 22px 14px' }}>
        <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
          {(['ludo', 'snl'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 999,
                fontFamily: 'var(--font-ui)',
                fontWeight: 700,
                fontSize: 13,
                color: tab === t ? '#3a1f00' : 'var(--ink-dim)',
                background: tab === t ? 'linear-gradient(180deg, var(--gold-hi), var(--gold))' : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {t === 'ludo' ? 'Ludo' : 'Snakes & Ladders'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: '4px 22px 28px', overflow: 'auto' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            {rules.map((r) => (
              <div
                key={r.title}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: 16,
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(180deg, var(--gold-hi), var(--gold))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
                }}>{r.icon}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, color: 'var(--ink)' }}>{r.title}</div>
                  <div style={{ marginTop: 4, fontSize: 13.5, color: 'var(--ink-dim)', lineHeight: 1.4 }}>{r.body}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </PhoneShell>
  );
};

export default HowToPlay;
