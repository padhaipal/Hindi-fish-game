// ---------------------------------------------------------------------------
// BLOCKS GAME — WORD DATA (single-play)
// ---------------------------------------------------------------------------
// Each word is two Hindi consonant-blocks read left→right (e.g. नल = न + ल).
// The picture is an emoji and the spoken word lives at /audio/words/<id>.mp3.
//
// This build has 8 two-letter words (all matra-free, picture-able). Because a
// board can use each word at most once, the biggest winnable grid is 4x4 (8
// words) — so Blocks here runs 4 levels, not 5. To add/replace a word, edit
// this list AND regenerate the boards (scripts/generate-boards.mjs).
// ---------------------------------------------------------------------------

export interface BlockWord {
  id: string;
  word: string; // Devanagari, shown only for reference / aria
  letters: [string, string]; // [left letter id, right letter id]
  emoji: string; // the picture shown at the top of the screen
  audio: string; // spoken word
  label: string; // English meaning (developer-facing)
}

export const BLOCK_WORDS: BlockWord[] = [
  { id: "nal", word: "नल", letters: ["na", "la"], emoji: "🚰", audio: "/audio/words/nal.mp3", label: "tap" },
  { id: "ghar", word: "घर", letters: ["gha", "ra"], emoji: "🏠", audio: "/audio/words/ghar.mp3", label: "house" },
  { id: "phal", word: "फल", letters: ["pha", "la"], emoji: "🍎", audio: "/audio/words/phal.mp3", label: "fruit" },
  { id: "tab", word: "टब", letters: ["tta", "ba"], emoji: "🛁", audio: "/audio/words/tab.mp3", label: "tub" },
  { id: "bas", word: "बस", letters: ["ba", "sa"], emoji: "🚌", audio: "/audio/words/bas.mp3", label: "bus" },
  { id: "kap", word: "कप", letters: ["ka", "pa"], emoji: "☕", audio: "/audio/words/kap.mp3", label: "cup" },
  { id: "ras", word: "रस", letters: ["ra", "sa"], emoji: "🧃", audio: "/audio/words/ras.mp3", label: "juice" },
  { id: "hal", word: "हल", letters: ["ha", "la"], emoji: "🚜", audio: "/audio/words/hal.mp3", label: "plough" },
];

const BY_ID: Record<string, BlockWord> = BLOCK_WORDS.reduce((acc, w) => {
  acc[w.id] = w;
  return acc;
}, {} as Record<string, BlockWord>);

export function getWord(id: string): BlockWord {
  return BY_ID[id] ?? BLOCK_WORDS[0];
}
