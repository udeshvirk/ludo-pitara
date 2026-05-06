import React, { useId, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BOARD_SIZE, rowColToCell, cellToRowCol } from '../constants';
import { useSNLStore } from '../store';

const cellCenterPct = (cellNum: number) => {
  const { row, col } = cellToRowCol(cellNum);
  const size = 100 / BOARD_SIZE; // each cell is 10% wide on a 0-100 viewbox
  return { x: col * size + size / 2, y: row * size + size / 2 };
};

interface ShapeProps {
  from: number;
  to: number;
  cellPct: number; // size of one cell in viewbox-percent units
}

// Geometry shared by SnakeBody and SnakeHead.
function snakeGeometry(from: number, to: number, cellPct: number) {
  const a = cellCenterPct(from);
  const b = cellCenterPct(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ang = Math.atan2(dy, dx);
  const angDeg = (ang * 180) / Math.PI;
  const perpX = -Math.sin(ang);
  const perpY = Math.cos(ang);

  // Cap the wave amplitude so no sample point leaves the [margin,
  // 100−margin] viewbox.
  const margin = cellPct * 0.45;
  let allowed = cellPct * 0.4;
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const bx = a.x + dx * t;
    const by = a.y + dy * t;
    if (Math.abs(perpX) > 1e-6) {
      allowed = Math.min(allowed, (bx - margin) / Math.abs(perpX), (100 - margin - bx) / Math.abs(perpX));
    }
    if (Math.abs(perpY) > 1e-6) {
      allowed = Math.min(allowed, (by - margin) / Math.abs(perpY), (100 - margin - by) / Math.abs(perpY));
    }
  }
  const waveAmp = Math.max(cellPct * 0.1, allowed);
  const waves = Math.max(2, Math.round(len / (cellPct * 2.2)));
  const samples = Math.max(48, waves * 24);

  let bodyPath = '';
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const taper = Math.sin(Math.PI * t);
    const offset = Math.sin(t * Math.PI * 2 * waves) * waveAmp * taper;
    const x = a.x + dx * t + perpX * offset;
    const y = a.y + dy * t + perpY * offset;
    bodyPath += (i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return { a, b, angDeg, bodyPath };
}

const SnakeBody: React.FC<ShapeProps> = ({ from, to, cellPct }) => {
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
      <g transform="translate(0 0.4)">
        <path d={bodyPath} stroke="rgba(0,0,0,0.35)" strokeWidth={cellPct * 0.36} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* body */}
      <path d={bodyPath} stroke={`url(#${id})`} strokeWidth={cellPct * 0.32} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* belly highlight */}
      <path d={bodyPath} stroke="rgba(200,255,200,0.45)" strokeWidth={cellPct * 0.08} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* dashed scales */}
      <path d={bodyPath} stroke="rgba(0,0,0,0.32)" strokeWidth={cellPct * 0.2} fill="none" strokeLinecap="butt" strokeDasharray="0.5 1.6" />
      {/* tail tip */}
      <circle cx={b.x} cy={b.y} r={cellPct * 0.08} fill="#0f3018" />
    </g>
  );
};

