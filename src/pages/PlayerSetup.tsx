import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PhoneShell from '../components/ui/PhoneShell';
import Header from '../components/ui/Header';
import Btn from '../components/ui/Btn';
import Avatar from '../components/ui/Avatar';
import { useFlow, type FlowPlayer } from '../games/flow/store';
import { playTap } from '../lib/sound';
import { haptics } from '../lib/haptics';
import { getRecentNames, rememberNames } from '../lib/recentNames';

type LudoColor = 'red' | 'green' | 'yellow' | 'blue';
const LUDO_COLORS: LudoColor[] = ['red', 'green', 'yellow', 'blue'];
const COLOR_VAR: Record<LudoColor, string> = {
  red: 'var(--p-red)',
  green: 'var(--p-green)',
  yellow: 'var(--p-yellow)',
  blue: 'var(--p-blue)',
};

const defaultName = (i: number) => `Player ${i + 1}`;

const PlayerSetup: React.FC = () => {
  const navigate = useNavigate();
  const game = useFlow(s => s.game);
  const mode = useFlow(s => s.mode);
  const setPlayers = useFlow(s => s.setPlayers);

  useEffect(() => {
    if (!game) navigate('/select');
    else if (!mode) navigate('/mode');
  }, [game, mode, navigate]);

  const [count, setCount] = useState(2);
  const [names, setNames] = useState<string[]>([defaultName(0), defaultName(1), defaultName(2), defaultName(3)]);
  const [colors, setColors] = useState<LudoColor[]>(['red', 'yellow', 'green', 'blue']);
  const [activeNameIndex, setActiveNameIndex] = useState<number | null>(null);
  const [recents, setRecents] = useState<string[]>(() => getRecentNames());

  const palette = useMemo<string[]>(() => colors.slice(0, count).map(c => COLOR_VAR[c]), [colors, count]);

  const cycleColor = (idx: number) => {
    setColors(prev => {
      const next = [...prev];
      const taken = new Set(prev.filter((_, i) => i !== idx));
      const cur = prev[idx];
      const start = LUDO_COLORS.indexOf(cur);
      for (let step = 1; step <= LUDO_COLORS.length; step++) {
        const candidate = LUDO_COLORS[(start + step) % LUDO_COLORS.length];
        if (!taken.has(candidate)) {
          next[idx] = candidate;
          break;
        }
      }
      return next;
    });
    playTap();
    haptics.tap();
  };

  const updateName = (idx: number, value: string) => {
    setNames(prev => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const applyChip = (idx: number, value: string) => {
    updateName(idx, value);
    setActiveNameIndex(idx);
    playTap();
    haptics.tap();
  };

  const start = () => {
    const finalNames = Array.from({ length: count }, (_, i) => {
      const v = (names[i] || '').trim();
      return v.length > 0 ? v : defaultName(i);
    });
    rememberNames(finalNames);
    setRecents(getRecentNames());

    const built: FlowPlayer[] = finalNames.map((name, i) => ({
      name,
      color: colors[i],
      isCPU: mode === 'cpu' && i > 0,
    }));
    setPlayers(built);
    navigate(game === 'ludo' ? '/ludo' : '/snakes-and-ladders');
  };

  // Recent-name chips for the focused row, filtered to ones not already in
  // the current names list (case-insensitive).
  const chipsForRow = (idx: number): string[] => {
    if (recents.length === 0) return [];
    const taken = new Set(
      names.slice(0, count).map((n, i) => (i === idx ? '' : n.toLowerCase().trim())).filter(Boolean),
    );
    return recents.filter(r => !taken.has(r.toLowerCase()));
  };

  return (
    <PhoneShell>
      <Header title="Set up players" subtitle={game === 'ludo' ? 'Ludo' : 'Snakes & Ladders'} onBack={() => navigate('/mode')} />

      <div style={{ flex: 1, padding: '8px 22px 12px', overflow: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, padding: 4, borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', marginBottom: 22 }}>
          {[2, 3, 4].map(n => (
            <button
              key={n}
              onClick={() => { setCount(n); playTap(); haptics.tap(); }}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 999,
                fontFamily: 'var(--font-ui)',
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: 0.4,
                color: count === n ? '#3a1f00' : 'var(--ink-dim)',
                background: count === n ? 'linear-gradient(180deg, var(--gold-hi), var(--gold))' : 'transparent',
                boxShadow: count === n ? 'inset 0 1px 0 rgba(255,255,255,0.6)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {n} Players
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: count }, (_, i) => {
            const chips = activeNameIndex === i ? chipsForRow(i) : [];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  padding: 12,
                  borderRadius: 18,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <button
                    onClick={() => cycleColor(i)}
                    aria-label="Cycle color"
                    style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    <Avatar color={palette[i]} label={(names[i] || `P${i + 1}`)[0]} size={48} ring />
                  </button>
                  <input
                    type="text"
                    value={names[i] || ''}
                    onChange={e => updateName(i, e.target.value)}
                    onFocus={() => setActiveNameIndex(i)}
                    onBlur={() => setTimeout(() => setActiveNameIndex(prev => (prev === i ? null : prev)), 120)}
                    placeholder={defaultName(i)}
                    maxLength={14}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: 'rgba(0,0,0,0.18)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'var(--ink)',
                      fontFamily: 'var(--font-ui)',
                      fontWeight: 600,
                      fontSize: 15,
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => cycleColor(i)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: palette[i],
                      border: '2px solid rgba(255,255,255,0.55)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                      cursor: 'pointer',
                    }}
                    aria-label="Change color"
                  />
                  {mode === 'cpu' && i > 0 && (
                    <span style={{ fontFamily: 'var(--font-ui)', fontWeight: 800, fontSize: 10, letterSpacing: 1.3, color: 'var(--gold)', textTransform: 'uppercase' }}>CPU</span>
                  )}
                </div>

                {chips.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
                  >
                    {chips.map(name => (
                      <button
                        key={name}
                        onMouseDown={(e) => { e.preventDefault(); applyChip(i, name); }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 999,
                          background: 'rgba(245, 184, 0, 0.10)',
                          border: '1px solid rgba(245, 184, 0, 0.35)',
                          color: 'var(--gold-hi)',
                          fontFamily: 'var(--font-ui)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '12px 22px 28px' }}>
        <Btn variant="primary" onClick={start} fullWidth>Start game</Btn>
      </div>
    </PhoneShell>
  );
};

export default PlayerSetup;
