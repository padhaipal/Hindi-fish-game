// Plays a lesson step's sounds in order: bundled recordings where we have
// them, and the phone's Hindi text-to-speech for everything else.
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import type { Sound } from "./manifest";

let current: HTMLAudioElement | null = null;
let generation = 0;

function playFile(src: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(src);
    current = audio;
    audio.onended = () => resolve();
    audio.onerror = () => resolve(); // a missing file never blocks the lesson
    audio.play().catch(() => resolve());
  });
}

async function say(text: string): Promise<void> {
  try {
    await TextToSpeech.speak({ text, lang: "hi-IN", rate: 0.9 });
  } catch {
    // No Hindi voice on this phone: the words are on screen anyway.
  }
}

// Resolves when every sound has played, or when stopSounds() cuts it short.
export async function playSounds(sounds: Sound[]): Promise<void> {
  stopSounds();
  const mine = ++generation;
  for (const s of sounds) {
    if (mine !== generation) return;
    if ("src" in s) await playFile(s.src);
    else await say(s.say);
  }
}

export function stopSounds() {
  generation++;
  current?.pause();
  current = null;
  void TextToSpeech.stop().catch(() => {});
}

export function playEffect(name: "clap" | "wrong") {
  void new Audio(name === "clap" ? "media/audio/clap.mp3" : "media/audio/wrong-baap.mp3")
    .play()
    .catch(() => {});
}
