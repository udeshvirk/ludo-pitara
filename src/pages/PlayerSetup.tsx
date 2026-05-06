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

// Default name = "Player N" for humans, "AI N" for CPUs, where N counts
// only the same-type slots up to and including this one. Order:
//   [human, cpu, human, cpu] → Player 1, AI 1, Player 2, AI 2
function autoDefaultName(slot: number, isCPU: boolean[]): string {
  let humans = 0;
  let ais = 0;
  for (let i = 0; i <= slot; i++) {
    if (isCPU[i]) ais++;
    else humans++;
  }
  return isCPU[slot] ? `AI ${ais}` : `Player ${humans}`;
}

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
  // `customNames[i]` is whatever the user typed (or an empty string for
  // "use the auto default"). The displayed name falls back to
  // autoDefaultName when customNames[i] is empty, so toggling Human/AI
  // updates the name unless the user typed something explicit.
  const [customNames, setCustomNames] = useState<string[]>(['', '', '', '']);
  const [colors, setColors] = useState<LudoColor[]>(['red', 'yellow', 'green', 'blue']);
  // Default isCPU mirrors the mode chosen on the previous screen but is
  // fully editable here (so a Solo player can have 2 humans + 2 AI, etc).
  const [isCPU, setIsCPU] = useState<boolean[]>(() =>
    mode === 'cpu' ? [false, true, true, true] : [false, false, false, false]
  );
  const [activeNameIndex, setActiveNameIndex] = useState<number | null>(null);
  const [recents, setRecents] = useState<string[]>(() => getRecentNames());

  // Re-seed defaults if the player flips the Mode page selection after
  // the first time we landed here.
  useEffect(() => {
    setIsCPU(mode === 'cpu' ? [false, true, true, true] : [false, false, false, false]);
  }, [mode]);

  const palette = useMemo<string[]>(() => colors.slice(0, count).map(c => COLOR_VAR[c]), [colors, count]);

  const displayName = (slot: number): string => {
    const custom = (customNames[slot] || '').trim();
    if (custom.length > 0) return customNames[slot];
    return autoDefaultName(slot, isCPU);
  };

  // Picking a colour that's already on another row swaps the two rows'
  // colours so every player still has a unique colour.
  const setColorAt = (idx: number, color: LudoColor) => {
    setColors(prev => {
      if (prev[idx] === color) return prev;
      const next = [...prev];
      const swapWith = next.indexOf(color);
      if (swapWith !== -1) next[swapWith] = next[idx];
      next[idx] = color;
      return next;
    });
    playTap();
    haptics.tap();
  };

  const toggleCpu = (idx: number) => {
    setIsCPU(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
    playTap();
    haptics.tap();
  };

  const updateName = (idx: number, value: string) => {
    setCustomNames(prev => {
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
    const finalNames = Array.from({ length: count }, (_, i) => displayName(i));
    // Only remember user-typed names (skip auto defaults like "AI 1").
    const typed = customNames.slice(0, count).filter(n => n.trim().length > 0);
    if (typed.length > 0) {
      rememberNames(typed);
      setRecents(getRecentNames());
    }

    const built: FlowPlayer[] = finalNames.map((name, i) => ({
      name,
      color: colors[i],
      isCPU: isCPU[i],
    }));
    setPlayers(built);
    navigate(game === 'ludo' ? '/ludo' : '/snakes-and-ladders');
  };

  const chipsForRow = (idx: number): string[] => {
    if (recents.length === 0) return [];
    const taken = new Set(
      Array.from({ length: count }, (_, i) => (i === idx ? '' : displayName(i).toLowerCase().trim())).filter(Boolean),
    );
    return recents.filter(r => !taken.has(r.toLowerCase()));
  };

  return (
    <PhoneShell contentMaxWidth={520}>
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
                color: count === n ? '#fff' : 'var(--ink-dim)',
                background: count === n ? 'linear-gradient(180deg, #ffa771, var(--saffron))' : 'transparent',
                boxShadow: count === n ? 'inset 0 1px 0 rgba(255,255,255,0.35)' : 'none',
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
            const cpu = isCPU[i];
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar color={palette[i]} label={displayName(i)[0]} size={44} ring />
                  <input
                    type="text"
                    value={customNames[i] || ''}
                    onChange={e => updateName(i, e.target.value)}
                    onFocus={() => setActiveNameIndex(i)}
                    onBlur={() => setTimeout(() => setActiveNameIndex(prev => (prev === i ? null : prev)), 120)}
                    placeholder={autoDefaultName(i, isCPU)}
                    maxLength={14}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '10px 12px',
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
                    onClick={() => toggleCpu(i)}
                    aria-pressed={cpu}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      background: cpu ? 'rgba(255, 138, 61, 0.18)' : 'transparent',
                      border: '1px solid ' + (cpu ? 'var(--saffron)' : 'rgba(255,255,255,0.20)'),
                      color: cpu ? 'var(--saffron)' : 'var(--ink-dim)',
                      fontFamily: 'var(--font-ui)',
                      fontWeight: 800,
                      fontSize: 10,
                      letterSpacing: 1.4,
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      flexShrink: 0,
                    }}
                  >
                    {cpu ? 'AI' : 'You'}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 56 }}>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
                    Color
                  </span>
                  {LUDO_COLORS.map(c => {
                    const selected = colors[i] === c;
                    const ownedBy = colors.indexOf(c);
                    const ownedByOther = ownedBy !== -1 && ownedBy !== i && ownedBy < count;
                    return (
                      <button
                        key={c}
                        onClick={() => setColorAt(i, c)}
                        aria-pressed={selected}
                        aria-label={c}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: COLOR_VAR[c],
                          border: selected ? '2px solid #fff' : '1px solid rgba(255,255,255,0.25)',
                          boxShadow: selected
                            ? '0 0 0 2px var(--saffron), 0 2px 6px rgba(0,0,0,0.4)'
                            : '0 1px 4px rgba(0,0,0,0.3)',
                          opacity: ownedByOther ? 0.45 : 1,
                          cursor: 'pointer',
                          padding: 0,
                          flexShrink: 0,
                        }}
                      />
                    );
                  })}
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
                          background: 'rgba(255, 138, 61, 0.10)',
                          border: '1px solid rgba(255, 138, 61, 0.35)',
                          color: 'var(--saffron)',
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
