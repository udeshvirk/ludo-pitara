import React from 'react';

interface AvatarProps {
  color?: string;
  label?: string;
  size?: number;
  ring?: boolean;
  active?: boolean;
  isBot?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

// Mini robot-head glyph used in place of the name initial when a slot is
// driven by the CPU. Solid white silhouette so it reads on the colored
// disc the same way the white initial would.
const RobotIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <g fill="#fff">
      <circle cx="12" cy="3.4" r="1" />
      <rect x="11.4" y="4.1" width="1.2" height="2.4" rx="0.6" />
      <rect x="5" y="6.6" width="14" height="11" rx="3.2" />
      <rect x="3.4" y="10" width="1.6" height="4" rx="0.8" />
      <rect x="19" y="10" width="1.6" height="4" rx="0.8" />
    </g>
    <g fill="rgba(0,0,0,0.55)">
      <circle cx="9.2" cy="11.8" r="1.35" />
      <circle cx="14.8" cy="11.8" r="1.35" />
      <rect x="9.4" y="14.5" width="5.2" height="1.4" rx="0.7" />
    </g>
  </svg>
);

const Avatar: React.FC<AvatarProps> = ({
  color = 'var(--p-red)',
  label = 'A',
  size = 56,
  ring = true,
  active = false,
  isBot = false,
  style,
  className,
}) => {
  const padding = ring ? 3 : 0;
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        padding,
        background: ring
          ? `conic-gradient(from 0deg, var(--gold), var(--gold-hi), var(--gold), var(--gold-deep), var(--gold))`
          : 'transparent',
        boxShadow: active
          ? '0 0 0 2px var(--gold-hi), 0 0 18px rgba(245, 184, 0, 0.55)'
          : 'none',
        flexShrink: 0,
        ...style,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `linear-gradient(140deg, ${color}, ${color}cc)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontFamily: 'var(--font-ui)',
          fontWeight: 700,
          fontSize: size * 0.42,
          border: '2px solid rgba(0, 0, 0, 0.15)',
          boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.3), inset 0 -3px 6px rgba(0, 0, 0, 0.2)',
        }}
      >
        {isBot ? <RobotIcon size={size * 0.66} /> : (label[0] || '?').toUpperCase()}
      </div>
    </div>
  );
};

export default Avatar;
