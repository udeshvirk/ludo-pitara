// Splash, Game Select, Mode Select, Player Setup, How-to-Play, Settings, Win

function SplashScreen() {
  return (
    <Phone>
      <StatusBar />
      <Mandala size={520} color={T.gold} opacity={0.10} style={{ position: 'absolute', top: -120, left: -120 }} />
      <Mandala size={420} color={T.saffron} opacity={0.08} style={{ position: 'absolute', bottom: -80, right: -100 }} />

      {/* small pattern dots */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, rgba(255,217,102,.12) 1px, transparent 1px)`, backgroundSize: '22px 22px', maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)' }} />

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
        {/* Logo mark — ornate diamond with dice + pawn */}
        <div style={{ position: 'relative', width: 160, height: 160, marginBottom: 28 }}>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: `radial-gradient(circle, ${T.goldHi} 0%, ${T.gold} 40%, ${T.goldDeep} 100%)`,
            boxShadow: `0 0 80px rgba(245,184,0,.5), inset 0 4px 0 rgba(255,255,255,.5), inset 0 -6px 0 rgba(0,0,0,.2)`,
          }} />
          <div style={{
            position: 'absolute', inset: 14, borderRadius: '50%',
            border: `2px dashed rgba(58,31,0,.35)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Die value={5} size={42} />
              <div style={{ transform: 'translateY(-4px)' }}><Token color={T.pRed} size={32}/></div>
            </div>
          </div>
        </div>

        <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 52, letterSpacing: -1, lineHeight: 1, color: T.goldHi, textShadow: '0 4px 24px rgba(0,0,0,.5)' }}>
          Ludo Pitara
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: T.inkDim, letterSpacing: 4, textTransform: 'uppercase' }}>
          ★ खेल का पिटारा ★
        </div>

        <div style={{ position: 'absolute', bottom: 90, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 999, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)', fontSize: 12, color: T.inkDim }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: '#3ad97a', boxShadow: '0 0 10px #3ad97a' }} />
            Plays offline · No internet needed
          </div>
        </div>
      </div>
    </Phone>
  );
}

function GameSelectScreen() {
  return (
    <Phone>
      <StatusBar />
      <Mandala size={400} color={T.gold} opacity={0.06} style={{ position: 'absolute', top: -80, right: -80 }} />

      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke={T.ink} strokeWidth="1.5"/><path d="M8 4v4l2.5 1.5" stroke={T.ink} strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: T.inkDim, textTransform: 'uppercase' }}>Choose your game</div>
          <div style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2" stroke={T.ink} strokeWidth="1.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3" stroke={T.ink} strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
        </div>

        <div style={{ fontFamily: T.display, fontSize: 34, fontWeight: 600, lineHeight: 1.2, marginBottom: 8 }}>
          What shall <span style={{ color: T.goldHi, fontStyle: 'italic' }}>we play</span>?
        </div>
        <div style={{ color: T.inkDim, fontSize: 14, marginBottom: 28 }}>Pick a classic. Pass the phone, no internet needed.</div>

        {/* Ludo card */}
        <div style={{ position: 'relative', marginBottom: 18, padding: 20, borderRadius: 28, background: 'linear-gradient(160deg, rgba(229, 57, 53, .25), rgba(30, 111, 219, .22))', border: '1px solid rgba(255,255,255,.14)', boxShadow: T.shadowSm, overflow: 'hidden' }}>
          <Corner size={50} color={T.goldHi} style={{ position: 'absolute', top: 8, left: 8, opacity: .55 }} />
          <Corner size={50} color={T.goldHi} flip="scaleX(-1)" style={{ position: 'absolute', top: 8, right: 8, opacity: .55 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <MiniLudoBoard size={108} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: T.goldHi, textTransform: 'uppercase', marginBottom: 4 }}>Classic · 2–4 players</div>
              <div style={{ fontFamily: T.display, fontSize: 28, fontWeight: 600, letterSpacing: -0.5 }}>Ludo</div>
              <div style={{ fontSize: 12, color: T.inkDim, marginTop: 4, lineHeight: 1.4 }}>Race four pawns home. Roll a six to start.</div>
              <div style={{ marginTop: 12 }}>
                <Btn primary small>Play Ludo →</Btn>
              </div>
            </div>
          </div>
        </div>

        {/* S&L card */}
        <div style={{ position: 'relative', padding: 20, borderRadius: 28, background: 'linear-gradient(160deg, rgba(46, 157, 79, .25), rgba(245, 184, 0, .18))', border: '1px solid rgba(255,255,255,.14)', boxShadow: T.shadowSm, overflow: 'hidden' }}>
          <Corner size={50} color={T.goldHi} style={{ position: 'absolute', top: 8, left: 8, opacity: .55 }} />
          <Corner size={50} color={T.goldHi} flip="scaleX(-1)" style={{ position: 'absolute', top: 8, right: 8, opacity: .55 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <MiniSnakesBoard size={108} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: T.goldHi, textTransform: 'uppercase', marginBottom: 4 }}>10×10 · 2–4 players</div>
              <div style={{ fontFamily: T.display, fontSize: 26, fontWeight: 600, letterSpacing: -0.5 }}>Snakes & Ladders</div>
              <div style={{ fontSize: 12, color: T.inkDim, marginTop: 4, lineHeight: 1.4 }}>Climb up. Slide down. First to 100 wins.</div>
              <div style={{ marginTop: 12 }}>
                <Btn small>Play S&amp;L →</Btn>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 22, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.inkFaint }}>
          <span>↺ Continue last game</span>
          <span>How to play</span>
        </div>
      </div>
    </Phone>
  );
}

