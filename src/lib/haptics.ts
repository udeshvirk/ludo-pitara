// Thin wrapper around navigator.vibrate. Disabled by default so a settings
// toggle can flip it. Browsers without vibrate (iOS Safari) silently no-op.

let enabled = true;

export function setHapticsEnabled(v: boolean) {
  enabled = v;
}

function vibrate(pattern: number | number[]) {
  if (!enabled) return;
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  navigator.vibrate(pattern);
}

export const haptics = {
  tap: () => vibrate(8),
  diceRoll: () => vibrate([12, 30, 12, 30, 12]),
  capture: () => vibrate([20, 40, 30]),
  win: () => vibrate([30, 60, 30, 60, 60]),
};
