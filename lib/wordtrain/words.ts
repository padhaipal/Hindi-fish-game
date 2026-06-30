// ---------------------------------------------------------------------------
// WORD TRAIN — WORD LIST
// ---------------------------------------------------------------------------
// Each word has a picture (emoji), a spoken-word audio, and its letters in
// order. The learner drags letter "coaches" onto the track to spell the word.
//
// Difficulty ramps by WORD LENGTH: the 2-letter words (reused from the Blocks
// game) come first, then 3-letter, then 4-letter words. Every word here uses
// ONLY the 8 practised letters (ब स प र त क च ल), each read as consonant + अ,
// the same convention as बस / कप. To add a word, drop its spoken-word mp3 in
// /public/audio/words and add an entry below — the game handles any length.
// ---------------------------------------------------------------------------

import { BLOCK_WORDS } from "@/lib/blocks/words";

export interface TrainWord {
  id: string;
  word: string; // Devanagari (shown only for reference / aria)
  letters: string[]; // letter ids from lib/letters.ts, in spelling order
  emoji: string; // the picture at the top of the screen
  audio: string; // spoken word (blended aloud when the train completes)
  label: string; // English meaning (developer-facing)
}

// 2-letter words — reuse the Blocks game's words + audio (no duplication).
export const TWO_LETTER_WORDS: TrainWord[] = BLOCK_WORDS.map((w) => ({
  id: w.id,
  word: w.word,
  letters: [...w.letters],
  emoji: w.emoji,
  audio: w.audio,
  label: w.label,
}));

// 3-letter words — new audio in /public/audio/words.
export const THREE_LETTER_WORDS: TrainWord[] = [
  { id: "baras", word: "बरस", letters: ["ba", "ra", "sa"], emoji: "🌧️", audio: "/audio/words/baras.mp3", label: "rain" },
  { id: "palak", word: "पलक", letters: ["pa", "la", "ka"], emoji: "👁️", audio: "/audio/words/palak.mp3", label: "eyelid" },
  { id: "sabak", word: "सबक", letters: ["sa", "ba", "ka"], emoji: "📖", audio: "/audio/words/sabak.mp3", label: "lesson" },
  { id: "rabar", word: "रबर", letters: ["ra", "ba", "ra"], emoji: "🧽", audio: "/audio/words/rabar.mp3", label: "eraser" },
];

// 4-letter words — new audio in /public/audio/words.
export const FOUR_LETTER_WORDS: TrainWord[] = [
  { id: "kasrat", word: "कसरत", letters: ["ka", "sa", "ra", "ta"], emoji: "🤸", audio: "/audio/words/kasrat.mp3", label: "exercise" },
  { id: "sarkas", word: "सरकस", letters: ["sa", "ra", "ka", "sa"], emoji: "🎪", audio: "/audio/words/sarkas.mp3", label: "circus" },
];

// All words (e.g. for tooling); the game itself uses buildSession() below.
export const TRAIN_WORDS: TrainWord[] = [
  ...TWO_LETTER_WORDS,
  ...THREE_LETTER_WORDS,
  ...FOUR_LETTER_WORDS,
];

// Pick `n` distinct random words from a pool.
function sample(pool: TrainWord[], n: number): TrainWord[] {
  const a = [...pool];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

// One session ramps from short to long: two 2-letter, two 3-letter, then both
// 4-letter words — so the child blends progressively harder words.
export function buildSession(): TrainWord[] {
  return [
    ...sample(TWO_LETTER_WORDS, 2),
    ...sample(THREE_LETTER_WORDS, 2),
    ...sample(FOUR_LETTER_WORDS, 2),
  ];
}
