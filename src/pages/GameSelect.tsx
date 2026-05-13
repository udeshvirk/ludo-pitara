import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PhoneShell from '../components/ui/PhoneShell';
import Header from '../components/ui/Header';
import Corner from '../components/ui/Corner';
import IconButton from '../components/ui/IconButton';
import InstallPrompt from '../components/InstallPrompt';
import { useFlow } from '../games/flow/store';
import type { GameId } from '../games/flow/store';
import { detectSavedFor, type SavedGame } from '../lib/gameSaves';
import { useLudoStore } from '../games/ludo/store';
import { useSNLStore } from '../games/snl/store';
import { playTap } from '../lib/sound';
import { haptics } from '../lib/haptics';

const games: Array<{
  id: GameId;
  title: string;
  subtitle: string;
  preview: React.ReactNode;
}> = [
  { id: 'ludo', title: 'Ludo',                 subtitle: 'Strategy · 2–4 players', preview: <LudoMini /> },
  { id: 'snl',  title: 'Snakes & Ladders',     subtitle: 'Luck · 2–4 players',     preview: <SnLMini /> },
];

const GameSelect: React.FC = () => {
  const navigate = useNavigate();
  const setGame = useFlow(s => s.setGame);
  // Bump to re-evaluate detectSavedFor after a dismiss without a full
  // route remount.
  const [savedTick, setSavedTick] = useState(0);

  const choose = (g: GameId) => {
    setGame(g);
    navigate('/players');
  };

  const resume = (g: GameId) => {
    playTap();
    haptics.tap();
    setGame(g);
    navigate(g === 'ludo' ? '/ludo' : '/snakes-and-ladders');
  };

  const dismissSaved = (g: GameId) => {
    playTap();
    haptics.tap();
    // resetGame() both clears the persisted snapshot and wipes the
    // in-memory store so the next "New game" tap starts clean.
    if (g === 'ludo') useLudoStore.getState().resetGame();
    else useSNLStore.getState().resetGame();
    setSavedTick(t => t + 1);
  };

  return (
    <PhoneShell contentMaxWidth={520}>
      <Header
        title="Choose your game"
        subtitle="Section 1 · Entry"
        onBack={() => navigate('/')}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <IconButton ariaLabel="Stats" onClick={() => navigate('/stats')}>
              <BarChartIcon />
            </IconButton>
            <IconButton ariaLabel="Settings" onClick={() => navigate('/settings')}>
              <GearIcon />
            </IconButton>
          </div>
        }
      />
      <div style={{ flex: 1, padding: '8px 22px 28px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'auto' }}>
        <ul aria-label="Available games" style={{ display: 'flex', flexDirection: 'column', gap: 18, listStyle: 'none', padding: 0, margin: 0 }}>
        {games.map((g, i) => {
          // savedTick re-evaluates the chip after a dismiss.
          void savedTick;
          const saved = detectSavedFor(g.id);
          return (
            <motion.li
              key={g.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none' }}
            >
              {saved && (
                <ContinueStrip
                  saved={saved}
                  gameTitle={g.title}
                  onResume={() => resume(g.id)}
                  onDismiss={() => dismissSaved(g.id)}
                />
              )}
              <GameTile game={g} cta={saved ? 'New game' : 'Play'} onClick={() => choose(g.id)} />
            </motion.li>
          );
        })}
        </ul>

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

// ─── ContinueStrip ────────────────────────────────────────────────────

interface ContinueStripProps {
  saved: SavedGame;
  gameTitle: string;
  onResume: () => void;
  onDismiss: () => void;
}

const ContinueStrip: React.FC<ContinueStripProps> = ({ saved, gameTitle, onResume, onDismiss }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'stretch',
      borderRadius: 14,
      background: 'rgba(255, 138, 61, 0.10)',
      border: '1px solid rgba(255, 138, 61, 0.35)',
      overflow: 'hidden',
    }}
  >
    <button
      onClick={onResume}
      style={{
        flex: 1,
        padding: '8px 14px',
        background: 'transparent',
        border: 'none',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        color: 'var(--saffron)',
        fontFamily: 'var(--font-ui)',
      }}
    >
      <span style={{ fontWeight: 800, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase' }}>Continue</span>
      <span style={{ fontSize: 12, color: 'var(--ink-dim)', fontWeight: 600 }}>· {saved.hint}</span>
      <svg width="11" height="11" viewBox="0 0 12 12" style={{ marginLeft: 'auto' }}>
        <path d="M3 1l6 5-6 5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
    <button
      onClick={onDismiss}
      aria-label={`Dismiss saved ${gameTitle} game`}
      style={{
        padding: '0 12px',
        background: 'transparent',
        border: 'none',
        borderLeft: '1px solid rgba(255, 138, 61, 0.25)',
        cursor: 'pointer',
        color: 'var(--ink-dim)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 12 12">
        <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </button>
  </div>
);

// ─── GameTile ─────────────────────────────────────────────────────────

interface GameTileProps {
  game: { id: GameId; title: string; subtitle: string; preview: React.ReactNode };
  cta: string;
  onClick: () => void;
}

const GameTile: React.FC<GameTileProps> = ({ game, cta, onClick }) => (
  <motion.button
    whileHover={{ y: -3 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
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
    <div style={{ position: 'absolute', top: 8, left: 8 }}><Corner size={28} /></div>
    <div style={{ position: 'absolute', bottom: 8, right: 8 }}><Corner size={28} flip="br" /></div>

    <div style={{ flexShrink: 0, width: 92, height: 92, borderRadius: 14, overflow: 'hidden', boxShadow: 'inset 0 0 0 2px var(--gold-deep), 0 4px 12px rgba(0,0,0,0.35)' }}>
      {game.preview}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 26, lineHeight: 1.1, color: 'var(--ink)' }}>{game.title}</div>
      <div style={{ marginTop: 4, fontSize: 13, color: 'var(--ink-dim)', fontFamily: 'var(--font-body)' }}>{game.subtitle}</div>
      <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--saffron)', fontFamily: 'var(--font-ui)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 700 }}>
        {cta}
        <svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 1l6 5-6 5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </div>
  </motion.button>
);

// ─── Icons ────────────────────────────────────────────────────────────

const BarChartIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="6" y1="20" x2="6" y2="12" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="18" y1="20" x2="18" y2="8" />
  </svg>
);

const GearIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// ─── Mini previews ────────────────────────────────────────────────────

function LudoMini() {
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
        <line x1="20" y1="80" x2="50" y2="20" stroke="var(--ladder)" strokeWidth="2" />
        <line x1="30" y1="80" x2="60" y2="20" stroke="var(--ladder)" strokeWidth="2" />
        <line x1="22" y1="65" x2="32" y2="65" stroke="var(--ladder)" strokeWidth="1.5" />
        <line x1="28" y1="45" x2="38" y2="45" stroke="var(--ladder)" strokeWidth="1.5" />
        <path d="M 80 20 C 60 40, 90 60, 70 80" stroke="var(--snake)" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default GameSelect;
