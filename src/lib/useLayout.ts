import { useEffect, useState } from 'react';

export type LayoutMode = 'phone' | 'tablet' | 'wide';

// Wide layout (board + side rails) is desktop-only territory: rails
// carry compact pods that look fine next to a mouse cursor but would
// otherwise restructure the screen mid-session if a phone or tablet
// user tilted the device into landscape. So `wide` is gated on
// `pointer: fine` — i.e. mouse / trackpad — and a touch device in
// landscape stays in `tablet` mode (same shape it had in portrait),
// so a tilt doesn't reflow the game.
function isFinePointer(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(pointer: fine)').matches;
}

function detect(): LayoutMode {
  if (typeof window === 'undefined') return 'phone';
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (w >= 900 && w > h && isFinePointer()) return 'wide';
  if (w >= 600) return 'tablet';
  return 'phone';
}

// Tracks viewport size so in-game layouts can switch between stacked
// (portrait) and side-by-side (wide landscape) arrangements.
export function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>(detect);

  useEffect(() => {
    const onChange = () => setMode(detect());
    window.addEventListener('resize', onChange);
    window.addEventListener('orientationchange', onChange);
    // Pointer-type can change on detachable keyboards / hybrids.
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
