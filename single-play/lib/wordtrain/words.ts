// ---------------------------------------------------------------------------
// WORD TRAIN — WORD LIST (single-play)
// ---------------------------------------------------------------------------
// Difficulty ramps by WORD LENGTH: 2-letter words (reused from Blocks) first,
// then 3-letter, then 4-letter. Every word here can be spelled from the letter
// tiles in lib/letters.ts.
//
// NOTE: सड़क was dropped (needs ड़, which we don't have). अजगर, अदरक and थरमस
// are all here now that अ, ज and थ have been added to the alphabet.
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

// 3-letter words — audio in /audio/words.
export const THREE_LETTER_WORDS: TrainWord[] = [
  { id: "kamal", word: "कमल", letters: ["ka", "ma", "la"], emoji: "🪷", audio: "/audio/words/kamal.mp3", label: "lotus" },
  { id: "magar", word: "मगर", letters: ["ma", "ga", "ra"], emoji: "🐊", audio: "/audio/words/magar.mp3", label: "crocodile" },
  { id: "batakh", word: "बतख", letters: ["ba", "ta", "kha"], emoji: "🦆", audio: "/audio/words/batakh.mp3", label: "duck" },
  { id: "namak", word: "नमक", letters: ["na", "ma", "ka"], emoji: "🧂", audio: "/audio/words/namak.mp3", label: "salt" },
  { id: "kalam", word: "कलम", letters: ["ka", "la", "ma"], emoji: "🖊️", audio: "/audio/words/kalam.mp3", label: "pen" },
  { id: "matar", word: "मटर", letters: ["ma", "tta", "ra"], emoji: "🫛", audio: "/audio/words/matar.mp3", label: "peas" },
  { id: "rabar", word: "रबर", letters: ["ra", "ba", "ra"], emoji: "🧽", audio: "/audio/words/rabar.mp3", label: "eraser" },
  { id: "palak", word: "पलक", letters: ["pa", "la", "ka"], emoji: "👁️", audio: "/audio/words/palak.mp3", label: "eyelid" },
  { id: "sabak", word: "सबक", letters: ["sa", "ba", "ka"], emoji: "📖", audio: "/audio/words/sabak.mp3", label: "lesson" },
  { id: "batan", word: "बटन", letters: ["ba", "tta", "na"], emoji: "🔘", audio: "/audio/words/batan.mp3", label: "button" },
  { id: "shahad", word: "शहद", letters: ["sha", "ha", "da"], emoji: "🍯", audio: "/audio/words/shahad.mp3", label: "honey" },
  { id: "mahal", word: "महल", letters: ["ma", "ha", "la"], emoji: "🏰", audio: "/audio/words/mahal.mp3", label: "palace" },
];

// 4-letter words — audio in /audio/words.
export const FOUR_LETTER_WORDS: TrainWord[] = [
  { id: "kasrat", word: "कसरत", letters: ["ka", "sa", "ra", "ta"], emoji: "🤸", audio: "/audio/words/kasrat.mp3", label: "exercise" },
  { id: "sarkas", word: "सरकस", letters: ["sa", "ra", "ka", "sa"], emoji: "🎪", audio: "/audio/words/sarkas.mp3", label: "circus" },
  { id: "bargad", word: "बरगद", letters: ["ba", "ra", "ga", "da"], emoji: "🌳", audio: "/audio/words/bargad.mp3", label: "banyan" },
  { id: "sharbat", word: "शरबत", letters: ["sha", "ra", "ba", "ta"], emoji: "🥤", audio: "/audio/words/sharbat.mp3", label: "cold drink" },
  { id: "bartan", word: "बरतन", letters: ["ba", "ra", "ta", "na"], emoji: "🍲", audio: "/audio/words/bartan.mp3", label: "utensils" },
  { id: "parval", word: "परवल", letters: ["pa", "ra", "va", "la"], emoji: "🥒", audio: "/audio/words/parval.mp3", label: "pointed gourd" },
  { id: "adrak", word: "अदरक", letters: ["a", "da", "ra", "ka"], emoji: "🫚", audio: "/audio/words/adrak.mp3", label: "ginger" },
  { id: "tharmas", word: "थरमस", letters: ["tha", "ra", "ma", "sa"], emoji: "🧴", audio: "/audio/words/tharmas.mp3", label: "thermos" },
  { id: "ajgar", word: "अजगर", letters: ["a", "ja", "ga", "ra"], emoji: "🐍", audio: "/audio/words/ajgar.mp3", label: "python" },
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

// One session ramps from short to long: two 2-letter, two 3-letter, then two
// 4-letter words.
export function buildSession(): TrainWord[] {
  return [
    ...sample(TWO_LETTER_WORDS, 2),
    ...sample(THREE_LETTER_WORDS, 2),
    ...sample(FOUR_LETTER_WORDS, 2),
  ];
}
