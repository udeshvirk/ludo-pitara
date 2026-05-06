// Ludo board + gameplay screen
// Each player gets controls on their own side — no need to pass the device

function LudoBoard({ size = 340 }) {
  const cell = size / 15;
  const homes = [
    { x: 0, y: 0, color: T.pRed, deep: T.pRedDeep, count: 2 },
    { x: 9, y: 0, color: T.pGreen, deep: T.pGreenDeep, count: 3 },
    { x: 9, y: 9, color: T.pYellow, deep: T.pYellowDeep, count: 1 },
    { x: 0, y: 9, color: T.pBlue, deep: T.pBlueDeep, count: 4 },
  ];
  const pathCells = [];
  for (let i = 0; i < 15; i++) for (let j = 0; j < 15; j++) {
    const inHome = (i < 6 && j < 6) || (i > 8 && j < 6) || (i > 8 && j > 8) || (i < 6 && j > 8);
    const inCenter = i >= 6 && i <= 8 && j >= 6 && j <= 8;
    if (!inHome && !inCenter) pathCells.push([i, j]);
  }
  const lanes = {
    red:    [[1,7],[2,7],[3,7],[4,7],[5,7]],
    green:  [[7,1],[7,2],[7,3],[7,4],[7,5]],
    yellow: [[13,7],[12,7],[11,7],[10,7],[9,7]],
    blue:   [[7,13],[7,12],[7,11],[7,10],[7,9]],
  };
  const stars = [[1,6],[6,13],[8,1],[13,8],[2,8],[12,6],[6,2],[8,12]];

  return (
    <div style={{
      width: size, height: size, position: 'relative',
      background: T.bgBoardCream, borderRadius: 12, overflow: 'hidden',
      boxShadow: `0 0 0 4px ${T.goldDeep}, 0 0 0 6px ${T.goldHi}, 0 0 0 9px ${T.goldDeep}, 0 18px 50px rgba(0,0,0,.55)`,
    }}>
      {pathCells.map(([i,j]) => {
        let bg = T.bgBoardCream;
        for (const [name, cells] of Object.entries(lanes)) {
          if (cells.some(([x,y]) => x===i && y===j)) {
            bg = name === 'red' ? T.pRed : name === 'green' ? T.pGreen : name === 'yellow' ? T.pYellow : T.pBlue;
          }
        }
        if (i===1 && j===6) bg = `${T.pRed}40`;
        if (i===6 && j===1) bg = `${T.pGreen}40`;
        if (i===13 && j===8) bg = `${T.pYellow}40`;
        if (i===8 && j===13) bg = `${T.pBlue}40`;
        return (
          <div key={i+'-'+j} style={{ position: 'absolute', left: i*cell, top: j*cell, width: cell, height: cell, background: bg, border: `1px solid rgba(120,80,20,.25)`, boxSizing: 'border-box' }}>
            {stars.some(([x,y]) => x===i && y===j) && (
              <svg viewBox="0 0 12 12" style={{ width: '70%', height: '70%', position: 'absolute', top: '15%', left: '15%' }}>
                <path d="M6 1l1.5 3 3.5.5L8.5 7l.5 3.5L6 9l-3 1.5L3.5 7 1 4.5l3.5-.5z" fill="rgba(120,80,20,.5)"/>
              </svg>
            )}
          </div>
        );
      })}
      {homes.map((h, idx) => (
        <div key={idx} style={{ position: 'absolute', left: h.x*cell, top: h.y*cell, width: 6*cell, height: 6*cell, background: `linear-gradient(135deg, ${h.color}, ${h.deep})`, border: `2px solid ${h.deep}`, boxSizing: 'border-box' }}>
          <div style={{ position: 'absolute', inset: cell*0.7, background: '#fff7e1', border: `1.5px solid ${h.deep}`, borderRadius: 4 }}>
            <div style={{ position: 'absolute', inset: cell*0.4, display: 'grid', gridTemplate: '1fr 1fr / 1fr 1fr', gap: cell*0.3 }}>
              {[0,1,2,3].map(k => (
                <div key={k} style={{ background: h.color, borderRadius: '50%', border: `2px solid ${h.deep}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 -3px 6px rgba(0,0,0,.25), inset 0 2px 3px rgba(255,255,255,.4)' }}>
                  {k < h.count && <Token color={h.color} size={cell*1.4} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      <div style={{ position: 'absolute', left: 6*cell, top: 6*cell, width: 3*cell, height: 3*cell, background: '#fff7e1', border: '1.5px solid rgba(120,80,20,.4)' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <polygon points="50,50 0,0 100,0" fill={T.pGreen}/>
          <polygon points="50,50 100,0 100,100" fill={T.pYellow}/>
          <polygon points="50,50 100,100 0,100" fill={T.pBlue}/>
          <polygon points="50,50 0,100 0,0" fill={T.pRed}/>
          <circle cx="50" cy="50" r="10" fill={T.goldHi} stroke={T.goldDeep} strokeWidth="1.5"/>
          <text x="50" y="56" textAnchor="middle" fontSize="14" fontWeight="700" fill="#3a1f00" fontFamily={T.display}>★</text>
        </svg>
      </div>
      {/* Live tokens */}
      <div style={{ position: 'absolute', left: 1*cell + cell*0.05, top: 6*cell + cell*0.05, width: cell*0.9, height: cell*0.9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Token color={T.pRed} size={cell*0.85} glow/></div>
      <div style={{ position: 'absolute', left: 6*cell + cell*0.05, top: 12*cell + cell*0.05, width: cell*0.9, height: cell*0.9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Token color={T.pRed} size={cell*0.85}/></div>
      <div style={{ position: 'absolute', left: 8*cell + cell*0.05, top: 5*cell + cell*0.05, width: cell*0.9, height: cell*0.9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Token color={T.pGreen} size={cell*0.85}/></div>
      <div style={{ position: 'absolute', left: 11*cell + cell*0.05, top: 7*cell + cell*0.05, width: cell*0.9, height: cell*0.9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Token color={T.pYellow} size={cell*0.85}/></div>
      <div style={{ position: 'absolute', left: 4*cell + cell*0.05, top: 8*cell + cell*0.05, width: cell*0.9, height: cell*0.9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Token color={T.pBlue} size={cell*0.85}/></div>
      <div style={{ position: 'absolute', left: 1*cell - 2, top: 6*cell - 2, width: cell+4, height: cell+4, border: `2px solid ${T.gold}`, borderRadius: '50%', boxShadow: `0 0 0 3px rgba(245,184,0,.35), 0 0 16px rgba(245,184,0,.6)`, animation: 'pulse 1.5s infinite' }}/>
      <div style={{ position: 'absolute', left: 4*cell, top: 6*cell, width: cell, height: cell, border: `2px dashed ${T.gold}`, borderRadius: 4, background: 'rgba(245,184,0,.18)' }}/>
    </div>
  );
}

// Top/bottom split row of TWO players sharing one half. Each half = avatar + name + dice tile.
function PlayerHalfRow({ players, side, active, dice, hint }) {
  const rotate = side === 'top' ? 180 : 0;
  return (
    <div style={{
      transform: `rotate(${rotate}deg)`,
      display: 'flex', gap: 8, padding: '0 14px',
    }}>
      {players.map((p, i) => {
        const isActive = active === p.key;
        return (
          <div key={p.key} style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 18,
            background: isActive ? `linear-gradient(135deg, ${p.color}55, ${p.color}1a)` : 'rgba(255,255,255,.04)',
            border: `1.5px solid ${isActive ? p.color : 'rgba(255,255,255,.08)'}`,
            boxShadow: isActive ? `0 8px 24px ${p.color}55` : 'none',
            backdropFilter: 'blur(12px)',
            minWidth: 0,
          }}>
            <Avatar color={p.color} label={p.label} size={38} ring={isActive}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: isActive ? T.gold : T.inkFaint, fontWeight: 700 }}>
                {isActive ? 'Your turn' : 'Waiting'}
              </div>
              <div style={{ fontFamily: T.display, fontSize: 15, fontWeight: 600, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
              <div style={{ fontSize: 10, color: T.inkFaint, marginTop: 1 }}>{isActive && hint ? hint : `${p.score ?? 0}/4 home`}</div>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: isActive ? `linear-gradient(180deg, ${T.goldHi}, ${T.gold} 55%, ${T.goldDeep})` : 'rgba(255,255,255,.08)',
              border: isActive ? '1px solid rgba(255,225,150,.6)' : '1px solid rgba(255,255,255,.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isActive ? `0 4px 14px ${T.gold}66, inset 0 1.5px 0 rgba(255,255,255,.6), inset 0 -2px 0 rgba(0,0,0,.18)` : 'none',
              flexShrink: 0,
            }}>
              {isActive && dice ? <Die value={dice} size={32} rotate={-4}/> : <Die value={6} size={28} color="rgba(255,255,255,.3)" dot="rgba(255,255,255,.4)" shadow={false}/>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Single horizontal pod (used by S&L 3-player, fills full width)
function PlayerPod({ player, active, dice, hint, side = 'bottom' }) {
  const rotate = side === 'top' ? 180 : 0;
  return (
    <div style={{
      transform: `rotate(${rotate}deg)`,
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', borderRadius: 20, margin: '0 14px',
      background: active ? `linear-gradient(135deg, ${player.color}55, ${player.color}1a)` : 'rgba(255,255,255,.04)',
      border: `1.5px solid ${active ? player.color : 'rgba(255,255,255,.08)'}`,
      boxShadow: active ? `0 8px 24px ${player.color}55` : 'none',
      backdropFilter: 'blur(12px)',
    }}>
      <Avatar color={player.color} label={player.label} size={42} ring={active}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: active ? T.gold : T.inkFaint, fontWeight: 700 }}>
          {active ? 'Your turn' : 'Waiting'}
        </div>
        <div style={{ fontFamily: T.display, fontSize: 17, fontWeight: 600, lineHeight: 1.1 }}>{player.name}</div>
        <div style={{ fontSize: 11, color: T.inkDim, marginTop: 2 }}>{active && hint ? hint : `cell ${player.cell}`}</div>
      </div>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: active ? `linear-gradient(180deg, ${T.goldHi}, ${T.gold} 55%, ${T.goldDeep})` : 'rgba(255,255,255,.08)',
        border: active ? '1px solid rgba(255,225,150,.6)' : '1px solid rgba(255,255,255,.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: active ? `0 6px 18px ${T.gold}66, inset 0 2px 0 rgba(255,255,255,.7), inset 0 -3px 0 rgba(0,0,0,.18)` : 'none',
        flexShrink: 0,
      }}>
        {active && dice ? <Die value={dice} size={36} rotate={-4}/> : <Die value={6} size={32} color="rgba(255,255,255,.3)" dot="rgba(255,255,255,.4)" shadow={false}/>}
      </div>
    </div>
  );
}

function LudoGameScreen({ state = 'turn' }) {
  const players = {
    bottom: { key: 'bottom', name: 'Aarav', color: T.pRed, label: 'A', score: 0 },
    bottomR: { key: 'bottomR', name: 'Maya', color: T.pYellow, label: 'M', score: 2 },
    top: { key: 'top', name: 'Diya', color: T.pGreen, label: 'D', score: 1 },
    topR: { key: 'topR', name: 'Rohan', color: T.pBlue, label: 'R', score: 0 },
  };
  const active = 'bottom';
  const dice = state === 'rolled' ? 5 : null;
  const hint = state === 'rolled' ? 'Tap a glowing pawn' : 'Tap dice to roll';
  const activeName = Object.values(players).find(p => p.key === active)?.name;

  return (
    <Phone bg={`radial-gradient(ellipse at 50% 50%, ${T.bgPanelHi}, ${T.bgDeep} 75%)`}>
      <StatusBar />

      <div style={{ padding: '4px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M9 1L3 7l6 6" stroke={T.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ fontSize: 10, letterSpacing: 2, color: T.inkFaint, textTransform: 'uppercase' }}>Pass-and-play · 4P</div>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="3" cy="8" r="1.5" fill={T.ink}/><circle cx="8" cy="8" r="1.5" fill={T.ink}/><circle cx="13" cy="8" r="1.5" fill={T.ink}/></svg>
        </div>
      </div>

      {/* Top row — 2 players (rotated 180°) */}
      <div style={{ marginTop: 8 }}>
        <PlayerHalfRow players={[players.top, players.topR]} side="top" active={active} dice={null} hint={null}/>
      </div>

      {/* Board */}
      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center' }}>
        <LudoBoard size={358}/>
      </div>

      {/* Bottom row — 2 players */}
      <div style={{ marginTop: 14 }}>
        <PlayerHalfRow players={[players.bottom, players.bottomR]} side="bottom" active={active} dice={dice} hint={hint}/>
      </div>

      <div style={{ position: 'absolute', bottom: 36, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ fontSize: 10, letterSpacing: 1.5, color: T.inkFaint, textTransform: 'uppercase', display: 'flex', gap: 18 }}>
          <span>↻ Undo</span>
          <span style={{ color: T.gold }}>● {activeName}'s turn</span>
          <span>⚙ Menu</span>
        </div>
      </div>
    </Phone>
  );
}

function LudoRolledState() { return <LudoGameScreen state="rolled"/>; }

function LudoCaptureState() {
  return (
    <div style={{ position: 'relative' }}>
      <LudoGameScreen state="rolled"/>
      <div style={{ position: 'absolute', top: 320, left: '50%', transform: 'translateX(-50%)', zIndex: 50, padding: '14px 22px', borderRadius: 999, background: `linear-gradient(135deg, ${T.pRed}, #b71c1c)`, color: '#fff', fontFamily: T.display, fontSize: 16, fontWeight: 700, boxShadow: '0 12px 30px rgba(229,57,53,.55)' }}>
        ⚔ Capture! Diya sent home
      </div>
    </div>
  );
}

Object.assign(window, { LudoBoard, LudoGameScreen, LudoRolledState, LudoCaptureState, PlayerPod, PlayerHalfRow });
