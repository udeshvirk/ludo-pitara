import React, { useEffect, useState } from 'react';

// Browser fallback for the manifest's portrait orientation lock.
// The PWA manifest only constrains installed apps — when Ludo Pitara
// is opened in a phone or tablet's browser, nothing stops the device
// from rotating into landscape, and the layouts are designed for
// portrait-on-touch + wide-on-desktop with no middle ground.
//
// Match condition: `(pointer: coarse) and (orientation: landscape)`.
// `pointer: coarse` lights up on touch primary devices (phones,
// tablets) but stays false on laptops/desktops with mice/trackpads —
// even on a Surface, where the primary pointer is fine. So a desktop
// user resizing their browser to a landscape window still gets the
// wide layout; only actual touch devices in landscape see the prompt.
const QUERY = '(pointer: coarse) and (orientation: landscape)';

const OrientationLock: React.FC = () => {
  const [locked, setLocked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setLocked(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (!locked) return null;

  return (
    <div
      role="alertdialog"
      aria-label="Please rotate your device to portrait"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'radial-gradient(ellipse at 50% 0%, var(--bg-panel-hi) 0%, var(--bg-panel) 38%, var(--bg-deep) 80%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        textAlign: 'center',
        color: 'var(--ink)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <RotateGlyph />
      <div
        style={{
          marginTop: 22,
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: 26,
          lineHeight: 1.15,
        }}
      >
        Rotate to portrait
      </div>
      <div
        style={{
          marginTop: 10,
          maxWidth: 320,
          fontSize: 14,
          color: 'var(--ink-dim)',
          lineHeight: 1.45,
        }}
      >
        Ludo Pitara plays best in portrait on phones and tablets.
      </div>
    </div>
  );
};

const RotateGlyph: React.FC = () => (
  <svg
    width="84"
    height="84"
    viewBox="0 0 84 84"
    fill="none"
    aria-hidden
    style={{
      filter: 'drop-shadow(0 4px 12px rgba(245, 184, 0, 0.35))',
    }}
  >
    {/* Phone body, mid-rotation: tilted ~30° to imply movement. */}
    <g transform="rotate(-30 42 42)">
      <rect
        x="22"
        y="14"
        width="40"
        height="56"
        rx="8"
        fill="rgba(255,255,255,0.06)"
        stroke="var(--gold)"
        strokeWidth="2"
      />
      <rect x="29" y="22" width="26" height="40" rx="2" fill="rgba(245, 184, 0, 0.18)" />
      <circle cx="42" cy="66" r="2.2" fill="var(--gold)" />
    </g>
    {/* Curved arrow showing the rotation direction. */}
    <path
      d="M 18 50 A 26 26 0 0 1 66 38"
      stroke="var(--saffron)"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M 64 32 L 67 38 L 60 39 Z" fill="var(--saffron)" />
  </svg>
);

export default OrientationLock;
