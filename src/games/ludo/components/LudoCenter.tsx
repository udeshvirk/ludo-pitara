import React from 'react';
import { PLAYER_COLORS } from '../constants';
import type { PlayerColor } from '../types';
import LudoToken from './Token';
import StackCountBadge from '../../../components/ui/StackCountBadge';

// Centre 3×3 — four coloured wedges with edge-to-centre gradients, the
// gold medallion in the middle, and any tokens that have reached home
// (placed at their wedge centroid).

interface LudoCenterProps {
  // Seat → user-picked visual colour. Wedges use this to fill with the
  // seated player's chosen colour rather than the seat's namesake.
  seatToDisplay: Record<PlayerColor, PlayerColor>;
  // Home tokens grouped by seat colour.
  homeTokens: Record<PlayerColor, string[]>;
}

const WEDGE_CENTROIDS: Record<PlayerColor, { left: string; top: string }> = {
  red:    { left: '17%', top: '50%' },
  green:  { left: '50%', top: '17%' },
  yellow: { left: '83%', top: '50%' },
  blue:   { left: '50%', top: '83%' },
};

const WEDGE_POLYGONS: Record<PlayerColor, string> = {
  green:  '50,50 0,0 100,0',
  yellow: '50,50 100,0 100,100',
  blue:   '50,50 100,100 0,100',
  red:    '50,50 0,100 0,0',
};

const LudoCenter: React.FC<LudoCenterProps> = ({ seatToDisplay, homeTokens }) => (
  <div style={{
    gridRow: '7 / span 3',
    gridColumn: '7 / span 3',
    position: 'relative',
    background: 'var(--bg-board-cream)',
    border: '1.5px solid rgba(120, 80, 20, 0.4)',
  }}>
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
      <defs>
        {(['red', 'green', 'yellow', 'blue'] as PlayerColor[]).map(c => {
          const visual = seatToDisplay[c];
          return (
            <radialGradient key={c} id={`wedge-${c}`} cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor={PLAYER_COLORS[visual].bgLight} />
              <stop offset="100%" stopColor={PLAYER_COLORS[visual].bg} />
            </radialGradient>
          );
        })}
        <radialGradient id="centerDisc" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff5c2" />
          <stop offset="55%" stopColor="var(--gold-hi)" />
          <stop offset="100%" stopColor="var(--gold-deep)" />
        </radialGradient>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255, 217, 102, 0.7)" />
          <stop offset="100%" stopColor="rgba(255, 217, 102, 0)" />
        </radialGradient>
      </defs>
      <polygon points={WEDGE_POLYGONS.green}  fill="url(#wedge-green)" />
      <polygon points={WEDGE_POLYGONS.yellow} fill="url(#wedge-yellow)" />
      <polygon points={WEDGE_POLYGONS.blue}   fill="url(#wedge-blue)" />
      <polygon points={WEDGE_POLYGONS.red}    fill="url(#wedge-red)" />
      {/* Wedge separators (X across the centre) */}
      <line x1="0"   y1="0"   x2="100" y2="100" stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />
      <line x1="100" y1="0"   x2="0"   y2="100" stroke="rgba(0,0,0,0.18)" strokeWidth="0.6" />
      {/* Outer glow ring around the medallion */}
      <circle cx="50" cy="50" r="22" fill="url(#centerGlow)" />
      {/* Medallion */}
      <circle cx="50" cy="50" r="16" fill="url(#centerDisc)" stroke="var(--gold-deep)" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="13" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
      <text x="50" y="58.5" textAnchor="middle" fontSize="22" fontWeight="700" fill="#3a1f00" fontFamily="var(--font-display)">★</text>
    </svg>

    {(['red', 'green', 'yellow', 'blue'] as PlayerColor[]).map(color => {
      const ids = homeTokens[color];
      if (ids.length === 0) return null;
      const pos = WEDGE_CENTROIDS[color];
      return (
        <div
          key={color}
          style={{
            position: 'absolute',
            left: pos.left,
            top: pos.top,
            transform: 'translate(-50%, -50%)',
            width: '34%',
            height: '34%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {ids.map((tokenId, ti) => (
            <LudoToken
              key={tokenId}
              tokenId={tokenId}
              color={seatToDisplay[color]}
              isSelectable={false}
              stackIndex={ti}
              stackSize={ids.length}
            />
          ))}
          {ids.length >= 2 && <StackCountBadge n={ids.length} />}
        </div>
      );
    })}
  </div>
);

export default LudoCenter;
