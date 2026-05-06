// Shared visual primitives + tokens for Ludo Pitara mockups.
// Festive Indian palette, warm gold accents on deep night purple.

const T = {
  // surfaces
  bgDeep: '#190a2e',
  bgPanel: '#2a1248',
  bgPanelHi: '#3a1a5e',
  bgCard: 'rgba(255,255,255,0.06)',
  bgCardHi: 'rgba(255,255,255,0.10)',
  bgBoard: '#fbf0d4',
  bgBoardCream: '#fff7e1',
  // ink
  ink: '#fff8e7',
  inkDim: 'rgba(255, 248, 231, 0.62)',
  inkFaint: 'rgba(255, 248, 231, 0.32)',
  inkOnLight: '#2a1248',
  // accents
  gold: '#f5b800',
  goldHi: '#ffd966',
  goldDeep: '#b07a00',
  saffron: '#ff8a3d',
  rose: '#e53935',
  // player tokens
  pRed: '#e53935',
  pGreen: '#2e9d4f',
  pYellow: '#f5b800',
  pBlue: '#1e6fdb',
  pRedDeep: '#9a1a18',
  pGreenDeep: '#185c2c',
  pYellowDeep: '#8a6800',
  pBlueDeep: '#0e3e7a',
  // S&L
  snake: '#2c8a4a',
  ladder: '#c8853a',
  // shadow
  shadow: '0 12px 40px rgba(0,0,0,.45)',
  shadowSm: '0 4px 14px rgba(0,0,0,.28)',
  // type
  display: '"Fraunces", "Playfair Display", Georgia, serif',
  fontDisplay: '"Bricolage Grotesque", "Plus Jakarta Sans", -apple-system, system-ui, sans-serif',
  fontBody: '"Plus Jakarta Sans", -apple-system, system-ui, sans-serif',
};

// Mandala / rangoli decorative SVG — used as ambient bg motif
function Mandala({ size = 240, color = T.gold, opacity = 0.18, style }) {
  const r = size / 2;
  const petals = [];
  const N = 16;
  for (let i = 0; i < N; i++) {
    const a = (i * 360) / N;
    petals.push(
      <ellipse key={i} cx={r} cy={r * 0.32} rx={r * 0.07} ry={r * 0.22}
        transform={`rotate(${a} ${r} ${r})`} fill="none" stroke={color} strokeWidth="1.2" />
    );
  }
  const dots = [];
  for (let i = 0; i < 24; i++) {
    const a = (i * 360) / 24 * Math.PI / 180;
    dots.push(<circle key={i} cx={r + Math.cos(a) * r * 0.78} cy={r + Math.sin(a) * r * 0.78} r="1.5" fill={color} />);
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ opacity, ...style }}>
      <circle cx={r} cy={r} r={r * 0.92} fill="none" stroke={color} strokeWidth="1" />
      <circle cx={r} cy={r} r={r * 0.78} fill="none" stroke={color} strokeWidth="0.8" strokeDasharray="2 4" />
      <circle cx={r} cy={r} r={r * 0.55} fill="none" stroke={color} strokeWidth="1" />
      <circle cx={r} cy={r} r={r * 0.32} fill="none" stroke={color} strokeWidth="1" />
      {petals}
      {dots}
      <circle cx={r} cy={r} r="4" fill={color} />
    </svg>
  );
}

// Decorative gold corner ornament
function Corner({ size = 60, color = T.gold, style, flip = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" style={{ transform: flip, ...style }}>
      <path d="M2 2 L24 2 M2 2 L2 24" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M6 6 Q14 6 14 14 Q14 6 22 6" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round"/>
      <circle cx="14" cy="14" r="2" fill={color}/>
      <circle cx="2" cy="2" r="1.6" fill={color}/>
    </svg>
  );
}

