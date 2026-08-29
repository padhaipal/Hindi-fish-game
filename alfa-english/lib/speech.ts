// ---------------------------------------------------------------------------
// SPEECH — browser text-to-speech (Web Speech API), no audio files.
// ---------------------------------------------------------------------------
// The whole app speaks with the device's own voice. We prefer an Indian-English
// voice (en-IN) for a familiar accent, then British, then any English one.
//
// TTS is reliable for whole WORDS ("apple", "cat") but poor at bare phonemes, so
// the games always speak real words, never an isolated "/a/".
// ---------------------------------------------------------------------------

let cachedVoice: SpeechSynthesisVoice | null = null;

function synth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

function chooseVoice(): SpeechSynthesisVoice | null {
  const s = synth();
  if (!s) return null;
  const vs = s.getVoices();
  if (!vs.length) return null;
  const pick = (p: string) => vs.find((v) => v.lang && v.lang.toLowerCase().startsWith(p));
  return pick("en-in") || pick("en-gb") || pick("en-au") || pick("en") || vs[0] || null;
}

function refreshVoice() {
  cachedVoice = chooseVoice();
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  refreshVoice();
  // Voices often load asynchronously; grab the best one when they arrive.
  window.speechSynthesis.onvoiceschanged = refreshVoice;
}

export interface SayOpts {
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
}

// Speak `text`. Cancels anything currently playing so prompts never pile up.
export function say(text: string, opts: SayOpts = {}): void {
  const s = synth();
  if (!s) {
    opts.onEnd?.();
    return;
  }
  s.cancel();
  if (!cachedVoice) refreshVoice();
  const u = new SpeechSynthesisUtterance(text);
  if (cachedVoice) u.voice = cachedVoice;
  u.lang = cachedVoice?.lang || "en-IN";
  u.rate = opts.rate ?? 0.85; // a little slow for young learners
  u.pitch = opts.pitch ?? 1.05;
  if (opts.onEnd) u.onend = () => opts.onEnd!();
  // Chrome sometimes pauses the queue; nudge it awake.
  try {
    s.resume();
  } catch {
    /* ignore */
  }
  s.speak(u);
}

export function stopSpeech(): void {
  synth()?.cancel();
}

// Call inside the first user gesture (a tap) so later programmatic speech is
// allowed on strict mobile browsers.
export function primeSpeech(): void {
  const s = synth();
  if (!s) return;
  refreshVoice();
  try {
    const u = new SpeechSynthesisUtterance("");
    u.volume = 0;
    s.speak(u);
  } catch {
    /* ignore */
  }
}
