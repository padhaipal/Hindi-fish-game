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

// Play a short tone as a fallback. `kind` shapes the tone so "correct" sounds
// cheerful (higher) and "wrong" sounds soft/low (a gentle "baaap").
function playFallbackTone(kind: "correct" | "wrong"): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (kind === "correct") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(990, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } else {
      // Soft low "baaap" buzz.
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.31);
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
  kind: "correct" | "wrong",
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
