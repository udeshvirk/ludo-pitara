import React from 'react';

// Soft-translucent panel used throughout the app for grouped content
// (player rows, option tiles, continue chips, etc.). Picks up its colour
// from CSS tokens — keep visuals coherent without 5+ lines of inline
// style at every call site.

type Tone = 'default' | 'highlight' | 'danger';
type Padding = 'sm' | 'md' | 'lg' | 'none';

interface CardProps {
  tone?: Tone;
  padding?: Padding;
  radius?: number;
  // When true the card renders thicker borders + a saffron tint — used
  // when the contained option is "active" / opted-in.
  active?: boolean;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

const TONE: Record<Tone, { bg: string; border: string }> = {
  default:   { bg: 'rgba(255,255,255,0.06)',     border: 'rgba(255,255,255,0.10)' },
  highlight: { bg: 'rgba(255, 138, 61, 0.08)',   border: 'rgba(255, 138, 61, 0.35)' },
  danger:    { bg: 'rgba(229, 57, 53, 0.10)',    border: 'rgba(229, 57, 53, 0.35)' },
};

const PAD: Record<Padding, string | number> = {
  none: 0, sm: 8, md: 12, lg: 18,
};

const Card: React.FC<CardProps> = ({
  tone = 'default',
  padding = 'md',
  radius = 14,
  active = false,
  children,
  style,
  className,
}) => {
  const palette = active ? TONE.highlight : TONE[tone];
  return (
    <div
      className={className}
      style={{
        padding: PAD[padding],
        borderRadius: radius,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default Card;
