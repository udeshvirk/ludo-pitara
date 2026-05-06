import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PhoneShell from '../components/ui/PhoneShell';
import Header from '../components/ui/Header';
import Btn from '../components/ui/Btn';
import Avatar from '../components/ui/Avatar';
import { useFlow, type Mode as ModeType } from '../games/flow/store';

const Mode: React.FC = () => {
  const navigate = useNavigate();
  const game = useFlow(s => s.game);
  const setMode = useFlow(s => s.setMode);
  const [chosen, setChosen] = useState<ModeType | null>(null);

  useEffect(() => {
    if (!game) navigate('/select');
  }, [game, navigate]);

  if (!game) return null;

  const proceed = () => {
    if (!chosen) return;
    setMode(chosen);
    navigate('/players');
  };

  return (
    <PhoneShell>
      <Header title="Pick a mode" subtitle={game === 'ludo' ? 'Ludo' : 'Snakes & Ladders'} onBack={() => navigate('/select')} />

      <div style={{ flex: 1, padding: '8px 22px 28px', display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' }}>
        <ModeCard
          selected={chosen === 'pass'}
          onClick={() => setChosen('pass')}
          title="Pass &amp; Play"
          subtitle="2–4 friends, one phone"
          body="Pass the device after each turn. Best for couches and chai."
          accent={
            <div style={{ display: 'flex', gap: -10 }}>
              <Avatar color="var(--p-red)" label="A" size={36} />
              <div style={{ marginLeft: -10 }}><Avatar color="var(--p-green)" label="B" size={36} /></div>
              <div style={{ marginLeft: -10 }}><Avatar color="var(--p-yellow)" label="C" size={36} /></div>
            </div>
          }
        />
        <ModeCard
          selected={chosen === 'cpu'}
          onClick={() => setChosen('cpu')}
          title="Solo vs Computer"
          subtitle="One human, smart CPUs"
          body="A quiet round? CPUs play sensible moves with personality."
          accent={
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Avatar color="var(--p-red)" label="You" size={36} />
              <span style={{ color: 'var(--ink-dim)', fontSize: 18 }}>vs</span>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 12 }}>CPU</div>
            </div>
          }
        />
      </div>

      <div style={{ padding: '0 22px 28px' }}>
        <Btn variant={chosen ? 'primary' : 'soft'} onClick={proceed} fullWidth disabled={!chosen}>
          Continue
        </Btn>
      </div>
    </PhoneShell>
  );
};

interface CardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  body: string;
  accent: React.ReactNode;
}

const ModeCard: React.FC<CardProps> = ({ selected, onClick, title, subtitle, body, accent }) => (
  <motion.button
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    style={{
      borderRadius: 20,
      padding: 18,
      background: selected ? 'rgba(255, 138, 61, 0.10)' : 'rgba(255,255,255,0.06)',
      border: `1px solid ${selected ? 'var(--saffron)' : 'rgba(255,255,255,0.10)'}`,
      boxShadow: selected ? '0 8px 28px rgba(255, 138, 61, 0.22)' : 'var(--shadow-sm)',
      textAlign: 'left',
      color: 'var(--ink)',
      cursor: 'pointer',
      fontFamily: 'var(--font-body)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22 }}>{title}</div>
      {accent}
    </div>
    <div style={{ fontSize: 11, color: selected ? 'var(--saffron)' : 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: 1.4, fontWeight: 700, fontFamily: 'var(--font-ui)' }}>{subtitle}</div>
    <div style={{ marginTop: 10, fontSize: 13.5, color: 'var(--ink-dim)', lineHeight: 1.4 }}>{body}</div>
  </motion.button>
);

export default Mode;
