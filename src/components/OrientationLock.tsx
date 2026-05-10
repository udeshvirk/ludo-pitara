import { useEffect } from 'react';

// Emulates iOS-style "rotation lock ON" in browser tabs on touch
// devices: rendered content stays glued to the device's natural frame
// regardless of how the user tilts. Tilting an iPhone 90° in browser
// won't reflow Ludo Pitara into landscape — the user just sees the
// portrait pixels at a sideways angle until they tilt back.
//
// Rotation sign — easy to get wrong, slow to debug
// ------------------------------------------------
// `screen.orientation.angle` is the CLOCKWISE rotation of the screen
// from its natural orientation. When the device tilts CW 90° (angle
// 90), the browser, with rotation-lock OFF at the OS level, auto-
// rotates content the OPPOSITE way (CCW) so content top stays at
// gravity-up. To "lock" content back to the device's natural frame,
// we apply CSS `rotate(${angle}deg)` — i.e. the SAME direction as the
// device tilted, undoing the browser's compensation. (An earlier
// attempt used `-angle` and shipped content flipped 180° from the
// natural frame in landscape — the "completely messed up landscape"
// bug.)
//
// Lock condition: `(pointer: coarse)` (touch primary) AND a landscape
// viewport. Desktop/laptop browsers stay untouched; portrait stays
// untouched (no tilt to compensate for).
const OrientationLock: React.FC = () => {
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const ori = window.screen?.orientation;
      const angle = (ori?.angle ?? 0) % 360;
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const landscape = window.innerWidth > window.innerHeight;
      const lock = coarse && landscape;
      root.classList.toggle('lock-to-portrait', lock);
      // SAME direction as the device's tilt — see the file header.
      root.style.setProperty('--device-angle', `${angle}deg`);
    };
    apply();
    const ori = window.screen?.orientation;
    ori?.addEventListener('change', apply);
    window.addEventListener('resize', apply);
    return () => {
      ori?.removeEventListener('change', apply);
      window.removeEventListener('resize', apply);
      root.classList.remove('lock-to-portrait');
      root.style.removeProperty('--device-angle');
    };
  }, []);
  return null;
};

export default OrientationLock;
