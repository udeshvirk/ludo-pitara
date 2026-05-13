import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneShell from '../components/ui/PhoneShell';
import Header from '../components/ui/Header';
import Btn from '../components/ui/Btn';
import { clearStats, getStats, leaderboardFor, recentFor, type GameKey } from '../lib/stats';

const GAME_LABEL: Record<GameKey, string> = {
  ludo: 'Ludo',
  snl: 'Snakes & Ladders',
};

const StatsPage: React.FC = () => {
  const navigate = useNavigate();
  // Reset bumps this counter, which re-renders the page and re-reads
  // the stats from localStorage. Computed inline (no useMemo) because
  // the reads are cheap and useMemo's dep-tracking can't see that
  // these helpers read external state.
  const [, setVersion] = useState(0);
  const [tab, setTab] = useState<GameKey>('ludo');

  const totals = getStats().byGame;
  const board = leaderboardFor(tab);
  const recent = recentFor(tab);

  const onReset = () => {
    if (!confirm('Clear all stats? This cannot be undone.')) return;
    clearStats();
    setVersion(v => v + 1);
  };

  return (
    <PhoneShell contentMaxWidth={560}>
      <Header title="Stats" onBack={() => navigate(-1)} />

      <div style={{ flex: 1, padding: '8px 22px 28px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Game tab toggle */}
        <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
          {(['ludo', 'snl'] as GameKey[]).map(k => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 999,
                fontFamily: 'var(--font-ui)',
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: 0.4,
                color: tab === k ? '#fff' : 'var(--ink-dim)',
                background: tab === k ? 'linear-gradient(180deg, #ffa771, var(--saffron))' : 'transparent',
                boxShadow: tab === k ? 'inset 0 1px 0 rgba(255,255,255,0.35)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {GAME_LABEL[k]} · {totals[k].totalGames} {totals[k].totalGames === 1 ? 'game' : 'games'}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <Section title="Leaderboard">
          {board.length === 0 ? (
            <Empty text={`No ${GAME_LABEL[tab]} games played yet.`} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Row header />
              {board.map((p, i) => (
                <Row
                  key={p.name}
                  rank={i + 1}
                  name={p.name}
                  games={p.games}
                  wins={p.wins}
                  rate={p.games > 0 ? Math.round((p.wins / p.games) * 100) : 0}
                />
              ))}
            </div>
          )}
        </Section>

        {/* Recent games */}
        <Section title="Recent">
          {recent.length === 0 ? (
            <Empty text="Nothing here yet — play a game to record it." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recent.map(g => (
                <div
                  key={g.at}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontFamily: 'var(--font-ui)',
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <span style={{ color: 'var(--saffron)' }}>{g.winner}</span> won
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-faint)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      vs {g.players.filter(n => n !== g.winner).join(', ') || '—'}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-faint)', flexShrink: 0, paddingLeft: 8 }}>
                    {formatRelativeTime(g.at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Btn variant="danger" onClick={onReset}>Reset all stats</Btn>
      </div>
    </PhoneShell>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <div style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: 10, paddingLeft: 6 }}>{title}</div>
    {children}
  </div>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.10)', textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--ink-faint)' }}>
    {text}
  </div>
);

interface RowProps {
  header?: boolean;
  rank?: number;
  name?: string;
  games?: number;
  wins?: number;
  rate?: number;
}
const Row: React.FC<RowProps> = ({ header, rank, name, games, wins, rate }) => {
  const baseStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '28px 1fr 50px 50px 56px',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    borderRadius: 10,
    fontFamily: 'var(--font-ui)',
    fontSize: 13,
  };
  if (header) {
    return (
      <div style={{
        ...baseStyle,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        color: 'var(--ink-faint)',
        padding: '4px 12px',
      }}>
        <span>#</span>
        <span>Player</span>
        <span style={{ textAlign: 'right' }}>G</span>
        <span style={{ textAlign: 'right' }}>W</span>
        <span style={{ textAlign: 'right' }}>Rate</span>
      </div>
    );
  }
  return (
    <div style={{
      ...baseStyle,
      background: rank === 1 ? 'rgba(245, 184, 0, 0.12)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${rank === 1 ? 'rgba(245, 184, 0, 0.35)' : 'rgba(255,255,255,0.08)'}`,
    }}>
      <span style={{ color: rank === 1 ? 'var(--gold)' : 'var(--ink-dim)', fontWeight: 700 }}>{rank}</span>
      <span style={{ color: 'var(--ink)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
      <span style={{ textAlign: 'right', color: 'var(--ink-dim)' }}>{games}</span>
      <span style={{ textAlign: 'right', color: 'var(--ink)', fontWeight: 600 }}>{wins}</span>
      <span style={{ textAlign: 'right', color: 'var(--saffron)', fontWeight: 600 }}>{rate}%</span>
    </div>
  );
};

function formatRelativeTime(at: number): string {
  const diffMs = Date.now() - at;
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const month = Math.round(day / 30);
  return `${month}mo ago`;
}

export default StatsPage;