// Status bar (iOS-style, simplified for app screens)
function StatusBar({ dark = true }) {
  const c = dark ? '#fff' : '#000';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 26px 4px', height: 44, boxSizing: 'border-box',
      fontFamily: T.fontBody, fontWeight: 600, fontSize: 15, color: c,
      position: 'relative', zIndex: 30,
    }}>
      <span>9:41</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="6" width="3" height="5" rx="0.6" fill={c}/><rect x="4.5" y="4" width="3" height="7" rx="0.6" fill={c}/><rect x="9" y="2" width="3" height="9" rx="0.6" fill={c}/><rect x="13.5" y="0" width="3" height="11" rx="0.6" fill={c}/></svg>
        <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke={c} strokeOpacity="0.4" fill="none"/><rect x="2" y="2" width="18" height="8" rx="1.5" fill={c}/><path d="M22.5 4v4c.7-.3 1.3-1.1 1.3-2s-.6-1.7-1.3-2z" fill={c} fillOpacity="0.4"/></svg>
      </div>
    </div>
  );
}

// Home indicator
function HomeIndicator({ dark = true }) {
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
      height: 28, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 8,
    }}>
      <div style={{ width: 134, height: 5, borderRadius: 100, background: dark ? 'rgba(255,255,255,.65)' : 'rgba(0,0,0,.3)' }} />
    </div>
  );
}

// Phone shell — gradient festive background by default
function Phone({ children, bg, width = 390, height = 844, style }) {
  return (
    <div style={{
      width, height, position: 'relative',
      background: bg || `radial-gradient(ellipse at 50% 0%, ${T.bgPanelHi} 0%, ${T.bgPanel} 38%, ${T.bgDeep} 80%)`,
      overflow: 'hidden',
      fontFamily: T.fontBody,
      color: T.ink,
      ...style,
    }}>
      {children}
      <HomeIndicator />
    </div>
  );
}

// Pill button — primary (gold) or ghost
function Btn({ children, primary, ghost, small, danger, style, icon }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: small ? '10px 18px' : '15px 26px',
    borderRadius: 999, fontWeight: 700, letterSpacing: 0.2,
    fontSize: small ? 14 : 16, cursor: 'pointer', userSelect: 'none',
    fontFamily: T.fontDisplay, whiteSpace: 'nowrap',
  };
  let theme;
  if (primary) {
    theme = {
      background: `linear-gradient(180deg, ${T.goldHi}, ${T.gold} 55%, ${T.goldDeep})`,
      color: '#3a1f00',
      boxShadow: `0 6px 18px rgba(245, 184, 0, .45), inset 0 1px 0 rgba(255,255,255,.7), inset 0 -2px 0 rgba(0,0,0,.18)`,
      border: '1px solid rgba(255,225,150,.6)',
    };
  } else if (danger) {
    theme = {
      background: 'linear-gradient(180deg, #ff7a5a, #e53935)',
      color: '#fff',
      boxShadow: '0 6px 18px rgba(229, 57, 53, .45), inset 0 1px 0 rgba(255,255,255,.3)',
      border: '1px solid rgba(255,180,170,.4)',
    };
  } else if (ghost) {
    theme = {
      background: 'rgba(255,255,255,0.06)',
      color: T.ink,
      border: '1px solid rgba(255,255,255,0.16)',
      backdropFilter: 'blur(8px)',
    };
  } else {
    theme = {
      background: 'rgba(255,255,255,0.10)',
      color: T.ink,
      border: '1px solid rgba(255,255,255,0.14)',
    };
  }
  return (
    <div style={{ ...base, ...theme, ...style }}>
      {icon}
      {children}
    </div>
  );
}

// Header bar (back + title + action)
function Header({ title, subtitle, onBack = true, action }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 18px 14px', position: 'relative', zIndex: 5,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 14, background: 'rgba(255,255,255,.08)',
        border: '1px solid rgba(255,255,255,.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: onBack ? 1 : 0,
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 1L3 7l6 6" stroke={T.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ textAlign: 'center', flex: 1 }}>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 19, letterSpacing: 0.2 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: T.inkDim, marginTop: 2, letterSpacing: 1.2, textTransform: 'uppercase' }}>{subtitle}</div>}
      </div>
      <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {action || null}
      </div>
    </div>
  );
}

