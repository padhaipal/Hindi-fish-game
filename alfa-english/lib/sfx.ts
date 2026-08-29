// ---------------------------------------------------------------------------
// SFX — tiny WebAudio blips for game feedback (no audio files).
// ---------------------------------------------------------------------------
// Short, synthesised tones for right / wrong / win / tap, so the games feel
// responsive without waiting on speech. Everything is generated on the fly.
// ---------------------------------------------------------------------------

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", peak = 0.16): void {
  const c = ac();
  if (!c) return;
  const t0 = c.currentTime + start;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

// A bright rising two-note "correct!".
export function dingCorrect(): void {
  tone(660, 0, 0.12, "triangle");
  tone(990, 0.1, 0.16, "triangle");
}

// A short low "try again" buzz.
export function buzzWrong(): void {
  tone(180, 0, 0.22, "sawtooth", 0.12);
}

// A happy little arpeggio for finishing a level.
export function chimeWin(): void {
  [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.22, "triangle"));
}

// A soft tap tick.
export function tick(): void {
  tone(440, 0, 0.05, "sine", 0.08);
}

// Warm up the audio context inside a user gesture.
export function unlockSfx(): void {
  ac();
}
