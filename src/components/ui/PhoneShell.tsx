import React from 'react';
import Mandala from './Mandala';

interface PhoneShellProps {
  children: React.ReactNode;
  decorative?: boolean;
  className?: string;
  // (legacy) kept for backward compat — no-op now since the phone-frame
  // already fills above 480px.
  fluid?: boolean;
  // If set, the children are wrapped in a centered max-width container.
  // Menu screens use this so cards / forms stay phone-sized on iPad
  // while the festive bg fills the whole screen.
  contentMaxWidth?: number;
}

const PhoneShell: React.FC<PhoneShellProps> = ({
  children,
  decorative = true,
  className,
  contentMaxWidth,
}) => {
  // `<main>` makes every screen a real landmark — assistive tech can
  // jump directly to game / page content past the festive chrome.
  const inner = (
    <main
      style={{
        position: 'relative',
        zIndex: 1,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        ...(contentMaxWidth
          ? { width: '100%', maxWidth: contentMaxWidth, margin: '0 auto' }
          : {}),
      }}
    >
      {children}
    </main>
  );

  return (
    <div
      className={`phone-frame ${className || ''}`}
      style={{
        background: 'var(--world-background)',
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
      <div className="ambient-magic" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => <i key={i} style={{
          left: `${8 + ((i * 37) % 86)}%`, top: `${5 + ((i * 23) % 90)}%`,
          animationDelay: `${-i * 1.7}s`, animationDuration: `${7 + i % 4}s`,
        }} />)}
      </div>
      <div className="storybook-cloud cloud-one" aria-hidden="true" /><div className="storybook-cloud cloud-two" aria-hidden="true" />
      {inner}
    </div>
  );
};

export default PhoneShell;