// A 3D-ish die with given face
function Die({ value = 6, size = 60, color = '#fff', dot = '#1a0e2e', shadow = true, rotate = 0 }) {
  const positions = {
    1: [[2,2]],
    2: [[1,1],[3,3]],
    3: [[1,1],[2,2],[3,3]],
    4: [[1,1],[1,3],[3,1],[3,3]],
    5: [[1,1],[1,3],[2,2],[3,1],[3,3]],
    6: [[1,1],[1,2],[1,3],[3,1],[3,2],[3,3]],
  };
  const dots = positions[value] || positions[6];
  const cell = size / 4;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.22,
      background: `linear-gradient(135deg, #ffffff 0%, ${color} 60%, #f0e4c8 100%)`,
      boxShadow: shadow ? `0 ${size*0.12}px ${size*0.2}px rgba(0,0,0,.4), inset 0 2px 0 rgba(255,255,255,.9), inset 0 -3px 0 rgba(0,0,0,.12)` : 'none',
      position: 'relative', transform: `rotate(${rotate}deg)`,
      border: '1px solid rgba(0,0,0,.08)',
    }}>
      {dots.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: p[0] * cell - cell * 0.35,
          top: p[1] * cell - cell * 0.35,
          width: cell * 0.7, height: cell * 0.7,
          borderRadius: '50%',
          background: dot,
          boxShadow: 'inset 0 1.5px 2px rgba(0,0,0,.35)',
        }} />
      ))}
    </div>
  );
}

// Round coin token — simple, clean, glossy
function Token({ color = T.pRed, size = 26, glow = false }) {
  const id = 'tok' + Math.random().toString(36).slice(2, 7);
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <defs>
        <radialGradient id={id} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95"/>
          <stop offset="35%" stopColor={color}/>
          <stop offset="100%" stopColor={color}/>
        </radialGradient>
      </defs>
      {glow && <circle cx="16" cy="16" r="15" fill={color} opacity="0.35"/>}
      {/* shadow */}
      <ellipse cx="16" cy="28" rx="11" ry="2" fill="rgba(0,0,0,.35)"/>
      {/* outer rim */}
      <circle cx="16" cy="16" r="13" fill="rgba(0,0,0,.25)"/>
      {/* coin face */}
      <circle cx="16" cy="16" r="11.5" fill={`url(#${id})`} stroke="rgba(0,0,0,.2)" strokeWidth="0.6"/>
      {/* inner ring */}
      <circle cx="16" cy="16" r="7.5" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="0.8"/>
      {/* highlight */}
      <ellipse cx="12" cy="11" rx="4" ry="2.5" fill="rgba(255,255,255,.55)"/>
    </svg>
  );
}

// Avatar with festive border ring
function Avatar({ color = T.pRed, label = 'A', size = 64, ring = true, image }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      padding: ring ? 3 : 0,
      background: ring ? `conic-gradient(from 0deg, ${T.gold}, ${T.goldHi}, ${T.gold}, ${T.goldDeep}, ${T.gold})` : 'transparent',
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: '50%',
        background: `linear-gradient(140deg, ${color}, ${color}cc)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontFamily: T.fontDisplay, fontWeight: 700, fontSize: size * 0.42,
        border: '2px solid rgba(0,0,0,.15)',
        boxShadow: 'inset 0 2px 4px rgba(255,255,255,.3), inset 0 -3px 6px rgba(0,0,0,.2)',
      }}>{label}</div>
    </div>
  );
}

Object.assign(window, { T, Mandala, Corner, StatusBar, HomeIndicator, Phone, Btn, Header, Die, Token, Avatar });