function MiniLudoBoard({ size = 110 }) {
  // Tiny stylized ludo — 4 corners + center cross
  const s = size;
  const corner = (bg, x, y) => (
    <div style={{ position: 'absolute', left: x, top: y, width: s * 0.4, height: s * 0.4, background: bg, borderRadius: 8, border: '1.5px solid rgba(0,0,0,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '60%', height: '60%', background: '#fff7e1', borderRadius: 4, display: 'grid', gridTemplate: '1fr 1fr / 1fr 1fr', gap: 2, padding: 2 }}>
        <div style={{ background: bg, borderRadius: '50%' }} /><div style={{ background: bg, borderRadius: '50%' }} />
        <div style={{ background: bg, borderRadius: '50%' }} /><div style={{ background: bg, borderRadius: '50%' }} />
      </div>
    </div>
  );
  return (
    <div style={{ width: s, height: s, position: 'relative', background: T.bgBoard, borderRadius: 10, border: `2px solid ${T.goldDeep}`, boxShadow: 'inset 0 0 0 2px #fff7e1, 0 4px 10px rgba(0,0,0,.3)' }}>
      {corner(T.pRed, 0, 0)}
      {corner(T.pGreen, s * 0.6, 0)}
      {corner(T.pYellow, s * 0.6, s * 0.6)}
      {corner(T.pBlue, 0, s * 0.6)}
      {/* center cross */}
      <div style={{ position: 'absolute', left: s * 0.4, top: 0, width: s * 0.2, height: s, background: '#fff7e1' }} />
      <div style={{ position: 'absolute', top: s * 0.4, left: 0, height: s * 0.2, width: s, background: '#fff7e1' }} />
      {/* center triangle */}
      <div style={{ position: 'absolute', left: s * 0.4, top: s * 0.4, width: s * 0.2, height: s * 0.2, background: `conic-gradient(from 45deg, ${T.pRed} 0 25%, ${T.pGreen} 0 50%, ${T.pYellow} 0 75%, ${T.pBlue} 0)` }} />
    </div>
  );
}

function MiniSnakesBoard({ size = 110 }) {
  const cells = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
    cells.push(<div key={r+'-'+c} style={{ background: (r+c)%2 ? '#fff7e1' : '#f5deaa' }} />);
  }
  return (
    <div style={{ width: size, height: size, position: 'relative', borderRadius: 10, border: `2px solid ${T.goldDeep}`, overflow: 'hidden', boxShadow: 'inset 0 0 0 2px #fff7e1, 0 4px 10px rgba(0,0,0,.3)' }}>
      <div style={{ display: 'grid', gridTemplate: 'repeat(6, 1fr) / repeat(6, 1fr)', width: '100%', height: '100%' }}>{cells}</div>
      {/* a snake */}
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <path d="M15,18 Q40,30 30,55 T70,82" stroke={T.snake} strokeWidth="3.5" fill="none" strokeLinecap="round"/>
        <circle cx="15" cy="18" r="3" fill={T.snake}/>
        {/* a ladder */}
        <line x1="65" y1="20" x2="80" y2="70" stroke={T.ladder} strokeWidth="2.5"/>
        <line x1="72" y1="18" x2="87" y2="68" stroke={T.ladder} strokeWidth="2.5"/>
        <line x1="66" y1="30" x2="74" y2="33" stroke={T.ladder} strokeWidth="1.8"/>
        <line x1="65" y1="45" x2="73" y2="48" stroke={T.ladder} strokeWidth="1.8"/>
        <line x1="64" y1="60" x2="72" y2="63" stroke={T.ladder} strokeWidth="1.8"/>
      </svg>
    </div>
  );
}

function ModeSelectScreen() {
  return (
    <Phone>
      <StatusBar />
      <Header title="Game Mode" subtitle="Step 1 of 2" />

      <div style={{ padding: '8px 22px' }}>
        <div style={{ fontFamily: T.display, fontSize: 26, fontWeight: 600, lineHeight: 1.1 }}>How will you play?</div>
        <div style={{ color: T.inkDim, fontSize: 13, marginTop: 4, marginBottom: 24 }}>Pick a mode. You can change this later.</div>

        {/* Pass and play card (selected) */}
        <div style={{ position: 'relative', padding: 18, borderRadius: 24, background: `linear-gradient(135deg, ${T.gold}, #d99100)`, color: '#3a1f00', marginBottom: 14, boxShadow: '0 10px 30px rgba(245, 184, 0, .35)' }}>
          <div style={{ position: 'absolute', top: 16, right: 16, width: 26, height: 26, borderRadius: 13, background: '#3a1f00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3.5" stroke={T.goldHi} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(58,31,0,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="11" cy="13" r="4" stroke="#3a1f00" strokeWidth="2"/><circle cx="22" cy="13" r="4" stroke="#3a1f00" strokeWidth="2"/><path d="M5 26c0-3 3-5 6-5s6 2 6 5M16 26c0-3 3-5 6-5s6 2 6 5" stroke="#3a1f00" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 700 }}>Pass &amp; Play</div>
              <div style={{ fontSize: 13, opacity: 0.78, marginTop: 4, lineHeight: 1.4 }}>Friends and family on one device. Hand it around when it's your turn.</div>
              <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                {['2','3','4'].map(n => <span key={n} style={{ fontSize: 11, padding: '4px 9px', borderRadius: 999, background: 'rgba(58,31,0,.15)', fontWeight: 700 }}>{n} players</span>)}
              </div>
            </div>
          </div>
        </div>

        {/* Vs computer */}
        <div style={{ position: 'relative', padding: 18, borderRadius: 24, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', marginBottom: 14 }}>
          <div style={{ position: 'absolute', top: 16, right: 16, width: 26, height: 26, borderRadius: 13, border: '1.5px solid rgba(255,255,255,.25)' }} />
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(46, 157, 79, .2)', border: '1px solid rgba(46, 157, 79, .35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="30" height="30" viewBox="0 0 32 32" fill="none"><rect x="6" y="9" width="20" height="16" rx="3" stroke={T.pGreen} strokeWidth="2"/><circle cx="12" cy="16" r="1.5" fill={T.pGreen}/><circle cx="20" cy="16" r="1.5" fill={T.pGreen}/><path d="M16 4v5M11 25l-2 4M21 25l2 4" stroke={T.pGreen} strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 600 }}>Vs Computer</div>
              <div style={{ fontSize: 13, color: T.inkDim, marginTop: 4, lineHeight: 1.4 }}>Solo play with up to 3 AI opponents. Choose difficulty.</div>
              <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                {['Easy','Normal','Hard'].map((n,i) => <span key={n} style={{ fontSize: 11, padding: '4px 9px', borderRadius: 999, background: i===1 ? 'rgba(46, 157, 79, .25)' : 'rgba(255,255,255,.06)', color: i===1 ? T.ink : T.inkDim, fontWeight: 600 }}>{n}</span>)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 50, left: 22, right: 22 }}>
          <Btn primary style={{ width: '100%' }}>Continue →</Btn>
        </div>
      </div>
    </Phone>
  );
}

function PlayerSetupScreen() {
  const players = [
    { name: 'Aarav', color: T.pRed, label: 'A', you: true },
    { name: 'Diya', color: T.pGreen, label: 'D' },
    { name: 'Add player', color: '#555', label: '+', empty: true },
    { name: 'Add player', color: '#555', label: '+', empty: true },
  ];
  return (
    <Phone>
      <StatusBar />
      <Header title="Players" subtitle="Step 2 of 2" />

      <div style={{ padding: '8px 22px' }}>
        <div style={{ fontFamily: T.display, fontSize: 26, fontWeight: 600, lineHeight: 1.1 }}>Who's playing?</div>
        <div style={{ color: T.inkDim, fontSize: 13, marginTop: 4, marginBottom: 22 }}>Tap to add. Pick names &amp; colors.</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {players.map((p, i) => (
            <div key={i} style={{
              padding: '20px 14px', borderRadius: 22,
              background: p.empty ? 'rgba(255,255,255,.04)' : `linear-gradient(155deg, ${p.color}38, ${p.color}10)`,
              border: p.empty ? '1.5px dashed rgba(255,255,255,.18)' : `1px solid ${p.color}55`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              position: 'relative',
            }}>
              {p.you && <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, padding: '2px 7px', borderRadius: 8, background: T.gold, color: '#3a1f00', fontWeight: 800, letterSpacing: 0.6 }}>YOU</div>}
              <Avatar color={p.color} label={p.label} size={56} ring={!p.empty}/>
              <div style={{ fontSize: 14, fontWeight: 600, color: p.empty ? T.inkFaint : T.ink }}>{p.name}</div>
              {!p.empty && (
                <div style={{ display: 'flex', gap: 5 }}>
                  {[T.pRed, T.pGreen, T.pYellow, T.pBlue].map(c => (
                    <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c, border: c === p.color ? '2px solid #fff' : '1px solid rgba(255,255,255,.2)' }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22, padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.10)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,184,0,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1l2.5 5 5.5.8-4 3.9 1 5.5L9 13.6 4 16.2l1-5.5-4-3.9 5.5-.8z" stroke={T.gold} strokeWidth="1.4" fill="rgba(245,184,0,.2)"/></svg>
          </div>
          <div style={{ flex: 1, fontSize: 12, color: T.inkDim, lineHeight: 1.4 }}>
            <span style={{ color: T.ink, fontWeight: 600 }}>Classic rules.</span> Need a 6 to start. Capture sends home. Exact roll to finish.
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 50, left: 22, right: 22 }}>
          <Btn primary style={{ width: '100%' }}>Roll the dice →</Btn>
        </div>
      </div>
    </Phone>
  );
}

function HowToPlayScreen() {
  return (
    <Phone>
      <StatusBar />
      <Header title="How to Play" subtitle="Ludo · Quick rules" />

      <div style={{ padding: '8px 22px 80px' }}>
        <div style={{ fontFamily: T.display, fontSize: 28, fontWeight: 600, marginBottom: 4 }}>Six steps to victory.</div>
        <div style={{ color: T.inkDim, fontSize: 13, marginBottom: 22 }}>The classic Indian board, modern rules.</div>

        {[
          { n: '1', t: 'Roll a six', d: 'You need a 6 to bring a pawn out of your yard.', c: T.pRed },
          { n: '2', t: 'Move clockwise', d: 'Pawns travel the outer track in a clockwise loop.', c: T.pBlue },
          { n: '3', t: 'Capture', d: 'Land on a rival to send them back to their yard.', c: T.pGreen },
          { n: '4', t: 'Star squares', d: 'Safe — no captures here. Take a breath.', c: T.gold },
          { n: '5', t: 'Home stretch', d: 'Turn into your colored lane near the finish.', c: T.saffron },
          { n: '6', t: 'Exact roll', d: 'You need an exact roll to seat your last pawn.', c: T.pYellow },
        ].map(r => (
          <div key={r.n} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: `${r.c}25`, color: r.c, border: `1px solid ${r.c}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.display, fontWeight: 700, fontSize: 18, flexShrink: 0 }}>{r.n}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{r.t}</div>
              <div style={{ fontSize: 13, color: T.inkDim, marginTop: 2, lineHeight: 1.4 }}>{r.d}</div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 24, padding: 16, borderRadius: 18, background: 'rgba(245, 184, 0, .10)', border: '1px solid rgba(245, 184, 0, .25)' }}>
          <div style={{ fontSize: 12, color: T.gold, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>Rolling a six</div>
          <div style={{ fontSize: 13, color: T.inkDim, lineHeight: 1.5 }}>
            Six gives you another roll. Three sixes in a row? The turn ends with no move.
          </div>
        </div>
      </div>
    </Phone>
  );
}

function SettingsScreen() {
  const Row = ({ icon, title, sub, control, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' }}>
      <div style={{ width: 36, height: 36, borderRadius: 11, background: `${color}25`, color: color, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: T.inkDim, marginTop: 1 }}>{sub}</div>}
      </div>
      {control}
    </div>
  );
  const Toggle = ({ on }) => (
    <div style={{ width: 46, height: 28, borderRadius: 14, background: on ? T.gold : 'rgba(255,255,255,.16)', position: 'relative', flexShrink: 0, transition: '.2s' }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: 11, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }}/>
    </div>
  );
  const Chev = () => <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M1 1l6 6-6 6" stroke={T.inkFaint} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;

  return (
    <Phone>
      <StatusBar />
      <Header title="Settings" />

      <div style={{ padding: '8px 18px 60px' }}>
        <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.inkFaint, padding: '8px 12px 6px' }}>Audio &amp; Motion</div>
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, overflow: 'hidden' }}>
          <Row color={T.gold} icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 7v4h3l4 4V3L6 7H3z" fill="currentColor"/><path d="M13 6c1.5 1 1.5 5 0 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>} title="Sound effects" sub="Dice, captures, victory" control={<Toggle on/>} />
          <div style={{ height: 1, background: 'rgba(255,255,255,.05)', marginLeft: 66 }}/>
          <Row color={T.saffron} icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1v3M9 14v3M1 9h3M14 9h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><circle cx="9" cy="9" r="3.5" fill="currentColor"/></svg>} title="Animations" sub="Smooth piece movement" control={<Toggle on/>} />
          <div style={{ height: 1, background: 'rgba(255,255,255,.05)', marginLeft: 66 }}/>
          <Row color={T.pBlue} icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2C5 2 2 5 2 9s3 7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M14 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>} title="Vibration" sub="Subtle haptic feedback" control={<Toggle on={false}/>} />
        </div>

        <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.inkFaint, padding: '20px 12px 6px' }}>Game</div>
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, overflow: 'hidden' }}>
          <Row color={T.pGreen} icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="6" cy="6" r="1.2" fill="currentColor"/><circle cx="10" cy="10" r="1.2" fill="currentColor"/></svg>} title="Dice style" sub="Classic ivory" control={<Chev/>} />
          <div style={{ height: 1, background: 'rgba(255,255,255,.05)', marginLeft: 66 }}/>
          <Row color={T.pRed} icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/><path d="M9 5v4l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>} title="Animation speed" sub="Normal" control={<Chev/>} />
          <div style={{ height: 1, background: 'rgba(255,255,255,.05)', marginLeft: 66 }}/>
          <Row color={T.pYellow} icon={<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5z" fill="currentColor" opacity=".25" stroke="currentColor" strokeWidth="1.4"/></svg>} title="Theme" sub="Festive · Default" control={<Chev/>} />
        </div>

        <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: T.inkFaint, padding: '20px 12px 6px' }}>Records</div>
        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 18, padding: 16, display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          {[['Games','142'],['Wins','58'],['Streak','4']].map(([k,v]) => (
            <div key={k}>
              <div style={{ fontFamily: T.display, fontSize: 24, fontWeight: 700, color: T.goldHi }}>{v}</div>
              <div style={{ fontSize: 11, color: T.inkDim, letterSpacing: 1, textTransform: 'uppercase' }}>{k}</div>
            </div>
          ))}
        </div>
      </div>
    </Phone>
  );
}

function WinScreen() {
  return (
    <Phone>
      <StatusBar />

      {/* festive glow */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 30%, rgba(245,184,0,.25), transparent 55%)' }} />
      <Mandala size={520} color={T.gold} opacity={0.16} style={{ position: 'absolute', top: -110, left: -110 }} />

      {/* confetti dots */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 390 844">
        {Array.from({ length: 36 }).map((_, i) => {
          const x = (i * 37 + 11) % 390;
          const y = (i * 53 + 23) % 500;
          const colors = [T.pRed, T.pGreen, T.pBlue, T.gold, T.saffron];
          const c = colors[i % colors.length];
          const size = 4 + (i % 3) * 2;
          return <rect key={i} x={x} y={y} width={size} height={size*1.6} rx={1} fill={c} transform={`rotate(${i*23} ${x} ${y})`} opacity="0.85" />;
        })}
      </svg>

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 100 }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: T.gold, textTransform: 'uppercase', fontWeight: 700 }}>Victory</div>
        <div style={{ fontFamily: T.display, fontSize: 56, fontWeight: 700, color: T.goldHi, lineHeight: 1.15, marginTop: 6, textShadow: '0 6px 20px rgba(0,0,0,.5)' }}>Aarav wins!</div>
        <div style={{ marginTop: 10, fontSize: 14, color: T.inkDim }}>brought all four pawns home in 38 turns</div>

        {/* trophy */}
        <div style={{ marginTop: 36, position: 'relative' }}>
          <div style={{ width: 150, height: 150, borderRadius: '50%', background: `radial-gradient(circle, ${T.goldHi}, ${T.goldDeep})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 60px rgba(245,184,0,.55), inset 0 5px 0 rgba(255,255,255,.5), inset 0 -8px 0 rgba(0,0,0,.2)' }}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <path d="M22 12h36v18c0 12-8 22-18 22s-18-10-18-22V12z" fill="#fff5d8" stroke="#3a1f00" strokeWidth="2"/>
              <path d="M22 18h-6c-3 0-5 2-5 5 0 6 5 11 11 11" stroke="#3a1f00" strokeWidth="2" fill="none"/>
              <path d="M58 18h6c3 0 5 2 5 5 0 6-5 11-11 11" stroke="#3a1f00" strokeWidth="2" fill="none"/>
              <rect x="32" y="52" width="16" height="6" fill="#3a1f00"/>
              <rect x="26" y="58" width="28" height="6" rx="1" fill="#3a1f00"/>
              <path d="M36 28l3 5 5 1-3.5 3.5 1 5-4.5-2.5-4.5 2.5 1-5L30 34l5-1 3-5z" fill={T.gold}/>
            </svg>
          </div>
        </div>

        {/* podium */}
        <div style={{ marginTop: 44, display: 'flex', gap: 20, alignItems: 'flex-end' }}>
          {[
            { rank: 2, color: T.pGreen, label: 'D', name: 'Diya', h: 70 },
            { rank: 1, color: T.pRed, label: 'A', name: 'Aarav', h: 100 },
            { rank: 3, color: T.pBlue, label: 'R', name: 'Rohan', h: 50 },
          ].map(p => (
            <div key={p.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Avatar color={p.color} label={p.label} size={p.rank===1?56:42} ring={p.rank===1}/>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</div>
              <div style={{ width: 56, height: p.h, borderRadius: '8px 8px 0 0', background: p.rank===1 ? `linear-gradient(180deg, ${T.goldHi}, ${T.gold})` : 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8, fontFamily: T.display, fontSize: 22, fontWeight: 700, color: p.rank===1 ? '#3a1f00' : T.ink }}>
                {p.rank}
              </div>
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', bottom: 50, left: 22, right: 22, display: 'flex', gap: 10 }}>
          <Btn ghost style={{ flex: 1 }}>Home</Btn>
          <Btn primary style={{ flex: 2 }}>Play again</Btn>
        </div>
      </div>
    </Phone>
  );
}

Object.assign(window, { SplashScreen, GameSelectScreen, ModeSelectScreen, PlayerSetupScreen, HowToPlayScreen, SettingsScreen, WinScreen, MiniLudoBoard, MiniSnakesBoard });
