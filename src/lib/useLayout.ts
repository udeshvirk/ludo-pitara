import { useEffect, useState } from 'react';

export type LayoutMode = 'phone' | 'tablet' | 'wide';

// Touch-primary devices are hard-locked to portrait — the manifest
// declares it and OrientationLock calls `screen.orientation.lock` to
// enforce it on installed PWAs. So `useLayout` reads the orientation-
// stable dimensions (`min(w,h)` / `max(w,h)`) instead of `innerWidth`
// / `innerHeight`. That way phone-vs-tablet decisions don't change if
// some browser tab rotates anyway — same numbers in either physical
// orientation, no reflow.
//
// `wide` (board + side rails) only triggers on `pointer: fine` devices
// (mouse / trackpad). Touch devices never get the wide layout, so a
// 1024-wide iPad held landscape stays in `tablet`, identical to its
// portrait rendering.
function isFinePointer(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(pointer: fine)').matches;
}

function isCoarsePointer(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches;
}

function detect(): LayoutMode {
  if (typeof window === 'undefined') return 'phone';
  const rawW = window.innerWidth;
  const rawH = window.innerHeight;
  const coarse = isCoarsePointer();
  // On touch, layout decisions ALWAYS use the portrait-shaped logical
  // dimensions (short = width, long = height) so a rotated viewport
  // can't trigger a tablet→wide or phone→tablet flip.
  const w = coarse ? Math.min(rawW, rawH) : rawW;
  const h = coarse ? Math.max(rawW, rawH) : rawH;
  if (w >= 900 && w > h && isFinePointer()) return 'wide';
  if (w >= 600) return 'tablet';
  return 'phone';
}

export function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>(detect);

  useEffect(() => {
    const onChange = () => setMode(detect());
    window.addEventListener('resize', onChange);
    window.addEventListener('orientationchange', onChange);
    const finePtr = window.matchMedia('(pointer: fine)');
    finePtr.addEventListener('change', onChange);
    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('orientationchange', onChange);
      finePtr.removeEventListener('change', onChange);
    };
  }, []);

  return mode;
}
