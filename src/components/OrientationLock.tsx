import { useEffect } from 'react';

// Emulates iOS-style "rotation lock ON" in browser tabs on touch
// devices: the rendered content stays glued to the device's natural
// frame regardless of how the user tilts the device. (Tilting their
// iPhone 90° won't reflow Ludo Pitara into landscape — they'll just
// see the portrait layout from a sideways angle until they tilt back.)
//
// How this works
// --------------
// When the device tilts, the browser auto-rotates content by
// `screen.orientation.angle` so gravity-up = rendered top. We undo
// that rotation with `rotate(-angle deg)`, which puts content back at
// the device's natural top — exactly the behaviour the system would
// give if rotation lock were on.
//
// We toggle the `lock-to-portrait` class on <html> only when the
// device is BOTH (pointer: coarse) — touch primary, i.e. phones and
// tablets — and currently in a landscape-shaped viewport. Desktop
// browsers in landscape stay completely untouched.
//
// The CSS for the rotation, dimension flip, and the `--vw100 / --vh100`
// viewport-var swap all live in `index.css`; this file is just the
// listener that flips the toggle and feeds the angle in.
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
      // Inverse rotation — see the file header for the derivation.
      root.style.setProperty('--device-angle', `-${angle}deg`);
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
