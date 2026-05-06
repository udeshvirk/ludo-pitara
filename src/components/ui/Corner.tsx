import React from 'react';

interface CornerProps {
  size?: number;
  color?: string;
  flip?: 'tl' | 'tr' | 'bl' | 'br';
  style?: React.CSSProperties;
  className?: string;
}

const TRANSFORMS: Record<NonNullable<CornerProps['flip']>, string> = {
  tl: 'none',
  tr: 'scaleX(-1)',
  bl: 'scaleY(-1)',
  br: 'scale(-1, -1)',
};

const Corner: React.FC<CornerProps> = ({
  size = 60,
  color = 'var(--gold)',
  flip = 'tl',
  style,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 60 60"
    className={className}
    style={{ transform: TRANSFORMS[flip], ...style }}
    aria-hidden="true"
  >
    <path d="M2 2 L24 2 M2 2 L2 24" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M6 6 Q14 6 14 14 Q14 6 22 6" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" />
    <circle cx="14" cy="14" r="2" fill={color} />
    <circle cx="2" cy="2" r="1.6" fill={color} />
  </svg>
);

export default Corner;
