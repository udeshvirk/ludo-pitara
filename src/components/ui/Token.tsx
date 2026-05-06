import React, { useId } from 'react';

interface TokenProps {
  color?: string;
  size?: number;
  glow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const Token: React.FC<TokenProps> = ({
  color = 'var(--p-red)',
  size = 26,
  glow = false,
  className,
  style,
}) => {
  const reactId = useId();
  const id = `tok-${reactId.replace(/:/g, '')}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="35%" stopColor={color} />
          <stop offset="100%" stopColor={color} />
        </radialGradient>
      </defs>
      {glow && <circle cx="16" cy="16" r="15" fill={color} opacity="0.45" />}
      <ellipse cx="16" cy="28" rx="11" ry="2" fill="rgba(0,0,0,0.35)" />
      <circle cx="16" cy="16" r="13" fill="rgba(0,0,0,0.25)" />
      <circle cx="16" cy="16" r="11.5" fill={`url(#${id})`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.6" />
      <circle cx="16" cy="16" r="7.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
      <ellipse cx="12" cy="11" rx="4" ry="2.5" fill="rgba(255,255,255,0.55)" />
    </svg>
  );
};

export default Token;
