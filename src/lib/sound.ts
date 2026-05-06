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

// Dice tumble: short burst of band-passed noise with a tumbling gain envelope.
export function playDice() {
  if (!enabled) return;
  const ac = getCtx();
  if (!ac) return;

  const duration = 0.6;
  const buffer = ac.createBuffer(1, ac.sampleRate * duration, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const noise = ac.createBufferSource();
  noise.buffer = buffer;

  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800;
  bp.Q.value = 1.2;

  const gain = ac.createGain();
  const now = ac.currentTime;
  // Tumble envelope — choppy bumps then decay
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.15, now + 0.15);
  gain.gain.linearRampToValueAtTime(0.35, now + 0.25);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.4);
  gain.gain.linearRampToValueAtTime(0.25, now + 0.5);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(bp);
  bp.connect(gain);
  gain.connect(ac.destination);
  noise.start(now);
  noise.stop(now + duration);
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
