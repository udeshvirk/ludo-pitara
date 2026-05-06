import React from 'react';

interface MandalaProps {
  size?: number;
  color?: string;
  opacity?: number;
  style?: React.CSSProperties;
  className?: string;
}

const Mandala: React.FC<MandalaProps> = ({
  size = 240,
  color = 'var(--gold)',
  opacity = 0.18,
  style,
  className,
}) => {
  const r = size / 2;
  const N = 16;
  const petals = Array.from({ length: N }, (_, i) => {
    const a = (i * 360) / N;
    return (
      <ellipse
        key={i}
        cx={r}
        cy={r * 0.32}
        rx={r * 0.07}
        ry={r * 0.22}
        transform={`rotate(${a} ${r} ${r})`}
        fill="none"
        stroke={color}
        strokeWidth="1.2"
      />
    );
  });
  const dots = Array.from({ length: 24 }, (_, i) => {
    const a = ((i * 360) / 24) * Math.PI / 180;
    return (
      <circle
        key={i}
        cx={r + Math.cos(a) * r * 0.78}
        cy={r + Math.sin(a) * r * 0.78}
        r="1.5"
        fill={color}
      />
    );
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ opacity, ...style }}
      aria-hidden="true"
    >
      <circle cx={r} cy={r} r={r * 0.92} fill="none" stroke={color} strokeWidth="1" />
      <circle cx={r} cy={r} r={r * 0.78} fill="none" stroke={color} strokeWidth="0.8" strokeDasharray="2 4" />
      <circle cx={r} cy={r} r={r * 0.55} fill="none" stroke={color} strokeWidth="1" />
      <circle cx={r} cy={r} r={r * 0.32} fill="none" stroke={color} strokeWidth="1" />
      {petals}
      {dots}
      <circle cx={r} cy={r} r="4" fill={color} />
    </svg>
  );
};

export default Mandala;
