import React, { useId } from 'react';

interface CoinProps {
  color: string; // base hex (e.g. '#e53935')
  size?: number | string; // CSS size for width/height (default 100%)
  active?: boolean; // selectable / highlighted with a pulsing ring
}

// Lightens (amount > 0) or darkens (amount < 0) a hex colour by linearly
// blending the channels toward white or black. Cheap and good enough for
// gradient stops on small SVG coins.
function shade(hex: string, amount: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const adjust = (c: number) => Math.max(0, Math.min(255, Math.round(c + 255 * amount)));
  return '#' + [adjust(r), adjust(g), adjust(b)]
    .map(c => c.toString(16).padStart(2, '0'))
    .join('');
}

// Shared metallic coin used as the player token in both Ludo and Snakes
// & Ladders. Renders a self-contained SVG with rim, face, medallion, and
// a top specular highlight. The caller positions/sizes the coin and
// decides whether multiple coins offset each other on a shared cell.
const Coin: React.FC<CoinProps> = ({ color, size = '100%', active = false }) => {
  const reactId = useId();
  const id = reactId.replace(/:/g, '');
  const light = shade(color, 0.32);
  const rim = shade(color, -0.32);

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      {active && (
        <span
          aria-hidden
          className="animate-pulse-ring"
          style={{
            position: 'absolute',
            inset: -6,
            borderRadius: '50%',
            border: '2px solid var(--gold)',
            pointerEvents: 'none',
          }}
        />
      )}
      <svg viewBox="0 0 32 32" width="100%" height="100%" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}>
        <defs>
          <radialGradient id={`rim-${id}`} cx="50%" cy="32%" r="80%">
            <stop offset="0%" stopColor={light} />
            <stop offset="55%" stopColor={color} />
            <stop offset="100%" stopColor={rim} />
          </radialGradient>
          <radialGradient id={`face-${id}`} cx="35%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="35%" stopColor={light} />
            <stop offset="100%" stopColor={color} />
          </radialGradient>
        </defs>
        <ellipse cx="16" cy="29" rx="12" ry="2.2" fill="rgba(0,0,0,0.45)" />
        <circle cx="16" cy="16" r="14" fill={`url(#rim-${id})`} stroke={rim} strokeWidth="0.4" />
        <circle cx="16" cy="16" r="11" fill={`url(#face-${id})`} stroke={rim} strokeWidth="0.5" strokeOpacity="0.5" />
        <circle cx="16" cy="16" r="5.2" fill="rgba(255,255,255,0.18)" stroke={rim} strokeWidth="0.4" strokeOpacity="0.55" />
        <circle cx="16" cy="16" r="2.2" fill={rim} fillOpacity="0.45" />
        <ellipse cx="14" cy="6.2" rx="4.5" ry="1.6" fill="rgba(255,255,255,0.5)" />
      </svg>
    </div>
  );
};

export default Coin;
