import React from 'react';

// Small pill — either a static badge or a tappable button. Used for
// the "Use saved name" chips in PlayerSetup, the Continue strip on
// GameSelect, and any small filter / toggle pill.

type Tone = 'default' | 'saffron' | 'danger';

interface ChipProps {
  tone?: Tone;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  // Use this instead of onClick when the chip lives next to a text
  // input — mousedown fires BEFORE the input's blur, so we can
  // preventDefault to keep focus (and the mobile keyboard) put.
  onMouseDown?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  // For unbutton'd labels.
  as?: 'button' | 'span';
  ariaLabel?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const TONE: Record<Tone, { bg: string; border: string; color: string }> = {
  default: { bg: 'transparent',                color: 'var(--ink-dim)', border: 'rgba(255,255,255,0.20)' },
  saffron: { bg: 'rgba(255, 138, 61, 0.10)',   color: 'var(--saffron)', border: 'rgba(255, 138, 61, 0.35)' },
  danger:  { bg: 'rgba(229, 57, 53, 0.10)',    color: 'var(--rose)',    border: 'rgba(229, 57, 53, 0.35)' },
};

const Chip: React.FC<ChipProps> = ({
  tone = 'default', onClick, onMouseDown, as = 'button', ariaLabel, children, style,
}) => {
  const t = TONE[tone];
  const base: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 999,
    background: t.bg,
    border: `1px solid ${t.border}`,
    color: t.color,
    fontFamily: 'var(--font-ui)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.4,
    cursor: (onClick || onMouseDown) ? 'pointer' : 'default',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    ...style,
  };
  if (as === 'span') return <span style={base}>{children}</span>;
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={onMouseDown}
      aria-label={ariaLabel}
      style={base}
    >
      {children}
    </button>
  );
};

export default Chip;
