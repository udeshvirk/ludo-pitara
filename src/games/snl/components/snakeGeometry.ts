import { BOARD_SIZE, cellToRowCol } from '../constants';

// Pure geometry helpers for snakes / ladders / the sliding token. No
// React, no DOM — fed to both SnakeBody, SnakeHead (render), and the
// SlidingToken (animation waypoints).

export interface Point { x: number; y: number }

export function cellCenterPct(cellNum: number): Point {
  const { row, col } = cellToRowCol(cellNum);
  const size = 100 / BOARD_SIZE; // each cell is 10% wide on a 0..100 viewbox
  return { x: col * size + size / 2, y: row * size + size / 2 };
}

export interface SnakeGeometry {
  a: Point;
  b: Point;
  angDeg: number;
  bodyPath: string;
  points: Point[];
}

// Build the wavy path the snake's body traces from head (`from`) to
// tail (`to`). Returns the SVG `d=` string and the underlying sample
// points so the slide animation can re-use the same curve.
function classicSnakeGeometry(from: number, to: number, cellPct: number): SnakeGeometry {
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

  const points: Point[] = [];
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

// Broad, low-frequency bends, shared by the artwork and sliding token.
// Legacy saves retain their original curves so their routes do not start crossing.
export function snakeGeometry(from: number, to: number, cellPct: number, sweeping = false): SnakeGeometry {
  if (!sweeping) return classicSnakeGeometry(from, to, cellPct);
  const a = cellCenterPct(from), b = cellCenterPct(to);
  const dx = b.x - a.x, dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const px = -dy / length, py = dx / length;
  const waves = Math.max(1, Math.round(length / 55));
  const samples = 96;
  let amplitude = Math.min(cellPct * 1.1, length * .24);
  // Account for the actual wave at each point, rather than restricting
  // the entire body to the clearance of its endpoint near a board edge.
  for (let i = 1; i < samples; i++) {
    const t = i / samples;
    const wave = Math.sin(t * Math.PI * 2 * waves) * Math.sin(Math.PI * t);
    for (const [base, factor] of [[a.x + dx * t, px * wave], [a.y + dy * t, py * wave]]) {
      if (factor > 1e-6) amplitude = Math.min(amplitude, (97 - base) / factor);
      else if (factor < -1e-6) amplitude = Math.min(amplitude, (3 - base) / factor);
    }
  }
  const points = Array.from({ length: samples + 1 }, (_, i) => {
    const t = i / samples;
    const offset = Math.sin(t * Math.PI * 2 * waves) * Math.sin(Math.PI * t) * amplitude;
    return { x: a.x + dx * t + px * offset, y: a.y + dy * t + py * offset };
  });
  const bodyPath = points.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  return { a, b, points, bodyPath, angDeg: Math.atan2(dy, dx) * 180 / Math.PI };
}

// Evenly subsample an array of points down to `target` waypoints —
// enough to drive a smooth keyframe animation without thousands of
// intermediate frames.
export function subsample<T>(arr: T[], target: number): T[] {
  if (arr.length <= target) return arr;
  const out: T[] = [];
  const step = (arr.length - 1) / (target - 1);
  for (let i = 0; i < target; i++) out.push(arr[Math.round(i * step)]);
  return out;
}
