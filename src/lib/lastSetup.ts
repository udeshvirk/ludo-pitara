// Persist the most-recent player-setup choices (count, names, colors,
// human/CPU per slot, game options) so the user doesn't have to
// re-enter the same players every session. On the next visit, the
// setup screen pre-fills from this snapshot.

import { load, save } from './persist';
import type { GameOptions } from '../games/flow/store';
import { DEFAULT_OPTIONS } from '../games/flow/store';

const KEY = 'lastSetup';

type LudoColor = 'red' | 'green' | 'yellow' | 'blue';

export interface LastSetup {
  count: number;
  names: string[];
  colors: LudoColor[];
  isCPU: boolean[];
  // Optional so a setup saved by an older build still loads cleanly.
  options?: GameOptions;
}

export function getLastSetup(): LastSetup | null {
  const raw = load<LastSetup | null>(KEY, null);
  if (!raw) return null;
  // Light validation — anything missing/short, treat as no setup.
  if (
    typeof raw.count !== 'number' ||
    !Array.isArray(raw.names) ||
    !Array.isArray(raw.colors) ||
    !Array.isArray(raw.isCPU) ||
    raw.count < 2 ||
    raw.count > 4
  ) {
    return null;
  }
  return raw;
}

export function saveLastSetup(setup: LastSetup): void {
  save(KEY, setup);
}

export function loadOptionsOrDefault(): GameOptions {
  const last = getLastSetup();
  if (!last?.options) return DEFAULT_OPTIONS;
  // Fill in any missing fields from defaults — protects against
  // forward-compatible reads when new options get added later.
  return {
    ludo: { ...DEFAULT_OPTIONS.ludo, ...last.options.ludo },
    snl: { ...DEFAULT_OPTIONS.snl, ...last.options.snl },
  };
}
