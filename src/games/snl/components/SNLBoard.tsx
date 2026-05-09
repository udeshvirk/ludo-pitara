import React, { useId, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BOARD_SIZE, rowColToCell, cellToRowCol } from '../constants';
import { useSNLStore } from '../store';
import Coin, { stackPlacement } from '../../../components/ui/Coin';
import StackCountBadge from '../../../components/ui/StackCountBadge';

// SNL cells carry a number badge, snake/ladder anchor styling and the
// snakes themselves on top, so full-size coins crowded the cell. Shrink
// every coin (single + stacked + sliding) by this factor.
const SNL_TOKEN_SCALE = 0.85;

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

// Geometry shared by SnakeBody and SnakeHead. Returns the path string
// for the SVG render plus the underlying sample points so the slide
// animation can drive a floating token along the same curve.
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

  const points: Array<{ x: number; y: number }> = [];
  let bodyPath = '';
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const taper = Math.sin(Math.PI * t);
    const offset = Math.sin(t * Math.PI * 2 * waves) * waveAmp * taper;
    const x = a.x + dx * t + perpX * offset;
    const y = a.y + dy * t + perpY * offset;
    points.push({ x, y });
    bodyPath += (i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return { a, b, angDeg, bodyPath, points };
}

// Evenly subsample an array of points down to N waypoints — enough to
// drive a smooth keyframe animation without thousands of intermediate
// frames.
function subsample<T>(arr: T[], target: number): T[] {
  if (arr.length <= target) return arr;
  const out: T[] = [];
  const step = (arr.length - 1) / (target - 1);
  for (let i = 0; i < target; i++) out.push(arr[Math.round(i * step)]);
  return out;
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

const SnakeHead: React.FC<ShapeProps> = ({ from, to, cellPct }) => {
  const { a, angDeg } = snakeGeometry(from, to, cellPct);
  const headR = cellPct * 0.22;
  // Tongue is clipped at headR * 1.05 (just past the snout) so it
  // never crosses the cell boundary.
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
      {/* forked tongue — kept short so it doesn't bleed into the next cell */}
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

// Floating token rendered on top of the board while a player is sliding
// down a snake or climbing a ladder. Animates left/top through ~16
// waypoints sampled along the entity's path.
const SlidingToken: React.FC<{
  color: string;
  fromCell: number;
  toCell: number;
  type: 'snake' | 'ladder';
  cellPct: number;
}> = ({ color, fromCell, toCell, type, cellPct }) => {
  const waypoints = useMemo(() => {
    if (type === 'snake') {
      const { points } = snakeGeometry(fromCell, toCell, cellPct);
      return subsample(points, 16);
    }
    // Ladder: linear from base to top. Two endpoints + the same in
    // between is enough — the climb reads cleanly without wobble.
    const a = cellCenterPct(fromCell);
    const b = cellCenterPct(toCell);
    const pts: Array<{ x: number; y: number }> = [];
    const STEPS = 8;
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
    return pts;
  }, [fromCell, toCell, type, cellPct]);

  // Token size matches a single-player-in-cell coin (70% × SNL_TOKEN_SCALE
  // of cellPct in viewbox-percent terms).
  const tokenSize = cellPct * 0.7 * SNL_TOKEN_SCALE;
  const halfSize = tokenSize / 2;
  const lefts = waypoints.map(p => `${p.x - halfSize}%`);
  const tops = waypoints.map(p => `${p.y - halfSize}%`);
  const duration = type === 'snake' ? 0.85 : 0.55;

  return (
    <motion.div
      style={{
        position: 'absolute',
        width: `${tokenSize}%`,
        height: `${tokenSize}%`,
        left: lefts[0],
        top: tops[0],
        zIndex: 50,
        pointerEvents: 'none',
      }}
      animate={{ left: lefts, top: tops }}
      transition={{ duration, ease: 'easeInOut' }}
    >
      <Coin color={color} />
    </motion.div>
  );
};

const SNLBoard: React.FC = () => {
  const players = useSNLStore(s => s.players);
  const layout = useSNLStore(s => s.layout);
  const sliding = useSNLStore(s => s.sliding);
  const cellPct = 100 / BOARD_SIZE;

  const snakes = useMemo(() => layout.filter(s => s.type === 'snake'), [layout]);
  const ladders = useMemo(() => layout.filter(s => s.type === 'ladder'), [layout]);
  const ladderBases = useMemo(() => new Set(ladders.map(l => l.from)), [ladders]);
  const ladderTops = useMemo(() => new Set(ladders.map(l => l.to)), [ladders]);
  const snakeHeads = useMemo(() => new Set(snakes.map(s => s.from)), [snakes]);
  const snakeTails = useMemo(() => new Set(snakes.map(s => s.to)), [snakes]);

  const slidingPlayer = sliding ? players.find(p => p.id === sliding.playerId) ?? null : null;

  const playerPositions = useMemo(() => {
    const map = new Map<number, typeof players>();
    for (const p of players) {
      if (sliding && p.id === sliding.playerId) continue;
      if (p.position === 0) continue;
      if (!map.has(p.position)) map.set(p.position, []);
      map.get(p.position)!.push(p);
    }
    return map;
  }, [players, sliding]);

  return (
    <motion.div
      className="relative mx-auto"
      style={{
        width: '100%',
        height: '100%',
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
              <div style={{ position: 'absolute', inset: 0, zIndex: 4 }}>
                {players.map((p, idx) => {
                  const { sizePercent, leftPercent, topPercent } = stackPlacement(players.length, idx, SNL_TOKEN_SCALE);
                  return (
                    <motion.div
                      key={p.id}
                      layoutId={`snl-token-${p.id}`}
                      style={{
                        position: 'absolute',
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        width: `${sizePercent}%`,
                        height: `${sizePercent}%`,
                        zIndex: 10 + idx,
                      }}
                      // Linear tween, deliberately longer than the
                      // 90 ms per-cell step — see Token.tsx in Ludo
                      // for the stop-and-go reasoning.
                      transition={{ type: 'tween', ease: 'linear', duration: 0.16 }}
                    >
                      <Coin color={p.color} />
                    </motion.div>
                  );
                })}
                {players.length >= 2 && <StackCountBadge n={players.length} />}
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

      {sliding && slidingPlayer && (
        <SlidingToken
          color={slidingPlayer.color}
          fromCell={sliding.fromCell}
          toCell={sliding.toCell}
          type={sliding.type}
          cellPct={cellPct}
        />
      )}
    </motion.div>
  );
};

export default SNLBoard;
