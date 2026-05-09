import React from 'react';

// Small numeric pill rendered in the top-right of a cell when ≥2 tokens
// share it. Even with diagonal stack-offsets, two same-colour tokens can
// look like one — the badge makes the count unambiguous.
const StackCountBadge: React.FC<{ n: number }> = ({ n }) => (
  <span
    aria-hidden
    style={{
      position: 'absolute',
      top: 1,
      right: 1,
      minWidth: 12,
      height: 12,
      padding: '0 3px',
      borderRadius: 6,
      background: 'rgba(0,0,0,0.78)',
      color: '#fff',
      fontSize: 8,
      fontWeight: 700,
      lineHeight: '12px',
      textAlign: 'center',
      boxShadow: '0 1px 2px rgba(0,0,0,0.4)',
      zIndex: 30,
      fontFamily: 'var(--font-ui)',
      pointerEvents: 'none',
    }}
  >
    {n}
  </span>
);

export default StackCountBadge;
