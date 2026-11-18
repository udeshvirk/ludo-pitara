import React, { useId } from 'react';

interface CoinProps {
  color: string; // base hex (e.g. '#e53935')
  size?: number | string; // CSS size for width/height (default 100%)
  active?: boolean; // selectable / highlighted with a pulsing ring
}

// `stackPlacement` moved to its own module so this file only exports
// the Coin component (react-refresh wants component-only files).

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

// Shared toy token used in both Ludo and Snakes & Ladders. Colour-family
// emblems (heart, leaf, star, diamond) give a second identity cue. The caller positions/sizes the coin and
// decides whether multiple coins offset each other on a shared cell.
const Coin: React.FC<CoinProps> = ({ color, size = '100%', active = false }) => {
  const reactId = useId();
  const id = reactId.replace(/:/g, '');
  const light = shade(color, 0.18);
  const rim = shade(color, -0.2);
  const rgb = parseInt(color.replace('#', ''), 16);
  const r = (rgb >> 16) & 255, g = (rgb >> 8) & 255, b = rgb & 255;
  const symbol = r > b && g > b && g > r * .6 ? 'star' : r > g && r > b ? 'heart' : g > r && g > b ? 'leaf' : 'diamond';
  const emblems = {
    star: 'M16 9 18 13 23 14 19.5 17.5 20 22 16 20 12 22 12.5 17.5 9 14 14 13Z',
    heart: 'M16 22C13 19 8 16 10 12C12 9 15 11 16 13C17 11 20 9 22 12C24 16 19 20 16 22Z',
    leaf: 'M10 22C7 11 17 9 23 10C23 19 17 24 10 22ZM11 21 19 13',
    diamond: 'M16 9 23 16 16 23 9 16Z',
  };

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
      <svg viewBox="0 0 32 32" width="100%" height="100%" style={{ filter: 'drop-shadow(0 2px 2px rgba(56,42,92,0.28))' }}>
        <defs>
          <radialGradient id={`rim-${id}`} cx="50%" cy="32%" r="80%">
            <stop offset="0%" stopColor={light} />
            <stop offset="55%" stopColor={color} />
            <stop offset="100%" stopColor={rim} />
          </radialGradient>
          <radialGradient id={`face-${id}`} cx="35%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="35%" stopColor={light} />
            <stop offset="100%" stopColor={color} />
          </radialGradient>
        </defs>
        <ellipse cx="16" cy="29" rx="12" ry="2.2" fill="rgba(58,43,91,0.16)" />
        <circle cx="16" cy="16" r="14" fill={`url(#rim-${id})`} stroke="#cab78d" strokeWidth="1.3" />
        <circle cx="16" cy="16" r="11" fill={`url(#face-${id})`} stroke={rim} strokeWidth="0.5" strokeOpacity="0.5" />
        <path d={emblems[symbol]} fill="#e7d6b0" stroke={rim} strokeWidth=".5" strokeLinejoin="round" />
        <ellipse cx="14" cy="6.2" rx="4.5" ry="1.6" fill="rgba(255,255,255,0.5)" />
      </svg>
    </div>
  );
};

export default Coin;
