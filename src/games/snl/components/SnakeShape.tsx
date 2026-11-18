import React, { useId } from 'react';
import { snakeGeometry } from './snakeGeometry';

interface SnakeProps { from: number; to: number; cellPct: number; awake?: boolean; sweeping?: boolean }
const coats = [
  ['#198b4d', '#0c452d', '#9ac251'],
  ['#783bb0', '#392056', '#ba86cc'],
  ['#bd3048', '#641c30', '#e89a53'],
  ['#167e9a', '#16465d', '#75c4b0'],
  ['#bd861e', '#62430c', '#e8c34c'],
];

export const SnakeBody: React.FC<SnakeProps> = ({ from, to, cellPct, sweeping }) => {
  const id = `snake-${useId().replace(/:/g, '')}`;
  const [coat, edge, belly] = coats[from >= 98 ? 2 : from % coats.length];
  const { b, bodyPath } = snakeGeometry(from, to, cellPct, sweeping);
  return <g>
    <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop stopColor={belly}/><stop offset=".4" stopColor={coat}/><stop offset="1" stopColor={coat}/></linearGradient></defs>
    <path d={bodyPath} stroke="#4f6583" strokeOpacity=".13" strokeWidth={cellPct * .34} fill="none" strokeLinecap="round" transform="translate(0 .4)" />
    <path d={bodyPath} stroke={edge} strokeWidth={cellPct * .29} fill="none" strokeLinecap="round" />
    <path d={bodyPath} stroke={`url(#${id})`} strokeWidth={cellPct * .23} fill="none" strokeLinecap="round" />
    <path d={bodyPath} stroke={belly} strokeWidth={cellPct * .09} strokeDasharray=".25 1.15" fill="none" strokeLinecap="butt" opacity=".7" />
    <circle cx={b.x} cy={b.y} r={cellPct * .08} fill={coat} />
  </g>;
};

export const SnakeHead: React.FC<SnakeProps> = ({ from, to, cellPct, awake, sweeping }) => {
  const [coat, edge] = coats[from >= 98 ? 2 : from % coats.length];
  const { a, angDeg } = snakeGeometry(from, to, cellPct, sweeping);
  return <g transform={`translate(${a.x} ${a.y}) rotate(${angDeg - 90})`} className={awake ? 'garden-snake is-awake' : 'garden-snake'}>
    <path d="M0-2.7C1.2-2.5 2.8-1.1 2.45.6L1.1 2.1H-1.1L-2.45.6C-2.8-1.1-1.2-2.5 0-2.7Z" fill={coat} stroke={edge} strokeWidth=".25" />
    <path d="M0-2.7V-3.3M0-3.3-.4-3.7M0-3.3.4-3.7" stroke="#ad3e4a" strokeWidth=".18" strokeLinecap="round" />
    <path d="M0-1.6.5-.3 0 .7-.5-.3Z" fill={edge} opacity=".6" />
    <g className="snake-eyes">
      <path d="M-2-.9-.6-.35-1.5.1Z" fill="#e4bc5e"/>
      <path d="M2-.9.6-.35 1.5.1Z" fill="#e4bc5e"/>
      <path d="M-1.4-.65V-.05M1.4-.65V-.05" stroke="#151b1a" strokeWidth=".23" />
    </g>
    <path d="M-1.5 1.1-.8 1.5M1.5 1.1.8 1.5" stroke="#dbd0a9" strokeWidth=".16" strokeLinecap="round" />
  </g>;
};
