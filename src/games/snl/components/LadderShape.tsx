import React from 'react';
import { cellCenterPct } from './snakeGeometry';

interface LadderProps {
  from: number;
  to: number;
  cellPct: number;
}

// Two rails + evenly-spaced rungs. Width scales with cell size so the
// ladder always reads as "wider than a coin" regardless of board size.
const LadderShape: React.FC<LadderProps> = ({ from, to, cellPct }) => {
  const a = cellCenterPct(from);
  const b = cellCenterPct(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const w = cellPct * 0.18;

  const ax1 = a.x + px * w;
  const ay1 = a.y + py * w;
  const ax2 = a.x - px * w;
  const ay2 = a.y - py * w;
  const bx1 = b.x + px * w;
  const by1 = b.y + py * w;
  const bx2 = b.x - px * w;
  const by2 = b.y - py * w;

  const rungs = Math.max(3, Math.floor(len / (cellPct * 0.45)));
  const items: React.ReactNode[] = [];
  for (let i = 1; i < rungs; i++) {
    const t = i / rungs;
    const r1x = ax1 + (bx1 - ax1) * t;
    const r1y = ay1 + (by1 - ay1) * t;
    const r2x = ax2 + (bx2 - ax2) * t;
    const r2y = ay2 + (by2 - ay2) * t;
    items.push(<line key={i} x1={r1x} y1={r1y} x2={r2x} y2={r2y} stroke="var(--ladder)" strokeWidth="0.45" strokeLinecap="round" />);
  }

  return (
    <g>
      <line x1={ax1} y1={ay1} x2={bx1} y2={by1} stroke="var(--ladder)" strokeWidth="0.65" strokeLinecap="round" />
      <line x1={ax2} y1={ay2} x2={bx2} y2={by2} stroke="var(--ladder)" strokeWidth="0.65" strokeLinecap="round" />
      {items}
    </g>
  );
};

export default LadderShape;
