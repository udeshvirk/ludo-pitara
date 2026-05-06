// Persist up to 5 of the player's most-recently-used custom names so they
// don't have to retype them. Skip the default "Player N" placeholders so
// the chips are actually useful.

import { load, save } from './persist';

const KEY = 'recentNames';
const MAX = 5;
const DEFAULT_RE = /^player\s*\d+$/i;

export function getRecentNames(): string[] {
  return load<string[]>(KEY, []);
}

export function rememberNames(names: string[]) {
  const cleaned = names
    .map(n => n.trim())
    .filter(n => n.length > 0 && !DEFAULT_RE.test(n));
  if (cleaned.length === 0) return;

  const existing = getRecentNames();
  const merged: string[] = [];
  // newest entries first
  for (const name of [...cleaned, ...existing]) {
    if (!merged.find(m => m.toLowerCase() === name.toLowerCase())) {
      merged.push(name);
    }
    if (merged.length >= MAX) break;
  }
  save(KEY, merged);
}

export function clearRecentNames() {
  save(KEY, []);
}
