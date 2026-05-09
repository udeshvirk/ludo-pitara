import { useEffect, useState } from 'react';

export type LayoutMode = 'phone' | 'tablet' | 'wide';

// Touch-device-in-landscape devices are force-rotated to portrait via
// CSS (see <OrientationLock>), so what's physically `100vw × 100vh`
// presents to the user as `100vh × 100vw`. The detect() math has to
// run on the VISIBLE dimensions, otherwise an iPad held landscape
// reports w >= 900 + w > h and triggers the wide layout despite the
// user seeing a portrait screen.
function isForcePortrait(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse) and (orientation: landscape)').matches;
}

function detect(): LayoutMode {
  if (typeof window === 'undefined') return 'phone';
  const rawW = window.innerWidth;
  const rawH = window.innerHeight;
  // Swap when the app is force-rotated — visible width is the device's
  // shorter side, visible height is the longer side.
  const w = isForcePortrait() ? rawH : rawW;
  const h = isForcePortrait() ? rawW : rawH;
  // Wide layout = landscape AND big enough for side panels next to a board.
  if (w >= 900 && w > h) return 'wide';
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
    // Force-portrait flips can fire without a resize event (the
    // viewport pixel count is unchanged when we rotate visually), so
    // also subscribe to the same media query OrientationLock listens
    // to and recompute on its change.
    const mq = window.matchMedia('(pointer: coarse) and (orientation: landscape)');
    mq.addEventListener('change', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      mq.removeEventListener('change', onResize);
    };
  }, []);

  return mode;
}
