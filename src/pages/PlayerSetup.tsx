import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PhoneShell from '../components/ui/PhoneShell';
import Header from '../components/ui/Header';
import Btn from '../components/ui/Btn';
import Avatar from '../components/ui/Avatar';
import { useFlow, type FlowPlayer, type GameOptions } from '../games/flow/store';
import { useLudoStore } from '../games/ludo/store';
import { useSNLStore } from '../games/snl/store';
import { playTap } from '../lib/sound';
import { haptics } from '../lib/haptics';
import { getRecentNames, rememberNames } from '../lib/recentNames';
import { getLastSetup, loadOptionsOrDefault, saveLastSetup } from '../lib/lastSetup';

type LudoColor = 'red' | 'green' | 'yellow' | 'blue';
const LUDO_COLORS: LudoColor[] = ['red', 'green', 'yellow', 'blue'];
const COLOR_VAR: Record<LudoColor, string> = {
  red: 'var(--p-red)',
  green: 'var(--p-green)',
  yellow: 'var(--p-yellow)',
  blue: 'var(--p-blue)',
};

// Default name = "Player N" for humans, "Bot N" for CPUs, where N
// counts only the same-type slots up to and including this one.
// Order: [human, cpu, human, cpu] → Player 1, Bot 1, Player 2, Bot 2.
function autoDefaultName(slot: number, isCPU: boolean[]): string {
  let humans = 0;
  let bots = 0;
  for (let i = 0; i <= slot; i++) {
    if (isCPU[i]) bots++;
    else humans++;
  }
  return isCPU[slot] ? `Bot ${bots}` : `Player ${humans}`;
}

const PlayerSetup: React.FC = () => {
  const navigate = useNavigate();
  const game = useFlow(s => s.game);
  const setPlayers = useFlow(s => s.setPlayers);
  const setFlowOptions = useFlow(s => s.setOptions);

  useEffect(() => {
    if (!game) navigate('/select');
  }, [game, navigate]);

  // PWA quality-of-life: pre-fill from the user's most recent setup so
  // they don't have to retype the same players every session. Captured
  // once on mount; later state writes don't affect this snapshot.
  const lastSetupRef = useRef(getLastSetup());
  const last = lastSetupRef.current;

  const [count, setCount] = useState(() => last?.count ?? 2);
  // `customNames[i]` is whatever the user typed (or an empty string for
  // "use the auto default"). The displayed name falls back to
  // autoDefaultName when customNames[i] is empty, so toggling Human/AI
  // updates the name unless the user typed something explicit.
  const [customNames, setCustomNames] = useState<string[]>(() =>
    last
      ? [...last.names, '', '', '', ''].slice(0, 4)
      : ['', '', '', ''],
  );
  // Default colour order so the slot-0 player (the human in cpu mode)
  // lands on a bottom yard, and slot-1 lands diagonally on a top yard
  // — so a 1-human + 1-bot Ludo game seats them across the board:
  //   slot 0 → blue   (bottom-left yard)   [human in 1H+1B]
  //   slot 1 → green  (top-right yard)     [bot   in 1H+1B]
  //   slot 2 → yellow (bottom-right yard)
  //   slot 3 → red    (top-left yard)
  const defaultColors: LudoColor[] = ['blue', 'green', 'yellow', 'red'];
  const [colors, setColors] = useState<LudoColor[]>(() => {
    if (!last) return defaultColors;
    // Pad/truncate to 4. Any missing slots fall back to whatever default
    // colour wasn't already used by the restored setup.
    const used = new Set(last.colors);
    const padding = defaultColors.filter(c => !used.has(c));
    return [...last.colors, ...padding].slice(0, 4) as LudoColor[];
  });
  // Bots are toggled per-slot via the Human/Bot switch below. Default to
  // all-human; the user opts each slot into a bot as desired.
  const [isCPU, setIsCPU] = useState<boolean[]>(() => {
    if (last) return [...last.isCPU, false, false, false, false].slice(0, 4);
    return [false, false, false, false];
  });
  const [activeNameIndex, setActiveNameIndex] = useState<number | null>(null);
  const [recents, setRecents] = useState<string[]>(() => getRecentNames());

  // Game-rules toggles. Pre-fill from the last saved setup so users
  // don't have to flip the same options every session. The "Game
  // options" section starts collapsed when nothing's enabled, expanded
  // otherwise — anyone running with non-default rules sees them at a
  // glance instead of having to remember to open the panel.
  const [options, setOptions] = useState<GameOptions>(() => loadOptionsOrDefault());
  const anyOptionEnabled =
    options.ludo.oneTokenOut ||
    options.ludo.firstHomeWins ||
    options.snl.autoStart;
  const [optionsOpen, setOptionsOpen] = useState<boolean>(anyOptionEnabled);

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
    // Only remember user-typed names (skip auto defaults like "Bot 1").
    const typed = customNames.slice(0, count).filter(n => n.trim().length > 0);
    if (typed.length > 0) {
      rememberNames(typed);
      setRecents(getRecentNames());
    }

    // Persist the whole setup so the next session pre-fills with these
    // exact players (count, names, colours, human/CPU per slot, options).
    saveLastSetup({
      count,
      names: finalNames,
      colors: colors.slice(0, count),
      isCPU: isCPU.slice(0, count),
      options,
    });

    const built: FlowPlayer[] = finalNames.map((name, i) => ({
      name,
      color: colors[i],
      isCPU: isCPU[i],
    }));
    // Reset the destination game store BEFORE navigating, otherwise
    // any persisted in-progress game would resume and the new player
    // setup would be ignored. The destination page's bootstrap
    // useEffect then sees gamePhase='setup' and re-inits with the
    // fresh flowPlayers.
    if (game === 'ludo') {
      useLudoStore.getState().resetGame();
    } else {
      useSNLStore.getState().resetGame();
    }
    setFlowOptions(options);
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
      <Header title="Set up players" subtitle={game === 'ludo' ? 'Ludo' : 'Snakes & Ladders'} onBack={() => navigate('/select')} />

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
                  <Avatar color={palette[i]} label={displayName(i)[0]} size={44} ring isBot={cpu} />
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
                    {cpu ? 'Bot' : 'Human'}
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

        <GameOptionsSection
          game={game}
          options={options}
          setOptions={setOptions}
          isOpen={optionsOpen}
          setOpen={setOptionsOpen}
        />
      </div>

      <div style={{ padding: '12px 22px 28px' }}>
        <Btn variant="primary" onClick={start} fullWidth>Start game</Btn>
      </div>
    </PhoneShell>
  );
};

