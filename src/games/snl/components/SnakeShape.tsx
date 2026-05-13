import React, { useId } from 'react';
import { snakeGeometry } from './snakeGeometry';

interface SnakeProps {
  from: number;
  to: number;
  cellPct: number;
}

// The wavy body — wide drop-shadow, gradient core, dashed scales, and
// a small tail tip. Rendered separately from the head so two passes
// can layer all snake heads above all snake bodies (otherwise a body
// could cross another snake's head and obscure it).
export const SnakeBody: React.FC<SnakeProps> = ({ from, to, cellPct }) => {
  const reactId = useId();
  const id = `snake-${reactId.replace(/:/g, '')}`;
  const { b, bodyPath } = snakeGeometry(from, to, cellPct);
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1a4a28" />
          <stop offset="50%" stopColor="var(--snake)" />
          <stop offset="100%" stopColor="#0f3018" />
        </linearGradient>
      </defs>
      {/* shadow */}
      <g transform="translate(0 0.3)">
        <path d={bodyPath} stroke="rgba(0,0,0,0.32)" strokeWidth={cellPct * 0.24} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* body */}
      <path d={bodyPath} stroke={`url(#${id})`} strokeWidth={cellPct * 0.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* belly highlight */}
      <path d={bodyPath} stroke="rgba(200,255,200,0.45)" strokeWidth={cellPct * 0.05} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* dashed scales */}
      <path d={bodyPath} stroke="rgba(0,0,0,0.32)" strokeWidth={cellPct * 0.12} fill="none" strokeLinecap="butt" strokeDasharray="0.4 1.4" />
      {/* tail tip */}
      <circle cx={b.x} cy={b.y} r={cellPct * 0.06} fill="#0f3018" />
    </g>
  );
};

// Diamond-shaped head with tongue + eyes. The tongue is clipped just
// past the snout so it doesn't bleed into the next cell.
export const SnakeHead: React.FC<SnakeProps> = ({ from, to, cellPct }) => {
  const { a, angDeg } = snakeGeometry(from, to, cellPct);
  const headR = cellPct * 0.22;
  const tongueTip = headR * 1.05;
  return (
    <g transform={`translate(${a.x} ${a.y}) rotate(${angDeg + 180})`}>
      <path
        d={`M 0 ${-headR * 0.8} Q ${headR * 1.1} ${-headR * 0.6}, ${headR * 1.2} 0 Q ${headR * 1.1} ${headR * 0.6}, 0 ${headR * 0.8} Q ${-headR * 0.3} 0, 0 ${-headR * 0.8} Z`}
        fill="var(--snake)"
        stroke="#0a1f10"
        strokeWidth="0.18"
      />
      <ellipse cx={headR * 0.4} cy={-headR * 0.3} rx={headR * 0.45} ry={headR * 0.2} fill="rgba(180,255,180,0.4)" />
      <path
        d={`M ${headR * 0.7} 0 L ${tongueTip} ${-headR * 0.12} M ${headR * 0.7} 0 L ${tongueTip} ${headR * 0.12}`}
        stroke="#e63946"
        strokeWidth="0.22"
        strokeLinecap="round"
        fill="none"
      />
      {/* eyes */}
      <ellipse cx={headR * 0.15} cy={-headR * 0.45} rx={headR * 0.2} ry={headR * 0.16} fill="#ffd54a" stroke="#0a1f10" strokeWidth="0.08" />
      <ellipse cx={headR * 0.15} cy={headR * 0.45} rx={headR * 0.2} ry={headR * 0.16} fill="#ffd54a" stroke="#0a1f10" strokeWidth="0.08" />
      <ellipse cx={headR * 0.18} cy={-headR * 0.45} rx={headR * 0.04} ry={headR * 0.12} fill="#000" />
      <ellipse cx={headR * 0.18} cy={headR * 0.45} rx={headR * 0.04} ry={headR * 0.12} fill="#000" />
    </g>
  );
};
