// ---------------------------------------------------------------------------
// TTS — speak short Devanagari syllables with the phone's Hindi voice.
// ---------------------------------------------------------------------------
// The matra games say syllables like "का", "की", "कू". Recording every
// consonant × matra combination is impractical, so these use the browser's
// built-in text-to-speech (hi-IN). Most Android phones have a Hindi voice; iOS
// has one too. Where no Hindi voice exists the call is simply silent (the game
// still shows the syllable), so nothing breaks.
// ---------------------------------------------------------------------------

function synth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

function hindiVoice(): SpeechSynthesisVoice | null {
  const s = synth();
  if (!s) return null;
  const voices = s.getVoices();
  return (
    voices.find((v) => v.lang === "hi-IN") ??
    voices.find((v) => v.lang.startsWith("hi")) ??
    // Indian English reads Devanagari better than a US English voice.
    voices.find((v) => v.lang === "en-IN") ??
    null
  );
}

// Browsers load the voice list lazily and only allow audio after a user
// gesture. Call this from the first tap ("Play").
export function primeTts(): void {
  const s = synth();
  if (!s) return;
  try {
    s.getVoices();
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    s.speak(u);
  } catch {
    /* ignore */
  }
}

export function stopTts(): void {
  const s = synth();
  if (s) {
    try {
      s.cancel();
    } catch {
      /* ignore */
    }
  }
}

// Speak one syllable / short word. `onEnd` fires when it finishes (or, if there
// is no voice, after a short pause so callers can still sequence).
export function speakSyllable(text: string, onEnd?: () => void): void {
  const s = synth();
  if (!s) {
    window.setTimeout(() => onEnd?.(), 500);
    return;
  }
  try {
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "hi-IN";
    const v = hindiVoice();
    if (v) u.voice = v;
    u.rate = 0.8; // a touch slow and clear for young learners
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onEnd?.();
    };
    u.onend = finish;
    u.onerror = finish;
    // Safety net for browsers that never fire onend.
    window.setTimeout(finish, 1600);
    s.speak(u);
  } catch {
    window.setTimeout(() => onEnd?.(), 400);
  }
}
