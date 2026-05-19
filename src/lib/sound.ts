// WebAudio synthesized sound effects. No assets — all generated on-the-fly.
// AudioContext is lazy-created on first user gesture (mobile autoplay policy).
//
// iOS Safari quirk: the *first* WebAudio interaction must happen inside a
// user gesture event handler, AND the context must be fully resumed (not
// just created) before any oscillator will produce sound. Calling
// `playDice()` from a tap handler isn't always sufficient because
// `resume()` is async — the gesture can end before the promise settles.
//
// Fix: install global touchstart/click listeners that proactively unlock
// the context the moment the user touches *anywhere* (splash tap, menu
// click, etc.), well before they get to the dice.

let ctx: AudioContext | null = null;
let enabled = true;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

// Play a silent 1-sample buffer and call resume() — together this is the
// most reliable way to flip iOS Safari's audio state to "running".
function unlockAudio() {
  if (unlocked) return;
  const ac = getCtx();
  if (!ac) return;
  try {
    const buffer = ac.createBuffer(1, 1, 22050);
    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.connect(ac.destination);
    source.start(0);
  } catch {
    // ignore — some browsers throw if the context isn't ready yet
  }
  if (ac.state === 'suspended') void ac.resume();
  if (ac.state === 'running') unlocked = true;
}

if (typeof window !== 'undefined') {
  const events: Array<keyof DocumentEventMap> = ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'];
  const onFirstInteraction = () => {
    unlockAudio();
    if (unlocked) {
      events.forEach(e => document.removeEventListener(e, onFirstInteraction, true));
    }
  };
  // Capture phase + passive so we run before button handlers and don't block scrolling.
  events.forEach(e => document.addEventListener(e, onFirstInteraction, { passive: true, capture: true }));
}

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

export function isSoundEnabled() {
  return enabled;
}

// Dice clatter: a small cluster of bandpass-noise "tocks" pitched at
// different frequencies, scattered across ~0.5s. Each tock has a slight
// pitch drop (the dice losing energy as it tumbles) and the louder hits
// also fire a short low-end sine "thump" so they feel like physical
// dice landing on the board, not just dry clicks. No chime — the last
// tock is the settle.
export function playDice() {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  const start = ac.currentTime;
  const ticks: Array<{ t: number; freq: number; gain: number; dur: number; body: boolean }> = [
    { t: 0.00, freq: 1300, gain: 0.34, dur: 0.07, body: true  },
    { t: 0.10, freq: 950,  gain: 0.30, dur: 0.07, body: true  },
    { t: 0.22, freq: 1500, gain: 0.28, dur: 0.06, body: false },
    { t: 0.38, freq: 850,  gain: 0.24, dur: 0.07, body: true  },
    { t: 0.54, freq: 1100, gain: 0.18, dur: 0.06, body: false },
  ];
  ticks.forEach(({ t, freq, gain: g, dur, body }) => {
    const at = start + t;
    // Wooden tock: bandpass-filtered noise burst.
    const buf = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * dur)), ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ac.createBufferSource();
    noise.buffer = buf;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(freq, at);
    bp.frequency.exponentialRampToValueAtTime(freq * 0.7, at + dur);
    bp.Q.value = 4.5;
    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(0, at);
    noiseGain.gain.linearRampToValueAtTime(g, at + 0.004);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, at + dur);
    noise.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(ac.destination);
    noise.start(at);
    noise.stop(at + dur);

    if (body) {
      // Low-frequency thump under the louder tocks — gives the dice
      // physical weight without adding a tonal note.
      const osc = ac.createOscillator();
      const oscGain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, at);
      osc.frequency.exponentialRampToValueAtTime(80, at + 0.04);
      oscGain.gain.setValueAtTime(0, at);
      oscGain.gain.linearRampToValueAtTime(0.12, at + 0.003);
      oscGain.gain.exponentialRampToValueAtTime(0.001, at + 0.05);
      osc.connect(oscGain);
      oscGain.connect(ac.destination);
      osc.start(at);
      osc.stop(at + 0.06);
    }
  });
}

// Pawn move: soft tic — sine ping with quick decay.
export function playMove() {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const now = ac.currentTime;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(820, now);
  osc.frequency.exponentialRampToValueAtTime(560, now + 0.06);

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

// Capture: descending arpeggio, sawtooth + lowpass, slightly menacing.
export function playCapture() {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  const notes = [523.25, 392, 261.63]; // C5, G4, C4
  const start = ac.currentTime;
  const step = 0.085;
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1600;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, start + i * step);
    gain.gain.setValueAtTime(0, start + i * step);
    gain.gain.linearRampToValueAtTime(0.18, start + i * step + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + i * step + step);
    osc.connect(lp);
    lp.connect(gain);
    gain.connect(ac.destination);
    osc.start(start + i * step);
    osc.stop(start + i * step + step + 0.02);
  });
}

// Snake bite: descending slide with lowpass sweep.
export function playSnake() {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const now = ac.currentTime;
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(660, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.6);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.7);
}

// Ladder climb: ascending triangle arpeggio.
export function playLadder() {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  const notes = [261.63, 329.63, 392, 523.25];
  const start = ac.currentTime;
  const step = 0.08;
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start + i * step);
    gain.gain.setValueAtTime(0, start + i * step);
    gain.gain.linearRampToValueAtTime(0.18, start + i * step + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + i * step + step);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(start + i * step);
    osc.stop(start + i * step + step + 0.02);
  });
}

// Home arrival: short bell-like ascending triad (C5–E5–G5) — celebratory
// but lighter than playWin so it doesn't sound like the game is over.
export function playHomeArrival() {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  const start = ac.currentTime;
  const step = 0.07;
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start + i * step);
    gain.gain.setValueAtTime(0, start + i * step);
    gain.gain.linearRampToValueAtTime(0.22, start + i * step + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + i * step + 0.32);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(start + i * step);
    osc.stop(start + i * step + 0.36);
  });
}

// Win celebration: major arpeggio with soft attack.
export function playWin() {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  const notes = [261.63, 329.63, 392, 523.25, 659.25];
  const start = ac.currentTime;
  const step = 0.12;
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start + i * step);
    gain.gain.setValueAtTime(0, start + i * step);
    gain.gain.linearRampToValueAtTime(0.22, start + i * step + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, start + i * step + 0.5);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(start + i * step);
    osc.stop(start + i * step + 0.55);
  });
}

// Tap / button click — very subtle.
export function playTap() {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const now = ac.currentTime;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, now);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.05);
}
