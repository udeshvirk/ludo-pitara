import { useEffect } from 'react';

// Hard portrait lock for installed PWAs.
//
// The PWA manifest already declares `orientation: 'portrait'`, which is
// enough for some browsers/OSes (Android Chrome, most desktops). iOS
// Safari home-screen apps historically don't respect manifest
// orientation, so we ALSO call `screen.orientation.lock('portrait')`
// from JS. On installed apps that recognise the API the OS prevents
// the viewport from rotating in the first place — no JS-side
// counter-rotation, no CSS transforms, just a real lock.
//
// In a regular browser tab the lock() promise rejects (and we swallow
// the error). The board sizing is `vmin` / `vmax`-based so it produces
// identical results regardless of which way the viewport is oriented,
// so even if a tab DOES rotate the layout doesn't reflow.
const OrientationLock: React.FC = () => {
  useEffect(() => {
    const ori = (window.screen as Screen & { orientation?: ScreenOrientation }).orientation;
    if (ori && typeof (ori as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock === 'function') {
      (ori as ScreenOrientation & { lock: (o: string) => Promise<void> })
        .lock('portrait')
        .catch(() => {
          /* No-op: browser tabs reject; manifest covers the PWA case. */
        });
    }
  }, []);
  return null;
};

export default OrientationLock;
