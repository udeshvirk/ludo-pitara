import React from 'react';

// 40×40 rounded chrome button used for header actions (Stats, Settings,
// SoundToggle). Previously duplicated as inline JSX with the same 6
// CSS props.
interface IconButtonProps {
  onClick?: () => void;
  ariaLabel: string;
  size?: number;
  children?: React.ReactNode;
}

const IconButton: React.FC<IconButtonProps> = ({ onClick, ariaLabel, size = 40, children }) => (
  <button
    aria-label={ariaLabel}
    onClick={onClick}
    style={{
      width: size,
      height: size,
      borderRadius: 14,
      background: 'rgba(255,255,255,0.08)',
      border: '1px solid rgba(255,255,255,0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--ink)',
      cursor: 'pointer',
    }}
  >
    {children}
  </button>
);

export default IconButton;
