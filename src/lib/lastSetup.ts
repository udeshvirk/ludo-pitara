// Persist the most-recent player-setup choices (count, names, colors,
// human/CPU per slot) so the user doesn't have to re-enter the same
// players every session. On the next visit, the setup screen pre-fills
// from this snapshot.

import { load, save } from './persist';

const KEY = 'lastSetup';

type LudoColor = 'red' | 'green' | 'yellow' | 'blue';

export interface LastSetup {
  count: number;
  names: string[];
  colors: LudoColor[];
  isCPU: boolean[];
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
