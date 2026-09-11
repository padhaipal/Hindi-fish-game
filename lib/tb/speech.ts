// ---------------------------------------------------------------------------
// TB GAME — VOICE
// ---------------------------------------------------------------------------
// The game must be playable by someone who cannot read. Every line of the game
// can therefore be heard by tapping it, and each scene speaks itself when it
// opens.
//
// Two sources of voice, in order:
//   1. A recorded Hindi voice file, /audio/tb/<id>.mp3 — the real thing, to be
//      recorded with the tb.care Hindi script. Drop the files in and they are
//      used automatically.
//   2. The phone's own Hindi text-to-speech (hi-IN), used while those
//      recordings do not exist yet. It is not as warm as a real voice, but it
//      keeps the game fully playable today.
// ---------------------------------------------------------------------------

const cache = new Map<string, HTMLAudioElement>();
/** Voice ids we already know have no recording — don't try the file again. */
const missing = new Set<string>();

let current: HTMLAudioElement | null = null;
/** Bumped whenever speech is cancelled, so an old sequence stops stepping. */
let seqToken = 0;

// ---- who is speaking right now -------------------------------------------
// The game highlights the line being read, so a player following along can see
// which words they are hearing. Anything that wants to know subscribes here
// rather than having a callback threaded through every call.
type SpeakingListener = (id: string | null) => void;
const listeners = new Set<SpeakingListener>();
let speakingId: string | null = null;

function setSpeaking(id: string | null): void {
  if (speakingId === id) return;
  speakingId = id;
  for (const l of listeners) l(id);
}

/** Be told which line is being spoken. Returns an unsubscribe function. */
export function subscribeSpeaking(listener: SpeakingListener): () => void {
  listeners.add(listener);
  listener(speakingId);
  return () => {
    listeners.delete(listener);
  };
}

export function currentlySpeaking(): string | null {
  return speakingId;
}

function stopAll(): void {
  setSpeaking(null);
  if (current) {
    try {
      current.pause();
      current.currentTime = 0;
    } catch {
      /* ignore */
    }
    current = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function hindiVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === "hi-IN") ??
    voices.find((v) => v.lang.startsWith("hi")) ??
    // Indian English is a better fall-back for Devanagari than a US voice.
    voices.find((v) => v.lang === "en-IN") ??
    null
  );
}

/** Roughly how long this line takes to say aloud, in milliseconds. */
function readingTime(text: string): number {
  return Math.min(12000, 400 + text.length * 65);
}

function speakWithTts(text: string, onEnd?: () => void): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    // No speech engine at all: still pace the line, so the read-along
    // highlight walks through the words at reading speed instead of
    // flashing past. A player following the words can keep their place.
    window.setTimeout(() => onEnd?.(), readingTime(text));
    return;
  }
  const started = Date.now();
  const done = () => {
    // A phone with no Hindi voice installed says nothing and reports that it
    // finished instantly. Treat that as "silent" and pace it ourselves.
    const elapsed = Date.now() - started;
    const expected = readingTime(text);
    if (elapsed < Math.min(300, expected)) {
      window.setTimeout(() => onEnd?.(), expected - elapsed);
    } else {
      onEnd?.();
    }
  };
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "hi-IN";
    const v = hindiVoice();
    if (v) u.voice = v;
    u.rate = 0.9; // a little slower — this is health information
    u.onend = done;
    u.onerror = done;
    window.speechSynthesis.speak(u);
  } catch {
    done();
  }
}

// Wrap a callback so it fires exactly once — a line that never reports its end
// (some phone browsers) must not freeze a whole sequence.
function once(fn?: () => void): () => void {
  let done = false;
  return () => {
    if (done) return;
    done = true;
    fn?.();
  };
}

/** Speak one line without cancelling a running sequence. */
function speakLine(id: string, text: string, onEnd?: () => void): void {
  if (typeof window === "undefined") return;
  stopAll();
  const finish = once(() => {
    // Only un-highlight if nothing else has started speaking since.
    if (speakingId === id) setSpeaking(null);
    onEnd?.();
  });
  // Safety net: if nothing ever reports the end, move on anyway. It has to be
  // longer than readingTime() or it would cut the pacing short.
  window.setTimeout(finish, 3000 + text.length * 95);
  setSpeaking(id);

  const src = `/audio/tb/${id}.mp3`;
  if (missing.has(src)) {
    speakWithTts(text, finish);
    return;
  }

  let el = cache.get(src);
  if (!el) {
    el = new Audio(src);
    el.preload = "none";
    cache.set(src, el);
  }
  el.onended = () => finish();

  try {
    el.currentTime = 0;
    current = el;
    const p = el.play();
    if (p && typeof p.then === "function") {
      p.catch(() => {
        // No recording (or blocked) — remember, and let the phone read it out.
        missing.add(src);
        current = null;
        speakWithTts(text, finish);
      });
    }
  } catch {
    missing.add(src);
    speakWithTts(text, finish);
  }
}

/**
 * Say one line, cancelling anything already being said (including a sequence).
 * `id` names the recording (/audio/tb/<id>.mp3); `text` is the same line in
 * Hindi, spoken by the phone if that recording does not exist yet.
 */
export function speak(id: string, text: string, onEnd?: () => void): void {
  seqToken++;
  speakLine(id, text, onEnd);
}

/**
 * Read a whole screen out loud, one line after another: the scene, then each
 * choice. A player who cannot read hears everything without having to tap.
 */
export function speakSequence(
  lines: { id: string; text: string }[],
  onDone?: () => void
): void {
  const mine = ++seqToken;
  const step = (i: number): void => {
    if (mine !== seqToken) return;
    if (i >= lines.length) {
      onDone?.();
      return;
    }
    speakLine(lines[i].id, lines[i].text, () => {
      if (mine !== seqToken) return;
      window.setTimeout(() => step(i + 1), 400);
    });
  };
  step(0);
}

export function stopSpeaking(): void {
  seqToken++;
  stopAll();
}

/**
 * Browsers only load the voice list after a first call, and only allow audio
 * after a tap. Call this from the first tap of the game.
 */
export function primeVoice(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.getVoices();
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}
