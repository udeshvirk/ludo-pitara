import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PhoneShell from '../components/ui/PhoneShell';
import Header from '../components/ui/Header';
import Btn from '../components/ui/Btn';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import Chip from '../components/ui/Chip';
import OptionTile from '../components/ui/OptionTile';
import SegmentedPicker from '../components/ui/SegmentedPicker';
import { useFlow, type FlowPlayer, type GameOptions, type CPUDifficulty } from '../games/flow/store';
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

// Yard position is fixed by slot index AND player count (see LudoGame
// `SEATS_BY_COUNT`). The user-picked colour is purely cosmetic — it
// fills that slot's avatar/yard/tokens but does NOT move the player.
// Defaults match each slot's seat namesake so a fresh setup renders a
// canonical-looking board:
//   2 players → diagonal BL (blue) + TR (green)
//   3 players → BL (blue) + TL (red) + TR (green)
//   4 players → BL (blue) + TL (red) + TR (green) + BR (yellow)
function defaultColorsForCount(n: number): LudoColor[] {
  if (n === 2) return ['blue', 'green', 'yellow', 'red'];
  return ['blue', 'red', 'green', 'yellow'];
}

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
  // once via a useState initializer so the localStorage read happens
  // exactly once and there's no ref-read during render.
  const [last] = useState(() => getLastSetup());

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
  const [colors, setColors] = useState<LudoColor[]>(() => {
    const initialCount = last?.count ?? 2;
    const fallback = defaultColorsForCount(initialCount);
    if (!last) return fallback;
    // Pad/truncate to 4. Any missing slots fall back to whatever default
    // colour wasn't already used by the restored setup.
    const used = new Set(last.colors);
    const padding = fallback.filter(c => !used.has(c));
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

  // Game-rules toggles. Pre-fill from the last saved setup. The "Game
  // options" section starts collapsed when nothing's enabled, expanded
  // otherwise — anyone running with non-default rules sees them at a
  // glance instead of having to remember to open the panel.
  const [options, setOptions] = useState<GameOptions>(() => loadOptionsOrDefault());
  const initialHasCpu = isCPU.slice(0, count).some(Boolean);
  const anyOptionEnabled =
    options.ludo.oneTokenOut ||
    options.ludo.firstHomeWins ||
    options.ludo.partners ||
    (initialHasCpu && options.ludo.cpuDifficulty !== 'medium') ||
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

  const chipsForRow = (idx: number): string[] => {
    if (recents.length === 0) return [];
    const taken = new Set(
      Array.from({ length: count }, (_, i) => (i === idx ? '' : displayName(i).toLowerCase().trim())).filter(Boolean),
    );
    return recents.filter(r => !taken.has(r.toLowerCase()));
  };

  const partners = game === 'ludo' && options.ludo.partners;

  // Partner mode hijacks the player list: 2 team slots (A = blue+green,
  // B = red+yellow). We reuse customNames/isCPU slots 0 and 1 for the
  // two teams, and synthesise the 4 seat-coloured FlowPlayers at start.
  const TEAM_A_COLORS: LudoColor[] = ['blue', 'green'];
  const TEAM_B_COLORS: LudoColor[] = ['red', 'yellow'];
  const teamRow = (slot: 0 | 1): { name: string; isCPU: boolean; colors: LudoColor[] } => ({
    name: (customNames[slot] || '').trim() || (isCPU[slot] ? `Bot ${slot + 1}` : `Team ${slot === 0 ? 'A' : 'B'}`),
    isCPU: isCPU[slot],
    colors: slot === 0 ? TEAM_A_COLORS : TEAM_B_COLORS,
  });

  const start = () => {
    if (partners) {
      const teamA = teamRow(0);
      const teamB = teamRow(1);
      // Persist the human-facing summary so the next session pre-fills
      // the same team names and bot flags.
      saveLastSetup({
        count: 2,
        names: [teamA.name, teamB.name],
        colors: [teamA.colors[0], teamB.colors[0]],
        isCPU: [teamA.isCPU, teamB.isCPU],
        options,
      });
      const typed = [customNames[0], customNames[1]].filter(n => n.trim().length > 0);
      if (typed.length > 0) {
        rememberNames(typed);
        setRecents(getRecentNames());
      }
      // Build 4 FlowPlayers in seat order [blue, red, green, yellow] —
      // matches LudoGame's SEATS_BY_COUNT[4] so the seats line up
      // exactly. Each seat carries its team owner's name + bot flag.
      const built: FlowPlayer[] = [
        { name: teamA.name, color: 'blue',   isCPU: teamA.isCPU },
        { name: teamB.name, color: 'red',    isCPU: teamB.isCPU },
        { name: teamA.name, color: 'green',  isCPU: teamA.isCPU },
        { name: teamB.name, color: 'yellow', isCPU: teamB.isCPU },
      ];
      useLudoStore.getState().resetGame();
      setFlowOptions(options);
      setPlayers(built);
      navigate('/ludo');
      return;
    }
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
    // For Ludo, the YARD position is fixed by slot index (Player 1 = BL,
    // 2 = TL, 3 = TR, 4 = BR); LudoGame derives the seat from the
    // flowPlayers index. The colour the user picked is preserved
    // verbatim as the visual `displayColor`. For SNL, slot order is
    // turn order and colour is purely cosmetic — nothing to remap.
    // Reset the destination game store BEFORE navigating, otherwise
    // any persisted in-progress game would resume and the new player
    // setup would be ignored. The destination page's bootstrap
    // useEffect then sees gamePhase='setup' and re-inits with the
    // fresh flowPlayers.
    if (game === 'ludo') useLudoStore.getState().resetGame();
    else useSNLStore.getState().resetGame();
    setFlowOptions(options);
    setPlayers(built);
    navigate(game === 'ludo' ? '/ludo' : '/snakes-and-ladders');
  };

  const handleCountChange = (n: number) => {
    if (n === count) return;
    setCount(n);
    // Reset colour assignments to the CW-from-BL default for this
    // count — so 4-player picks don't inherit the 2-player diagonal
    // layout. User can recustomize via the colour chips after.
    setColors(defaultColorsForCount(n));
  };

  return (
    <PhoneShell contentMaxWidth={520}>
      <Header title="Set up players" subtitle={game === 'ludo' ? 'Ludo' : 'Snakes & Ladders'} onBack={() => navigate('/select')} />

      <div style={{ flex: 1, padding: '8px 22px 12px', overflow: 'auto' }}>
        {!partners && (
          <div style={{ marginBottom: 22 }}>
            <SegmentedPicker
              size="chunky"
              options={[
                { value: 2, label: '2 Players' },
                { value: 3, label: '3 Players' },
                { value: 4, label: '4 Players' },
              ]}
              value={count}
              onChange={handleCountChange}
              ariaLabel="Number of players"
            />
          </div>
        )}

        {partners ? (
          <ul aria-label="Teams" style={{ display: 'flex', flexDirection: 'column', gap: 12, listStyle: 'none', padding: 0, margin: 0 }}>
            {[0, 1].map((slot) => {
              const teamColors = slot === 0 ? TEAM_A_COLORS : TEAM_B_COLORS;
              const label = `Team ${slot === 0 ? 'A' : 'B'}`;
              return (
                <TeamRow
                  key={slot}
                  index={slot}
                  label={label}
                  colors={teamColors}
                  name={customNames[slot] || ''}
                  namePlaceholder={isCPU[slot] ? `Bot ${slot + 1}` : label}
                  displayInitial={(customNames[slot]?.trim() || label)[0]}
                  isCPU={isCPU[slot]}
                  onNameChange={(v) => updateName(slot, v)}
                  onToggleCpu={() => toggleCpu(slot)}
                />
              );
            })}
          </ul>
        ) : (
          <ul aria-label="Players" style={{ display: 'flex', flexDirection: 'column', gap: 12, listStyle: 'none', padding: 0, margin: 0 }}>
            {Array.from({ length: count }, (_, i) => (
              <PlayerRow
                key={i}
                index={i}
                avatarColor={palette[i]}
                name={customNames[i] || ''}
                namePlaceholder={autoDefaultName(i, isCPU)}
                displayInitial={displayName(i)[0]}
                isCPU={isCPU[i]}
                selectedColor={colors[i]}
                colors={colors.slice(0, count)}
                chips={activeNameIndex === i ? chipsForRow(i) : []}
                onNameChange={(v) => updateName(i, v)}
                onNameFocus={() => setActiveNameIndex(i)}
                onNameBlur={() => setTimeout(() => setActiveNameIndex(prev => (prev === i ? null : prev)), 120)}
                onColorPick={(c) => setColorAt(i, c)}
                onToggleCpu={() => toggleCpu(i)}
                onChipApply={(v) => applyChip(i, v)}
              />
            ))}
          </ul>
        )}

        <GameOptionsSection
          game={game}
          options={options}
          setOptions={setOptions}
          isOpen={optionsOpen}
          setOpen={setOptionsOpen}
          hasCpu={(options.ludo.partners ? isCPU.slice(0, 2) : isCPU.slice(0, count)).some(Boolean)}
        />
      </div>

      <div style={{ padding: '12px 22px 28px' }}>
        <Btn variant="primary" onClick={start} fullWidth>Start game</Btn>
      </div>
    </PhoneShell>
  );
};

// ─── PlayerRow ────────────────────────────────────────────────────────

interface PlayerRowProps {
  index: number;
  avatarColor: string;
  name: string;
  namePlaceholder: string;
  displayInitial: string;
  isCPU: boolean;
  selectedColor: LudoColor;
  colors: LudoColor[]; // colours used by other rows (for the "owned by other" dim)
  chips: string[];
  onNameChange: (v: string) => void;
  onNameFocus: () => void;
  onNameBlur: () => void;
  onColorPick: (c: LudoColor) => void;
  onToggleCpu: () => void;
  onChipApply: (v: string) => void;
}

const PlayerRow: React.FC<PlayerRowProps> = ({
  index, avatarColor, name, namePlaceholder, displayInitial, isCPU, selectedColor,
  colors, chips, onNameChange, onNameFocus, onNameBlur, onColorPick, onToggleCpu, onChipApply,
}) => (
  <motion.li
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    style={{ listStyle: 'none' }}
  >
    <Card padding="md" radius={18}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar color={avatarColor} label={displayInitial} size={44} ring isBot={isCPU} />
          <input
            type="text"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            onFocus={onNameFocus}
            onBlur={onNameBlur}
            placeholder={namePlaceholder}
            maxLength={14}
            aria-label={`Player ${index + 1} name`}
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
          <Chip
            tone={isCPU ? 'saffron' : 'default'}
            onClick={onToggleCpu}
            ariaLabel={isCPU ? 'Bot player' : 'Human player'}
            style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 800, padding: '6px 10px' }}
          >
            {isCPU ? 'Bot' : 'Human'}
          </Chip>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 56 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
            Color
          </span>
          {LUDO_COLORS.map(c => {
            const selected = selectedColor === c;
            const ownedByOther = colors.includes(c) && selectedColor !== c;
            return (
              <ColorDot
                key={c}
                color={c}
                selected={selected}
                ownedByOther={ownedByOther}
                onPick={() => onColorPick(c)}
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
            {chips.map(chipName => (
              <Chip
                key={chipName}
                tone="saffron"
                // mousedown fires before the input's blur — preventing
                // default keeps the name input focused (and the mobile
                // keyboard open) while the chip applies its value.
                onMouseDown={(e) => { e.preventDefault(); onChipApply(chipName); }}
                style={{ fontWeight: 600 }}
              >
                {chipName}
              </Chip>
            ))}
          </motion.div>
        )}
      </div>
    </Card>
  </motion.li>
);

const ColorDot: React.FC<{ color: LudoColor; selected: boolean; ownedByOther: boolean; onPick: () => void }> = ({
  color, selected, ownedByOther, onPick,
}) => (
  <button
    onClick={onPick}
    aria-pressed={selected}
    aria-label={`Use ${color}`}
    style={{
      width: 24,
      height: 24,
      borderRadius: '50%',
      background: COLOR_VAR[color],
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

// ─── TeamRow (partner mode) ───────────────────────────────────────────

interface TeamRowProps {
  index: number;
  label: string;
  colors: LudoColor[]; // two seat colours that belong to this team
  name: string;
  namePlaceholder: string;
  displayInitial: string;
  isCPU: boolean;
  onNameChange: (v: string) => void;
  onToggleCpu: () => void;
}

const TeamRow: React.FC<TeamRowProps> = ({
  index, label, colors, name, namePlaceholder, displayInitial, isCPU,
  onNameChange, onToggleCpu,
}) => (
  <motion.li
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.05 }}
    style={{ listStyle: 'none' }}
  >
    <Card padding="md" radius={18}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Two-tone avatar — the team's two colours, side by side. */}
          <div
            aria-hidden
            style={{
              width: 44, height: 44, borderRadius: '50%',
              background: `linear-gradient(135deg, ${COLOR_VAR[colors[0]]} 50%, ${COLOR_VAR[colors[1]]} 50%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontFamily: 'var(--font-ui)',
              boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.25)',
            }}
          >
            {displayInitial.toUpperCase()}
          </div>
          <input
            type="text"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            placeholder={namePlaceholder}
            maxLength={14}
            aria-label={`${label} name`}
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
          <Chip
            tone={isCPU ? 'saffron' : 'default'}
            onClick={onToggleCpu}
            ariaLabel={isCPU ? 'Bot player' : 'Human player'}
            style={{ fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 800, padding: '6px 10px' }}
          >
            {isCPU ? 'Bot' : 'Human'}
          </Chip>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 56 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
            Plays
          </span>
          {colors.map(c => (
            <span
              key={c}
              aria-label={c}
              style={{
                width: 18, height: 18, borderRadius: '50%',
                background: COLOR_VAR[c],
                border: '1px solid rgba(255,255,255,0.25)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }}
            />
          ))}
        </div>
      </div>
    </Card>
  </motion.li>
);

// ─── GameOptionsSection ────────────────────────────────────────────────

interface GameOptionsSectionProps {
  game: 'ludo' | 'snl' | null;
  options: GameOptions;
  setOptions: (o: GameOptions) => void;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  hasCpu: boolean;
}

const GameOptionsSection: React.FC<GameOptionsSectionProps> = ({
  game, options, setOptions, isOpen, setOpen, hasCpu,
}) => {
  if (!game) return null;

  const ludoItems = [
    {
      key: 'partners',
      label: 'Partner mode (2v2)',
      desc: 'Two teams of two colours each (Blue+Green vs Red+Yellow, diagonally). On your turn you can move any token from either of your team\'s two colours. Teammates can\'t capture each other.',
      checked: options.ludo.partners,
      set: (v: boolean) => setOptions({ ...options, ludo: { ...options.ludo, partners: v } }),
    },
    {
      key: 'oneTokenOut',
      label: '1 token starts out',
      desc: 'One token per player starts already on its start cell. The other three still need a 6.',
      checked: options.ludo.oneTokenOut,
      set: (v: boolean) => setOptions({ ...options, ludo: { ...options.ludo, oneTokenOut: v } }),
    },
    // firstHomeWins is hidden in partner mode — a team only wins when
    // all 8 of its tokens are home.
    ...(options.ludo.partners ? [] : [{
      key: 'firstHomeWins',
      label: 'First token home wins',
      desc: 'The first player to bring any token home wins — instead of having to bring all four.',
      checked: options.ludo.firstHomeWins,
      set: (v: boolean) => setOptions({ ...options, ludo: { ...options.ludo, firstHomeWins: v } }),
    }]),
  ];
  const snlItems = [
    {
      key: 'autoStart',
      label: 'Skip 1-to-start',
      desc: 'Players enter the board on any roll instead of needing to roll a 1.',
      checked: options.snl.autoStart,
      set: (v: boolean) => setOptions({ ...options, snl: { ...options.snl, autoStart: v } }),
    },
  ];
  const items = game === 'ludo' ? ludoItems : snlItems;

  // Bot difficulty is not a toggle; track it separately for the "N on"
  // header summary and only render when a bot is in the lineup.
  const showDifficulty = game === 'ludo' && hasCpu;
  const difficultyChanged = showDifficulty && options.ludo.cpuDifficulty !== 'medium';
  const enabledCount =
    items.filter(i => i.checked).length +
    (difficultyChanged ? 1 : 0);

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
        <Chevron open={isOpen} />
      </button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          {items.map(item => (
            <OptionTile
              key={item.key}
              label={item.label}
              description={item.desc}
              checked={item.checked}
              onChange={v => { item.set(v); playTap(); haptics.tap(); }}
            />
          ))}

          {showDifficulty && (
            <OptionTile
              label="Bot difficulty"
              description="How strong the bots play. Easy moves mostly at random; Medium plays a simple heuristic (prefers captures, freeing tokens, finishing); Hard adds a look-ahead so bots avoid landing where you could capture them next turn."
              active={difficultyChanged}
              control={
                <SegmentedPicker
                  options={[
                    { value: 'easy', label: 'Easy' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'hard', label: 'Hard' },
                  ]}
                  value={options.ludo.cpuDifficulty}
                  onChange={(d: CPUDifficulty) =>
                    setOptions({ ...options, ludo: { ...options.ludo, cpuDifficulty: d } })}
                  ariaLabel="Bot difficulty"
                />
              }
            />
          )}
        </motion.div>
      )}
    </div>
  );
};

const Chevron: React.FC<{ open: boolean }> = ({ open }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 160ms ease' }}
  >
    <path d="M3 5l4 4 4-4" />
  </svg>
);

export default PlayerSetup;
