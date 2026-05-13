import React from 'react';

// Saffron iOS-style switch. Previously duplicated as inline definitions
// inside PlayerSetup and Settings — extracted so the look stays
// consistent and a future visual tweak lives in one place.
interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  // Visual size — keep `md` everywhere unless space is genuinely tight.
  size?: 'sm' | 'md';
  ariaLabel?: string;
}

const SIZE = {
  sm: { w: 36, h: 22, knob: 16, pad: 2, knobLeft: 14 },
  md: { w: 48, h: 28, knob: 22, pad: 3, knobLeft: 20 },
} as const;

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, size = 'md', ariaLabel }) => {
  const s = SIZE[size];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={(e) => { e.preventDefault(); onChange(!checked); }}
      style={{
        flexShrink: 0,
        width: s.w,
        height: s.h,
        borderRadius: 999,
        padding: s.pad,
        background: checked ? 'var(--saffron)' : 'rgba(255,255,255,0.16)',
        border: '1px solid ' + (checked ? 'var(--saffron)' : 'rgba(255,255,255,0.18)'),
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 160ms ease, border-color 160ms ease',
      }}
    >
      <span
        style={{
          display: 'block',
          width: s.knob,
          height: s.knob,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          transform: checked ? `translateX(${s.knobLeft}px)` : 'translateX(0)',
          transition: 'transform 160ms ease',
        }}
      />
    </button>
  );
};

export default Toggle;