const SnakeHead: React.FC<ShapeProps> = ({ from, to, cellPct }) => {
  const { a, angDeg } = snakeGeometry(from, to, cellPct);
  const headR = cellPct * 0.32;
  return (
    <g transform={`translate(${a.x} ${a.y}) rotate(${angDeg + 180})`}>
      <path
        d={`M 0 ${-headR * 0.8} Q ${headR * 1.1} ${-headR * 0.6}, ${headR * 1.2} 0 Q ${headR * 1.1} ${headR * 0.6}, 0 ${headR * 0.8} Q ${-headR * 0.3} 0, 0 ${-headR * 0.8} Z`}
        fill="var(--snake)"
        stroke="#0a1f10"
        strokeWidth="0.25"
      />
      <ellipse cx={headR * 0.4} cy={-headR * 0.3} rx={headR * 0.45} ry={headR * 0.2} fill="rgba(180,255,180,0.4)" />
      {/* fangs */}
      <path d={`M ${headR * 0.95} ${-headR * 0.25} L ${headR * 1.15} ${headR * 0.05} L ${headR * 0.85} 0 Z`} fill="#fff" />
      <path d={`M ${headR * 0.95} ${headR * 0.25} L ${headR * 1.15} ${-headR * 0.05} L ${headR * 0.85} 0 Z`} fill="#fff" />
      {/* forked tongue */}
      <path
        d={`M ${headR * 1.1} 0 L ${headR * 1.9} ${-headR * 0.15} M ${headR * 1.1} 0 L ${headR * 1.9} ${headR * 0.15} M ${headR * 1.1} 0 L ${headR * 1.55} 0`}
        stroke="#e63946"
        strokeWidth="0.32"
        strokeLinecap="round"
        fill="none"
      />
      {/* eyes */}
      <ellipse cx={headR * 0.15} cy={-headR * 0.45} rx={headR * 0.22} ry={headR * 0.18} fill="#ffd54a" stroke="#0a1f10" strokeWidth="0.12" />
      <ellipse cx={headR * 0.15} cy={headR * 0.45} rx={headR * 0.22} ry={headR * 0.18} fill="#ffd54a" stroke="#0a1f10" strokeWidth="0.12" />
      <ellipse cx={headR * 0.18} cy={-headR * 0.45} rx={headR * 0.04} ry={headR * 0.14} fill="#000" />
      <ellipse cx={headR * 0.18} cy={headR * 0.45} rx={headR * 0.04} ry={headR * 0.14} fill="#000" />
      <circle cx={headR * 0.95} cy={-headR * 0.12} r={headR * 0.04} fill="#000" />
      <circle cx={headR * 0.95} cy={headR * 0.12} r={headR * 0.04} fill="#000" />
    </g>
  );
};