interface GameOptionsSectionProps {
  game: 'ludo' | 'snl' | null;
  options: GameOptions;
  setOptions: (o: GameOptions) => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

const GameOptionsSection: React.FC<GameOptionsSectionProps> = ({
  game,
  options,
  setOptions,
  isOpen,
  setOpen,
}) => {
  if (!game) return null;
  const items = game === 'ludo'
    ? [
        {
          key: 'oneTokenOut' as const,
          label: '1 token starts out',
          desc: 'One token per player starts already on its start cell. The other three still need a 6.',
          checked: options.ludo.oneTokenOut,
          set: (v: boolean) =>
            setOptions({ ...options, ludo: { ...options.ludo, oneTokenOut: v } }),
        },
        {
          key: 'firstHomeWins' as const,
          label: 'First token home wins',
          desc: 'The first player to bring any token home wins — instead of having to bring all four.',
          checked: options.ludo.firstHomeWins,
          set: (v: boolean) =>
            setOptions({ ...options, ludo: { ...options.ludo, firstHomeWins: v } }),
        },
      ]
    : [
        {
          key: 'autoStart' as const,
          label: 'Skip 1-to-start',
          desc: 'Players enter the board on any roll instead of needing to roll a 1.',
          checked: options.snl.autoStart,
          set: (v: boolean) =>
            setOptions({ ...options, snl: { ...options.snl, autoStart: v } }),
        },
      ];

  const enabledCount = items.filter(i => i.checked).length;

  return (
    <div style={{ marginTop: 18 }}>
      <button
        onClick={() => { setOpen(!isOpen); playTap(); haptics.tap(); }}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderRadius: 14,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'var(--ink)',
          fontFamily: 'var(--font-ui)',
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        <span>
          Game options
          {enabledCount > 0 && (
            <span style={{ marginLeft: 8, color: 'var(--saffron)', fontSize: 11 }}>
              · {enabledCount} on
            </span>
          )}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 160ms ease' }}
        >
          <path d="M3 5l4 4 4-4" />
        </svg>
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {items.map(item => (
            <label
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: 12,
                borderRadius: 14,
                background: item.checked ? 'rgba(255, 138, 61, 0.08)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${item.checked ? 'rgba(255, 138, 61, 0.35)' : 'rgba(255,255,255,0.08)'}`,
                cursor: 'pointer',
              }}
            >
              <Toggle
                checked={item.checked}
                onChange={v => { item.set(v); playTap(); haptics.tap(); }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>
                  {item.label}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: 'var(--ink-dim)', lineHeight: 1.4 }}>
                  {item.desc}
                </div>
              </div>
            </label>
          ))}
        </motion.div>
      )}
    </div>
  );
};

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={e => { e.preventDefault(); onChange(!checked); }}
    style={{
      flexShrink: 0,
      width: 36,
      height: 22,
      borderRadius: 999,
      padding: 2,
      background: checked ? 'var(--saffron)' : 'rgba(255,255,255,0.12)',
      border: '1px solid ' + (checked ? 'var(--saffron)' : 'rgba(255,255,255,0.18)'),
      position: 'relative',
      cursor: 'pointer',
      transition: 'background 160ms ease, border-color 160ms ease',
    }}
  >
    <span
      style={{
        display: 'block',
        width: 16,
        height: 16,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        transform: checked ? 'translateX(14px)' : 'translateX(0)',
        transition: 'transform 160ms ease',
      }}
    />
  </button>
);

export default PlayerSetup;
