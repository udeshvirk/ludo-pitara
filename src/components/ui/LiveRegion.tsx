import React from 'react';

// Screen-reader-only live region. Reflecting the game store's `message`
// here lets assistive tech announce dice rolls, captures, and turn
// transitions without changing the visible layout. Visually clipped to
// 1×1 px but kept in the accessibility tree.
//
// `polite` ensures announcements are queued behind anything urgent; for
// dice and move outcomes that's the right priority.
interface LiveRegionProps {
  text: string;
}

const visuallyHidden: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const LiveRegion: React.FC<LiveRegionProps> = ({ text }) => (
  <div aria-live="polite" aria-atomic="true" role="status" style={visuallyHidden}>
    {text}
  </div>
);

export default LiveRegion;