const LadderShape: React.FC<ShapeProps> = ({ from, to, cellPct }) => {
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

const SNLBoard: React.FC = () => {
  const players = useSNLStore(s => s.players);
  const layout = useSNLStore(s => s.layout);
  const cellPct = 100 / BOARD_SIZE;

  const snakes = useMemo(() => layout.filter(s => s.type === 'snake'), [layout]);
  const ladders = useMemo(() => layout.filter(s => s.type === 'ladder'), [layout]);
  const ladderBases = useMemo(() => new Set(ladders.map(l => l.from)), [ladders]);
  const ladderTops = useMemo(() => new Set(ladders.map(l => l.to)), [ladders]);
  const snakeHeads = useMemo(() => new Set(snakes.map(s => s.from)), [snakes]);
  const snakeTails = useMemo(() => new Set(snakes.map(s => s.to)), [snakes]);

  const playerPositions = useMemo(() => {
    const map = new Map<number, typeof players>();
    for (const p of players) {
      if (p.position === 0) continue;
      if (!map.has(p.position)) map.set(p.position, []);
      map.get(p.position)!.push(p);
    }
    return map;
  }, [players]);

  return (
    <motion.div
      className="relative mx-auto"
      style={{
        width: '100%',
        height: '100%',
        aspectRatio: '1',
        background: 'var(--bg-board-cream)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-board)',
      }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, type: 'spring' }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
        }}
      >
        {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, i) => {
          const row = Math.floor(i / BOARD_SIZE);
          const col = i % BOARD_SIZE;
          const cellNum = rowColToCell(row, col);
          const isDark = (row + col) % 2 === 0;
          const isLadderBase = ladderBases.has(cellNum);
          const isLadderTop = ladderTops.has(cellNum);
          const isSnakeHead = snakeHeads.has(cellNum);
          const isSnakeTail = snakeTails.has(cellNum);
          const baseBg = isDark ? 'var(--bg-board)' : 'var(--bg-board-cream)';
          const players = playerPositions.get(cellNum) || [];

          // Number-badge styling per the user's spec — the cell number
          // itself sits inside a coloured circle when the cell is a
          // snake/ladder anchor:
          //   snake head → solid red,    snake tail → white (red ring)
          //   ladder base → solid green, ladder top → white (green ring)
          let badgeBg: string | null = null;
          let badgeBorder: string | null = null;
          let badgeText = 'rgba(120, 80, 20, 0.85)';
          if (isSnakeHead) { badgeBg = 'rgba(229, 57, 53, 0.55)'; badgeText = '#fff'; }
          else if (isLadderBase) { badgeBg = 'rgba(44, 138, 74, 0.55)'; badgeText = '#fff'; }
          else if (isSnakeTail) { badgeBg = 'rgba(255,255,255,0.65)'; badgeBorder = 'rgba(229, 57, 53, 0.55)'; badgeText = 'rgba(154, 26, 24, 0.9)'; }
          else if (isLadderTop) { badgeBg = 'rgba(255,255,255,0.65)'; badgeBorder = 'rgba(44, 138, 74, 0.55)'; badgeText = 'rgba(24, 92, 44, 0.9)'; }

          const isAnchor = badgeBg !== null;
          const isLabel = cellNum === 1 || cellNum === 100;
          const labelText = cellNum === 1 ? 'Start' : cellNum === 100 ? 'Home' : String(cellNum);

          return (
            <div
              key={`${row}-${col}`}
              className="snl-cell"
              style={{
                background: baseBg,
                position: 'relative',
                border: '0.5px solid rgba(120, 80, 20, 0.18)',
              }}
            >
              {isAnchor ? (
                <span
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: 3,
                    minWidth: 14,
                    minHeight: 14,
                    width: '32%',
                    height: '32%',
                    aspectRatio: '1',
                    borderRadius: '50%',
                    background: badgeBg!,
                    border: badgeBorder ? `1px solid ${badgeBorder}` : '1px solid rgba(0,0,0,0.10)',
                    color: badgeText,
                    fontFamily: 'var(--font-ui)',
                    fontWeight: 700,
                    fontSize: '0.58em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    lineHeight: 1,
                  }}
                >
                  {cellNum}
                </span>
              ) : (
                <span
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: 5,
                    fontSize: isLabel ? '0.66em' : '0.78em',
                    fontWeight: isLabel ? 800 : 700,
                    color: cellNum === 100 ? 'var(--gold-deep)' : cellNum === 1 ? 'var(--snake)' : 'rgba(120, 80, 20, 0.85)',
                    fontFamily: 'var(--font-ui)',
                    letterSpacing: isLabel ? 0.6 : 0,
                    textTransform: 'uppercase',
                  }}
                >
                  {labelText}
                </span>
              )}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 1, padding: 2, zIndex: 4 }}>
                {players.map((p, idx) => (
                  <motion.div
                    key={p.id}
                    layoutId={`snl-token-${p.id}`}
                    style={{
                      width: players.length > 2 ? '32%' : players.length > 1 ? '42%' : '60%',
                      aspectRatio: '1',
                      borderRadius: '50%',
                      background: `radial-gradient(circle at 35% 30%, #fff, ${p.color}cc 35%, ${p.color})`,
                      border: '2px solid rgba(255,255,255,0.85)',
                      boxShadow: `0 2px 6px rgba(0,0,0,0.4), 0 0 8px ${p.color}66`,
                      zIndex: 10 + idx,
                    }}
                    transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {ladders.map(l => (
          <LadderShape key={`l-${l.from}-${l.to}`} from={l.from} to={l.to} cellPct={cellPct} />
        ))}
        {/* Two passes so every snake's head sits above every body, even
            when bodies cross other heads. */}
        {snakes.map(s => (
          <SnakeBody key={`sb-${s.from}-${s.to}`} from={s.from} to={s.to} cellPct={cellPct} />
        ))}
        {snakes.map(s => (
          <SnakeHead key={`sh-${s.from}-${s.to}`} from={s.from} to={s.to} cellPct={cellPct} />
        ))}
      </svg>
    </motion.div>
  );
};

export default SNLBoard;
