import React from 'react';

// Section heading (uppercase, dim, letter-spaced) plus a stacked
// children container. Matches the heading style used on the Settings
// and Stats pages.
interface SectionProps {
  title: string;
  // Optional trailing element shown on the heading row (e.g. counts).
  trailing?: React.ReactNode;
  // Vertical gap between children (px).
  gap?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

const Section: React.FC<SectionProps> = ({ title, trailing, gap = 10, children, style }) => (
  <div style={style}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingLeft: 6,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: 'var(--ink-dim)',
        }}
      >
        {title}
      </span>
      {trailing}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {children}
    </div>
  </div>
);

export default Section;
