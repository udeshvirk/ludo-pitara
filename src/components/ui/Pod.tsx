import React from 'react';
import { motion } from 'framer-motion';
import Avatar from './Avatar';
import Die from './Die';

interface PodProps {
  color: string;       // base hex (avatar fill + active border/glow)
  label: string;       // avatar single-char label
  isActive: boolean;   // highlight + dice ring
  isRolling: boolean;  // dice tumble animation
  diceValue: number | null;
  // The face this player last rolled. Shown when the pod isn't active
  // (or before this player's first-ever roll, when null falls back to
  // 1) so each die "stays put" like a real tabletop die.
  lastRoll?: number | null;
  onRoll?: () => void; // dice tap handler when canRoll
  canRoll: boolean;    // whether the dice should be tappable
  compact?: boolean;   // smaller variant for side rails
  isBot?: boolean;     // CPU slots show a robot glyph instead of the initial
  // Which side of the card the turn-arrow sits on. The chevron always
  // points back at the card, so this also flips its direction. Cards
  // pinned to the right edge of the screen want their arrow on the
  // left so it sits between the card and the board.
  arrowSide?: 'left' | 'right';
}

const SIZES = {
  full:    { avatar: 36, die: 40, gap: 8, padding: '6px 9px', radius: 14, arrow: 16 },
  compact: { avatar: 28, die: 30, gap: 6, padding: '5px 7px', radius: 12, arrow: 13 },
} as const;

// Stylised chevron used as the "your turn" indicator. Lives outside the
// pod's card box and bounces softly toward the die. Custom SVG (not the
// unicode triangle) so we control the stroke weight, gradient, and
// drop-shadow precisely. Uses gold so it reads as a deliberate cue,
// not chrome.
// `side` is which side of the card the arrow lives on; the chevron
// always points back at the card, and the bounce moves toward it.
const TurnArrow: React.FC<{ size: number; side: 'left' | 'right' }> = ({ size, side }) => {
  const pointsLeft = side === 'right'; // arrow on the right of the card → chevron points left, bounces left
  const bounce = pointsLeft ? -4 : 4;
  return (
    <motion.span
      aria-hidden
      initial={{ opacity: 0, x: -bounce }}
      animate={{ opacity: 1, x: [0, bounce, 0] }}
      transition={{
        opacity: { duration: 0.2 },
        x: { duration: 0.75, repeat: Infinity, ease: 'easeInOut' },
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
        pointerEvents: 'none',
        flexShrink: 0,
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.45))',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        style={{ transform: pointsLeft ? undefined : 'scaleX(-1)' }}
      >
        <defs>
          <linearGradient id="turnArrowGrad" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="var(--gold-hi)" />
            <stop offset="100%" stopColor="var(--gold-deep)" />
          </linearGradient>
        </defs>
        <path
          d="M11 2.5 L4 8 L11 13.5"
          stroke="url(#turnArrowGrad)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </motion.span>
  );
};

// Avatar + die in a card with active-state border/glow. The turn-arrow
// is rendered as a sibling of the card so the bordered box stays clean
// and the arrow visibly floats *next to* the pod.
const Pod: React.FC<PodProps> = ({
  color,
  label,
  isActive,
  isRolling,
  diceValue,
  lastRoll = null,
  onRoll,
  canRoll,
  compact = false,
  isBot = false,
  arrowSide = 'right',
}) => {
  const s = compact ? SIZES.compact : SIZES.full;
  const card = (
    <motion.div
      animate={{ scale: isActive ? 1.04 : 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        padding: s.padding,
        borderRadius: s.radius,
        background: isActive
          ? `linear-gradient(135deg, ${color}26, transparent 70%)`
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.10)'}`,
        boxShadow: isActive ? `0 0 16px ${color}66` : 'none',
        flexShrink: 0,
      }}
    >
      <Avatar color={color} label={label} size={s.avatar} ring active={isActive} isBot={isBot} />
      <Die
        value={isActive && diceValue ? diceValue : (lastRoll ?? 1)}
        size={s.die}
        active={isActive}
        rolling={isActive && isRolling}
        onClick={isActive && canRoll ? onRoll : undefined}
        disabled={!isActive || !canRoll}
      />
    </motion.div>
  );
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {isActive && arrowSide === 'left' && <TurnArrow size={s.arrow} side="left" />}
      {card}
      {isActive && arrowSide === 'right' && <TurnArrow size={s.arrow} side="right" />}
    </span>
  );
};

export default Pod;
