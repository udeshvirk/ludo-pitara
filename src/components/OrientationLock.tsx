import { useEffect } from 'react';

// Browser fallback for the manifest's portrait orientation lock.
// The PWA manifest only constrains installed apps — when Ludo Pitara
// is opened in a phone or tablet's browser, nothing stops the device
// from rotating into landscape.
//
// Behaviour: rotate the rendered app 90° via CSS so the user sees a
// portrait layout regardless of the device's physical orientation —
// effectively a soft "rotation lock" the user can't toggle off. We
// just toggle the `force-portrait` class on <html>; all the actual
// rotation, dimension swapping, and viewport-var aliasing happens in
// `index.css` so the layout's `100vw / 100vh` math still resolves
// against the *visible* dimensions.
//
// Match condition: `(pointer: coarse) and (orientation: landscape)`.
// `pointer: coarse` lights up only on touch-primary devices (phones,
// tablets), so a desktop user resizing the browser to a landscape
// window still gets the wide layout. Even Surface devices (touch +
// trackpad) report `pointer: fine` for the primary, so they're left
// alone too.
const QUERY = '(pointer: coarse) and (orientation: landscape)';

const OrientationLock: React.FC = () => {
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const apply = () => {
      document.documentElement.classList.toggle('force-portrait', mq.matches);
    };
    apply();
    mq.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
      document.documentElement.classList.remove('force-portrait');
    };
  }, []);
  return null;
};

export default OrientationLock;
