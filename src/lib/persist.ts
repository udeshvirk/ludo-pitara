// Tiny localStorage wrapper — versioned keys so a future schema change
// can invalidate cleanly.

const PREFIX = 'ludopitara.v1.';

export function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // quota / private mode — nothing we can do
  }
}

export function clear(key: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
  // Cancel any pending debounced write for this key so a recent clear()
  // can't be overwritten by an in-flight save (e.g. resetGame() then a
  // trailing per-step snapshot for the now-stale game).
  const pending = pendingSaves.get(key);
  if (pending) {
    clearTimeout(pending.timer);
    pendingSaves.delete(key);
  }
}

// Debounced save: many rapid set()s (e.g. ~11 per Ludo walk, every 90 ms)
// collapse into one localStorage write at the trailing edge. The latest
// value wins. flushSaves() drains everything synchronously — wire it to
// pagehide/beforeunload so a navigation/close doesn't lose the last edit.
interface Pending<T> { timer: ReturnType<typeof setTimeout>; value: T }
const pendingSaves = new Map<string, Pending<unknown>>();

export function saveDebounced<T>(key: string, value: T, delayMs = 250) {
  if (typeof window === 'undefined') return;
  const existing = pendingSaves.get(key);
  if (existing) clearTimeout(existing.timer);
  const timer = setTimeout(() => {
    pendingSaves.delete(key);
    save(key, value);
  }, delayMs);
  pendingSaves.set(key, { timer, value });
}

export function flushSaves() {
  for (const [key, pending] of pendingSaves) {
    clearTimeout(pending.timer);
    save(key, pending.value);
  }
  pendingSaves.clear();
}

if (typeof window !== 'undefined') {
  // pagehide fires reliably on mobile (Safari iOS) where beforeunload
  // is unreliable — drain pending saves so we don't lose the last
  // turn's state on app dismiss.
  window.addEventListener('pagehide', flushSaves);
  window.addEventListener('beforeunload', flushSaves);
}
