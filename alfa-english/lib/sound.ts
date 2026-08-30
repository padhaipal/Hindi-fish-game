// ---------------------------------------------------------------------------
// SOUND — plays the ALfA letter SOUNDS and words.
// ---------------------------------------------------------------------------
// The phonics method needs the letter's SOUND (/a/, /b/, /k/ ...), but browser
// text-to-speech can only say letter NAMES or whole words — never a clean bare
// phoneme. So this layer prefers REAL recorded audio when available and falls
// back to TTS (speaking the picture-word) until those files are added.
//
// To enable real sounds, drop files in:
//   public/audio/sounds/<letter>.mp3   — the pure sound, e.g. a.mp3 = /a/
//   public/audio/words/<word>.mp3      — a whole word, e.g. apple.mp3 (optional)
// then add the ids/words to the sets below (or ask me to switch them on).
// ---------------------------------------------------------------------------
import { say, stopSpeech } from "./speech";
import { getLetter } from "./letters";

// Letters that have a real /audio/sounds/<id>.mp3 phoneme recording.
// All 26 letter sounds are recorded, so the games speak the real sounds.
export const SOUND_FILES = new Set<string>([
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
  "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
]);

// Words that have a real /audio/words/<word>.mp3 recording.
export const WORD_FILES = new Set<string>([]);

const cache = new Map<string, HTMLAudioElement>();

function playFile(src: string, onEnd?: () => void): void {
  try {
    let a = cache.get(src);
    if (!a) {
      a = new Audio(src);
      cache.set(src, a);
    }
    a.onended = onEnd ?? null;
    a.currentTime = 0;
    void a.play().catch(() => onEnd?.());
  } catch {
    onEnd?.();
  }
}

// Applause when a level is won.
export function playApplause(): void {
  playFile("/audio/clap.mp3");
}

// The "wah wah wah" sad sound when a level is lost.
export function playLose(): void {
  playFile("/audio/wa-wa-wa.mp3");
}

export function stopAll(): void {
  stopSpeech();
  cache.forEach((a) => {
    try {
      a.pause();
    } catch {
      /* ignore */
    }
  });
}

// Speak a letter's SOUND. Real phoneme file if present; otherwise TTS says the
// picture-word (browser TTS can't voice a bare phoneme).
export function speakLetterSound(letterId: string, onEnd?: () => void): void {
  if (SOUND_FILES.has(letterId)) {
    playFile(`/audio/sounds/${letterId}.mp3`, onEnd);
  } else {
    say(getLetter(letterId).word, { onEnd });
  }
}

// Speak a whole WORD (picture-word or CVC word). Real file if present, else TTS.
export function speakWord(word: string, onEnd?: () => void): void {
  if (WORD_FILES.has(word)) {
    playFile(`/audio/words/${word}.mp3`, onEnd);
  } else {
    say(word, { onEnd });
  }
}

// The ALfA intro "combo": the picture-word, then its first SOUND
// ("apple … /a/"). Until a real phoneme file exists, this is just the word.
export function speakCombo(letterId: string): void {
  const l = getLetter(letterId);
  speakWord(l.word, () => {
    if (SOUND_FILES.has(letterId)) playFile(`/audio/sounds/${letterId}.mp3`);
  });
}
