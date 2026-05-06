// Snakes & Ladders board + game screen
// Standard 10x10 numbered 1-100 (boustrophedon)

function buildSnakesBoard(size = 340) {
  const cell = size / 10;
  const cells = [];
  for (let r = 0; r < 10; r++) {
    const reverseRow = r % 2 === 1;
    for (let c = 0; c < 10; c++) {
      const num = (9 - r) * 10 + (reverseRow ? 10 - c : c + 1);
      cells.push({ r, c, num });
    }
  }
  return { cells, cell };
}

// Map a cell number to (x,y) center pixel coordinates
function cellCenter(num, cell) {
  const r = 9 - Math.floor((num - 1) / 10);
  const rowFromBottom = Math.floor((num - 1) / 10);
  const reverseRow = rowFromBottom % 2 === 1;
  const idxInRow = (num - 1) % 10;
  const c = reverseRow ? 9 - idxInRow : idxInRow;
  return { x: c * cell + cell / 2, y: r * cell + cell / 2 };
}

function SnakeShape({ from, to, cell, color = T.snake }) {
  const a = cellCenter(from, cell);
  const b = cellCenter(to, cell);
  const dx = b.x - a.x, dy = b.y - a.y;
  const perp = Math.atan2(dy, dx) + Math.PI / 2;
  const ang = Math.atan2(dy, dx) * 180 / Math.PI;
  const wave = 26;
  const c1x = a.x + dx * 0.3 + Math.cos(perp) * wave;
  const c1y = a.y + dy * 0.3 + Math.sin(perp) * wave;
  const c2x = a.x + dx * 0.7 - Math.cos(perp) * wave;
  const c2y = a.y + dy * 0.7 - Math.sin(perp) * wave;
  const id = 'sn' + from + to;
  const headR = cell * 0.3;
  // tongue tip
  const tlx = a.x + Math.cos((Math.atan2(dy,dx))) * cell * 0.32 * -1; // away from body, toward "out"
  // simpler: tongue points away from tail along reverse direction
  const tx = a.x - (b.x - a.x) / Math.hypot(dx,dy) * cell * 0.45;
  const ty = a.y - (b.y - a.y) / Math.hypot(dx,dy) * cell * 0.45;

  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1a4a28"/>
          <stop offset="50%" stopColor={color}/>
          <stop offset="100%" stopColor="#0f3018"/>
        </linearGradient>
      </defs>
      {/* body shadow */}
      <path d={`M ${a.x} ${a.y} C ${c1x+1} ${c1y+2}, ${c2x+1} ${c2y+2}, ${b.x} ${b.y}`}
        stroke="rgba(0,0,0,.4)" strokeWidth={cell * 0.36} fill="none" strokeLinecap="round"/>
      {/* body */}
      <path d={`M ${a.x} ${a.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`}
        stroke={`url(#${id})`} strokeWidth={cell * 0.32} fill="none" strokeLinecap="round"/>
      {/* belly highlight */}
      <path d={`M ${a.x} ${a.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`}
        stroke="rgba(180,255,180,.35)" strokeWidth={cell * 0.06} fill="none" strokeLinecap="round"/>
      {/* scales — dashed */}
      <path d={`M ${a.x} ${a.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`}
        stroke="rgba(0,0,0,.35)" strokeWidth={cell * 0.18} fill="none" strokeLinecap="butt" strokeDasharray="2 5"/>
      {/* tail tip */}
      <circle cx={b.x} cy={b.y} r={cell * 0.08} fill="#0f3018"/>

      {/* HEAD — bigger, menacing */}
      <g transform={`translate(${a.x} ${a.y}) rotate(${ang + 180})`}>
        {/* hood/jaw shape */}
        <path d={`M 0 ${-headR*0.8} Q ${headR*1.1} ${-headR*0.6}, ${headR*1.2} 0 Q ${headR*1.1} ${headR*0.6}, 0 ${headR*0.8} Q ${-headR*0.3} 0, 0 ${-headR*0.8} Z`}
          fill={color} stroke="#0a1f10" strokeWidth="1.2"/>
        {/* head highlight */}
        <ellipse cx={headR*0.4} cy={-headR*0.3} rx={headR*0.45} ry={headR*0.2} fill="rgba(180,255,180,.4)"/>
        {/* fangs */}
        <path d={`M ${headR*0.95} ${-headR*0.25} L ${headR*1.15} ${headR*0.05} L ${headR*0.85} ${headR*0.0} Z`} fill="#fff"/>
        <path d={`M ${headR*0.95} ${headR*0.25} L ${headR*1.15} ${-headR*0.05} L ${headR*0.85} ${headR*0.0} Z`} fill="#fff"/>
        {/* forked tongue */}
        <path d={`M ${headR*1.1} 0 L ${headR*1.9} ${-headR*0.15} M ${headR*1.1} 0 L ${headR*1.9} ${headR*0.15} M ${headR*1.1} 0 L ${headR*1.55} 0`}
          stroke="#e63946" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
        {/* eyes — yellow with slit pupils */}
        <ellipse cx={headR*0.15} cy={-headR*0.45} rx={headR*0.22} ry={headR*0.18} fill="#ffd54a" stroke="#0a1f10" strokeWidth="0.6"/>
        <ellipse cx={headR*0.15} cy={headR*0.45} rx={headR*0.22} ry={headR*0.18} fill="#ffd54a" stroke="#0a1f10" strokeWidth="0.6"/>
        <ellipse cx={headR*0.18} cy={-headR*0.45} rx={headR*0.04} ry={headR*0.14} fill="#000"/>
        <ellipse cx={headR*0.18} cy={headR*0.45} rx={headR*0.04} ry={headR*0.14} fill="#000"/>
        {/* nostrils */}
        <circle cx={headR*0.95} cy={-headR*0.12} r={headR*0.04} fill="#000"/>
        <circle cx={headR*0.95} cy={headR*0.12} r={headR*0.04} fill="#000"/>
      </g>
    </g>
  );
}

