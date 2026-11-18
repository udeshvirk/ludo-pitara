import { useEffect, useState } from 'react';

export type LayoutMode = 'phone' | 'tablet' | 'wide';

function detect(): LayoutMode {
  if (typeof window === 'undefined') return 'phone';
  const w = window.innerWidth;
  const h = window.innerHeight;
  // Wide layout = landscape AND big enough for side panels next to a board.
  // Landscape phones also need side rails: stacked controls leave a
  // tiny board on short screens. At 640px there is room for both rails.
  if (w >= 640 && w > h) return 'wide';
  if (w >= 600) return 'tablet';
  return 'phone';
}

// Tracks viewport size so in-game layouts can switch between stacked
// (portrait) and side-by-side (wide landscape) arrangements.
export function useLayoutMode(): LayoutMode {
  const [mode, setMode] = useState<LayoutMode>(detect);

  useEffect(() => {
    const onResize = () => setMode(detect());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  return mode;
}
