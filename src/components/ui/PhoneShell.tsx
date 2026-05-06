import React from 'react';
import Mandala from './Mandala';

interface PhoneShellProps {
  children: React.ReactNode;
  decorative?: boolean;
  className?: string;
}

// Full-bleed festive backdrop with subtle mandalas in corners. Children are
// laid out as the screen content above the ornaments.
const PhoneShell: React.FC<PhoneShellProps> = ({ children, decorative = true, className }) => (
  <div
    className={`phone-frame ${className || ''}`}
    style={{
      background: 'radial-gradient(ellipse at 50% 0%, var(--bg-panel-hi) 0%, var(--bg-panel) 38%, var(--bg-deep) 80%)',
      overflow: 'hidden',
      color: 'var(--ink)',
      fontFamily: 'var(--font-body)',
    }}
  >
    {decorative && (
      <>
        <div style={{ position: 'absolute', top: -60, left: -60, pointerEvents: 'none' }}>
          <Mandala size={260} opacity={0.12} />
        </div>
        <div style={{ position: 'absolute', bottom: -80, right: -80, pointerEvents: 'none' }}>
          <Mandala size={300} opacity={0.10} />
        </div>
      </>
    )}
    <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {children}
    </div>
  </div>
);

export default PhoneShell;
