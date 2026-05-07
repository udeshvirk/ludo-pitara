// Per-name win/games stats, stored under a single localStorage blob.
// Records every finished game once (callers guard against double-call
// via a ref/flag — see LudoGame / SnakesAndLaddersGame).

import { load, save, clear } from './persist';

export type GameKey = 'ludo' | 'snl';

export interface PlayerStat {
  name: string;
  games: number;
  wins: number;
}

export interface RecentGame {
  at: number;            // epoch ms
  game: GameKey;
  winner: string;
  players: string[];
}

export interface StatsBlob {
  byGame: Record<GameKey, {
    players: Record<string, PlayerStat>;
    totalGames: number;
  }>;
  recent: RecentGame[];   // last 10 across both games, newest first
}

const STORAGE_KEY = 'stats';
const RECENT_CAP = 10;

const EMPTY: StatsBlob = {
  byGame: {
    ludo: { players: {}, totalGames: 0 },
    snl:  { players: {}, totalGames: 0 },
  },
  recent: [],
};

function readBlob(): StatsBlob {
  // Merge with EMPTY so a missing per-game slice or recent[] is filled
  // in even if an older version of the blob was persisted.
  const raw = load<Partial<StatsBlob>>(STORAGE_KEY, EMPTY);
  return {
    byGame: {
      ludo: { ...EMPTY.byGame.ludo, ...(raw.byGame?.ludo || {}) },
      snl:  { ...EMPTY.byGame.snl,  ...(raw.byGame?.snl  || {}) },
    },
    recent: raw.recent || [],
  };
}

export function getStats(): StatsBlob {
  return readBlob();
}

export function recordGame(game: GameKey, players: string[], winner: string): void {
  const blob = readBlob();
  const slice = blob.byGame[game];
  // Each player participated; one of them won. We bump games for
  // every name in `players` and wins for `winner` only. Names are
  // keyed verbatim — two real-world humans sharing a typed name will
  // share a row, which is acceptable for an offline pass-and-play app.
  for (const name of players) {
    const trimmed = (name || '').trim();
    if (!trimmed) continue;
    const cur = slice.players[trimmed] || { name: trimmed, games: 0, wins: 0 };
    cur.games += 1;
    if (trimmed === winner.trim()) cur.wins += 1;
    slice.players[trimmed] = cur;
  }
  slice.totalGames += 1;
  // Recent games — newest first, cap at RECENT_CAP.
  blob.recent = [
    { at: Date.now(), game, winner: winner.trim(), players: players.map(n => n.trim()) },
    ...blob.recent,
  ].slice(0, RECENT_CAP);
  save(STORAGE_KEY, blob);
}

export function clearStats(): void {
  clear(STORAGE_KEY);
}

// Helpers for the Stats page.
export function leaderboardFor(game: GameKey): PlayerStat[] {
  const blob = readBlob();
  const rows = Object.values(blob.byGame[game].players);
  // Sort by wins desc, then win-rate desc, then games desc, then name.
  return rows.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const ar = a.games > 0 ? a.wins / a.games : 0;
    const br = b.games > 0 ? b.wins / b.games : 0;
    if (br !== ar) return br - ar;
    if (b.games !== a.games) return b.games - a.games;
    return a.name.localeCompare(b.name);
  });
}

export function recentFor(game: GameKey): RecentGame[] {
  return readBlob().recent.filter(r => r.game === game);
}