function LadderShape({ from, to, cell, color = T.ladder }) {
  const a = cellCenter(from, cell);
  const b = cellCenter(to, cell);
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const w = cell * 0.18; // half-width
  const ax1 = a.x + px * w, ay1 = a.y + py * w;
  const ax2 = a.x - px * w, ay2 = a.y - py * w;
  const bx1 = b.x + px * w, by1 = b.y + py * w;
  const bx2 = b.x - px * w, by2 = b.y - py * w;
  const rungs = Math.max(3, Math.floor(len / (cell * 0.45)));
  const items = [];
  for (let i = 1; i < rungs; i++) {
    const t = i / rungs;
    const r1x = ax1 + (bx1 - ax1) * t, r1y = ay1 + (by1 - ay1) * t;
    const r2x = ax2 + (bx2 - ax2) * t, r2y = ay2 + (by2 - ay2) * t;
    items.push(<line key={i} x1={r1x} y1={r1y} x2={r2x} y2={r2y} stroke={color} strokeWidth="2.5" strokeLinecap="round"/>);
  }
  return (
    <g>
      <line x1={ax1} y1={ay1} x2={bx1} y2={by1} stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
      <line x1={ax2} y1={ay2} x2={bx2} y2={by2} stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
      {items}
    </g>
  );
}

function SnakesLaddersBoard({ size = 340, players }) {
  const { cells, cell } = buildSnakesBoard(size);

  // Classic snakes and ladders
  const snakes = [
    { from: 99, to: 80 },
    { from: 95, to: 24 },
    { from: 87, to: 36 },
    { from: 62, to: 19 },
    { from: 54, to: 34 },
    { from: 17, to: 7 },
  ];
  const ladders = [
    { from: 4, to: 25 },
    { from: 13, to: 46 },
    { from: 33, to: 49 },
    { from: 50, to: 69 },
    { from: 63, to: 81 },
    { from: 72, to: 91 },
  ];

  // Cell colors — checker with festive accent on milestones
  const cellColor = (n) => {
    if ([1, 100].includes(n)) return T.goldHi;
    if (snakes.some(s => s.from === n)) return '#ffe4d6';
    if (ladders.some(l => l.from === n)) return '#e6f4d6';
    const r = Math.floor((n - 1) / 10), c = (n - 1) % 10;
    return (r + c) % 2 ? '#fff7e1' : '#f5deaa';
  };

  return (
    <div style={{
      width: size, height: size, position: 'relative',
      borderRadius: 14, overflow: 'hidden',
      boxShadow: `0 0 0 4px ${T.goldDeep}, 0 0 0 6px ${T.goldHi}, 0 0 0 9px ${T.goldDeep}, 0 18px 50px rgba(0,0,0,.55)`,
    }}>
      {/* Cells */}
      {cells.map(({ r, c, num }) => (
        <div key={num} style={{
          position: 'absolute', left: c * cell, top: r * cell, width: cell, height: cell,
          background: cellColor(num),
          border: '1px solid rgba(120,80,20,.18)',
          boxSizing: 'border-box',
          fontFamily: T.fontBody, fontWeight: 700, fontSize: cell * 0.28,
          color: 'rgba(58,31,0,.55)', padding: 4, boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,.5)',
        }}>{num}</div>
      ))}

      {/* Snakes & Ladders overlay */}
      <svg viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {ladders.map((l, i) => <LadderShape key={'l'+i} from={l.from} to={l.to} cell={cell}/>)}
        {snakes.map((s, i) => <SnakeShape key={'s'+i} from={s.from} to={s.to} cell={cell}/>)}
      </svg>

      {/* Player tokens */}
      {players && players.map((p, i) => {
        const pos = cellCenter(p.cell, cell);
        // offset multiple tokens on the same square
        const offset = (i % 2) * cell * 0.22 - cell * 0.11;
        const offY = (Math.floor(i / 2)) * cell * 0.22 - cell * 0.11;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: pos.x - cell * 0.32 + offset,
            top: pos.y - cell * 0.4 + offY,
            width: cell * 0.65,
            zIndex: 10,
          }}>
            <Token color={p.color} size={cell * 0.55} glow={p.active}/>
            {p.active && (
              <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', padding: '2px 6px', borderRadius: 8, background: T.gold, color: '#3a1f00', fontSize: 9, fontWeight: 800 }}>{p.label}</div>
            )}
          </div>
        );
      })}

      {/* "100" star */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: cell, height: cell, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <svg viewBox="0 0 16 16" style={{ width: '60%', height: '60%' }}>
          <path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5z" fill={T.goldDeep}/>
        </svg>
      </div>
    </div>
  );
}

