import React from 'react';

interface AvatarProps {
  color?: string;
  label?: string;
  size?: number;
  ring?: boolean;
  active?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  color = 'var(--p-red)',
  label = 'A',
  size = 56,
  ring = true,
  active = false,
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
        {(label[0] || '?').toUpperCase()}
      </div>
    </div>
  );
};

export default Avatar;
