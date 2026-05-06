import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PhoneShell from '../components/ui/PhoneShell';
import Header from '../components/ui/Header';
import Corner from '../components/ui/Corner';
import InstallPrompt from '../components/InstallPrompt';
import { useFlow } from '../games/flow/store';
import type { GameId } from '../games/flow/store';

const games: Array<{
  id: GameId;
  title: string;
  subtitle: string;
  preview: React.ReactNode;
}> = [
  {
    id: 'ludo',
    title: 'Ludo',
    subtitle: 'Strategy · 2–4 players',
    preview: <LudoMini />,
  },
  {
    id: 'snl',
    title: 'Snakes & Ladders',
    subtitle: 'Luck · 2–4 players',
    preview: <SnLMini />,
  },
];

const GameSelect: React.FC = () => {
  const navigate = useNavigate();
  const setGame = useFlow(s => s.setGame);

  const choose = (g: GameId) => {
    setGame(g);
    navigate('/mode');
  };

  return (
    <PhoneShell>
      <Header
        title="Choose your game"
        subtitle="Section 1 · Entry"
        onBack={() => navigate('/')}
        action={
          <button
            aria-label="Settings"
            onClick={() => navigate('/settings')}
            style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)', cursor: 'pointer' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        }
      />
      <div style={{ flex: 1, padding: '8px 22px 28px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'auto' }}>
        {games.map((g, i) => (
          <motion.button
            key={g.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => choose(g.id)}
            style={{
              position: 'relative',
              width: '100%',
              borderRadius: 22,
              padding: 18,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              textAlign: 'left',
              color: 'var(--ink)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              overflow: 'hidden',
            }}
          >
            {/* Corner ornaments */}
            <div style={{ position: 'absolute', top: 8, left: 8 }}><Corner size={28} /></div>
            <div style={{ position: 'absolute', bottom: 8, right: 8 }}><Corner size={28} flip="br" /></div>

            <div style={{ flexShrink: 0, width: 92, height: 92, borderRadius: 14, overflow: 'hidden', boxShadow: 'inset 0 0 0 2px var(--gold-deep), 0 4px 12px rgba(0,0,0,0.35)' }}>
              {g.preview}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 26, lineHeight: 1.1, color: 'var(--ink)' }}>{g.title}</div>
              <div style={{ marginTop: 4, fontSize: 13, color: 'var(--ink-dim)', fontFamily: 'var(--font-body)' }}>{g.subtitle}</div>
              <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--gold)', fontFamily: 'var(--font-ui)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>
                Play
                <svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 1l6 5-6 5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
          </motion.button>
        ))}

        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/how-to-play')}
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--ink-dim)',
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >How to play</button>
          <InstallPrompt />
        </div>
      </div>
    </PhoneShell>
  );
};

function LudoMini() {
  // Tiny 6×6 illustrative preview — 4 colored corners + center cross
  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', background: 'var(--bg-board-cream)' }}>
      {Array.from({ length: 36 }, (_, i) => {
        const r = Math.floor(i / 6);
        const c = i % 6;
        let bg: string = 'transparent';
        if (r < 2 && c < 2) bg = 'var(--p-red)';
        else if (r < 2 && c >= 4) bg = 'var(--p-green)';
        else if (r >= 4 && c < 2) bg = 'var(--p-blue)';
        else if (r >= 4 && c >= 4) bg = 'var(--p-yellow)';
        else if (r === 2 || r === 3 || c === 2 || c === 3) bg = 'var(--bg-board)';
        return <div key={i} style={{ background: bg, borderRight: '0.5px solid rgba(0,0,0,0.1)', borderBottom: '0.5px solid rgba(0,0,0,0.1)' }} />;
      })}
    </div>
  );
}

function SnLMini() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: 'var(--bg-board-cream)' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gridTemplateRows: 'repeat(6, 1fr)' }}>
        {Array.from({ length: 36 }, (_, i) => {
          const dark = (Math.floor(i / 6) + i) % 2 === 0;
          return <div key={i} style={{ background: dark ? 'var(--bg-board)' : 'var(--bg-board-cream)' }} />;
        })}
      </div>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* ladder */}
        <line x1="20" y1="80" x2="50" y2="20" stroke="var(--ladder)" strokeWidth="2" />
        <line x1="30" y1="80" x2="60" y2="20" stroke="var(--ladder)" strokeWidth="2" />
        <line x1="22" y1="65" x2="32" y2="65" stroke="var(--ladder)" strokeWidth="1.5" />
        <line x1="28" y1="45" x2="38" y2="45" stroke="var(--ladder)" strokeWidth="1.5" />
        {/* snake */}
        <path d="M 80 20 C 60 40, 90 60, 70 80" stroke="var(--snake)" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default GameSelect;
