// ---------------------------------------------------------------------------
// LETTER VOICE — speak a letter, using its recording when one exists, else TTS.
// ---------------------------------------------------------------------------
// The 8 core letters (lib/letters LETTERS) have real voice recordings. The rest
// of the alphabet (vowels + the other consonants) don't, so we fall back to the
// phone's Hindi text-to-speech — exactly how the matra games already speak
// syllables. The per-letter adventures voice their TARGET letter through these
// helpers so every letter, recorded or not, is heard.
//
//   speakLetterName  — just the akshar sound   (क, आ …), for a correct tap/hop.
//   speakLetterWord  — the picture prompt      (word + letter), for the intro /
//                      the सुनो button.
// Both take an optional onEnd, honoured by both the recording and the TTS path,
// so callers that wait for the sound (e.g. a frozen round intro) still work.
// ---------------------------------------------------------------------------

import { getLetter, hasLetterRecording, letterWordAudio } from "@/lib/letters";
import { playLetterSound } from "@/lib/audio";
import { primeTts, speakSyllable } from "@/lib/tts";

export function speakLetterName(id: string, onEnd?: () => void): void {
  if (hasLetterRecording(id)) {
    playLetterSound(getLetter(id).audio, onEnd);
    return;
  }
  primeTts();
  speakSyllable(getLetter(id).char, onEnd);
}

export function speakLetterWord(id: string, onEnd?: () => void): void {
  if (hasLetterRecording(id)) {
    playLetterSound(letterWordAudio(id), onEnd);
    return;
  }
  primeTts();
  const l = getLetter(id);
  // Say the word then the letter, mirroring the "बत्तख़ … ब" recordings.
  speakSyllable(`${l.word}। ${l.char}`, onEnd);
}