function SnakesGameScreen({ state = 'turn' }) {
  const players = {
    bottom: { key: 'bottom', name: 'Aarav', color: T.pRed, label: 'A', cell: 24 },
    topL: { key: 'topL', name: 'Diya', color: T.pGreen, label: 'D', cell: 47 },
    topR: { key: 'topR', name: 'Rohan', color: T.pBlue, label: 'R', cell: 11 },
  };
  const active = 'bottom';
  const dice = state === 'rolled' ? 4 : null;
  const hint = state === 'rolled' ? 'Rolled 4 · 20→24' : 'Tap dice to roll';
  const boardPlayers = [
    { ...players.bottom, active: true },
    { ...players.topL, active: false },
    { ...players.topR, active: false },
  ];

  return (
    <Phone bg={`radial-gradient(ellipse at 50% 50%, ${T.bgPanelHi}, ${T.bgDeep} 75%)`}>
      <StatusBar />
      <div style={{ padding: '4px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9 1L3 7l6 6" stroke={T.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ fontSize: 10, letterSpacing: 2, color: T.inkFaint, textTransform: 'uppercase' }}>Pass-and-play · 3P</div>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="1.5" fill={T.ink}/><circle cx="8" cy="8" r="1.5" fill={T.ink}/><circle cx="13" cy="8" r="1.5" fill={T.ink}/></svg>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <PlayerHalfRow players={[players.topL, players.topR]} side="top" active={active} dice={null} hint={null}/>
      </div>

      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
        <SnakesLaddersBoard size={358} players={boardPlayers}/>
      </div>

      <div style={{ marginTop: 14 }}>
        <PlayerPod player={players.bottom} active={true} dice={dice} hint={hint}/>
      </div>

      <div style={{ position: 'absolute', bottom: 36, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ fontSize: 10, letterSpacing: 1.5, color: T.inkFaint, textTransform: 'uppercase', display: 'flex', gap: 18 }}>
          <span>↻ Undo</span>
          <span style={{ color: T.gold }}>● Aarav's turn</span>
          <span>⚙ Menu</span>
        </div>
      </div>
    </Phone>
  );
}

function SnakesRolledState() { return <SnakesGameScreen state="rolled"/>; }

function SnakesSlideState() {
  return (
    <div style={{ position: 'relative' }}>
      <SnakesGameScreen state="rolled"/>
      <div style={{ position: 'absolute', top: 320, left: '50%', transform: 'translateX(-50%)', zIndex: 50, padding: '14px 22px', borderRadius: 999, background: `linear-gradient(135deg, #2c8a4a, #1c5e34)`, color: '#fff', fontFamily: T.display, fontSize: 16, fontWeight: 700, boxShadow: '0 12px 30px rgba(44,138,74,.5)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 20 }}>🐍</span> Snake! 99 → 80
      </div>
    </div>
  );
}

Object.assign(window, { SnakesLaddersBoard, SnakesGameScreen, SnakesRolledState, SnakesSlideState });
