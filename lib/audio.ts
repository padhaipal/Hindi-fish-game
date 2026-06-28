// ---------------------------------------------------------------------------
// AUDIO HELPER (with safe fallback)
// ---------------------------------------------------------------------------
// Plays sounds for the game. If an audio file is missing (for example the
// placeholder mp3s in /public/audio have not been recorded yet), we DO NOT
// crash or stay silent in a confusing way — instead we play a short synthesized
// tone using the Web Audio API so the game still gives audio feedback.
//
// This keeps the game fully playable even before real voice recordings exist.
// ---------------------------------------------------------------------------

// Cache of <audio> elements so we don't recreate them on every tap.
const audioCache = new Map<string, HTMLAudioElement>();

// Lazily-created shared AudioContext for the fallback beeps.
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

// The kinds of feedback the game can play. Each has a real audio file, and the
// fallback tone below is shaped to match its mood if that file is missing.
type SoundKind = "correct" | "wrong" | "win" | "lose";

// Play one note: a frequency glide from `f0` to `f1` over `dur` seconds,
// starting at `at` seconds from now.
function playNote(
  ctx: AudioContext,
  f0: number,
  f1: number,
  at: number,
  dur: number,
  type: OscillatorType,
  vol: number
): void {
  const t = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// Play a short tone (or little sequence) as a fallback when an audio file is
// missing. The shape matches the mood:
//   correct -> a cheerful upward "ding"
//   wrong   -> a soft low "baaap"
//   win     -> a happy rising 3-note arpeggio (stand-in for clapping)
//   lose    -> three falling "wa wa wa" tones (sad trombone)
function playFallbackTone(kind: SoundKind): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    if (kind === "correct") {
      playNote(ctx, 660, 990, 0, 0.22, "sine", 0.25);
    } else if (kind === "wrong") {
      playNote(ctx, 200, 120, 0, 0.28, "sawtooth", 0.18);
    } else if (kind === "win") {
      // C5 → E5 → G5, quick and bright.
      playNote(ctx, 523, 523, 0.0, 0.14, "triangle", 0.22);
      playNote(ctx, 659, 659, 0.13, 0.14, "triangle", 0.22);
      playNote(ctx, 784, 880, 0.26, 0.22, "triangle", 0.24);
    } else {
      // "wa wa wa" — three descending wobbly tones.
      playNote(ctx, 392, 330, 0.0, 0.22, "sawtooth", 0.18);
      playNote(ctx, 330, 277, 0.24, 0.22, "sawtooth", 0.18);
      playNote(ctx, 277, 196, 0.48, 0.34, "sawtooth", 0.18);
    }
  } catch {
    // Ignore — audio is a nice-to-have, never a blocker.
  }
}

// Wrap a callback so it can only ever fire once.
function once(fn?: () => void): () => void {
  let done = false;
  return () => {
    if (done) return;
    done = true;
    if (fn) fn();
  };
}

// Try to play a file; if it fails (missing/blocked), use the fallback tone.
// `onEnd` (optional) fires when the sound finishes — used by the game to keep
// the board "frozen" until the intro letter sound has finished playing. It is
// guaranteed to fire exactly once (on natural end, on fallback, or via a safety
// timeout) so the game never gets stuck waiting for audio.
export function playSound(
  src: string,
  kind: SoundKind,
  onEnd?: () => void
): void {
  if (typeof window === "undefined") {
    if (onEnd) onEnd();
    return;
  }

  const finish = once(onEnd);

  let el = audioCache.get(src);
  if (!el) {
    el = new Audio(src);
    el.preload = "auto";
    audioCache.set(src, el);
  }
  el.onended = () => finish();

  try {
    el.currentTime = 0;
    const playPromise = el.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise.catch(() => {
        playFallbackTone(kind);
        window.setTimeout(finish, 600);
      });
    }
    // Safety net: if "ended" never fires (some mobile browsers), unfreeze anyway.
    window.setTimeout(finish, 4000);
  } catch {
    playFallbackTone(kind);
    window.setTimeout(finish, 600);
  }
}

// Some browsers require a user gesture before audio can start. Call this once
// from the first tap/click to "unlock" the AudioContext.
export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {
      /* ignore */
    });
  }
}

// Convenience wrappers used by the game.
// `onEnd` lets callers (e.g. the frozen round intro) wait for the sound to end.
export function playLetterSound(audioPath: string, onEnd?: () => void): void {
  playSound(audioPath, "correct", onEnd);
}

export function playWrongSound(): void {
  playSound("/audio/wrong-baap.mp3", "wrong");
}

// Clapping/cheer when a level is won.
export function playWinSound(): void {
  playSound("/audio/clap.mp3", "win");
}

// Sad "wa wa wa" when a level is lost (timeout or too many wrong taps).
export function playLoseSound(): void {
  playSound("/audio/wa-wa-wa.mp3", "lose");
}

// Spoken "well done — go back to the app" message on the final finish screen.
export function playEndgameSound(): void {
  playSound("/audio/endgame-message.mp3", "win");
}

// Spoken word for the Blocks game (e.g. /audio/words/bus.mp3).
export function playWordSound(src: string): void {
  playSound(src, "correct");
}

// Stop a specific sound file if it is currently playing.
function stopSound(src: string): void {
  const el = audioCache.get(src);
  if (el) {
    try {
      el.pause();
      el.currentTime = 0;
    } catch {
      /* ignore */
    }
  }
}

// Stop the win (clap) and lose ("wa wa wa") sounds — called when the player taps
// a button to leave the level-complete / lost screen, so the sound doesn't carry
// over into the next level.
export function stopWinLoseSounds(): void {
  stopSound("/audio/clap.mp3");
  stopSound("/audio/wa-wa-wa.mp3");
}
