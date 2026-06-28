// ---------------------------------------------------------------------------
// BLOCKS GAME — WORD DATA
// ---------------------------------------------------------------------------
// Each word is two Hindi consonant-blocks read left→right (e.g. बस = ब + स).
// The picture is an EMOJI (crisp on small screens, no asset loading) and the
// spoken word lives at /public/audio/words/<id>.mp3 (safe tone fallback if
// missing). To add/replace a word, edit this list — but remember the board
// generator (scripts/generate-boards.mjs) must use the same letters list.
//
// `letters` are letter ids from lib/letters.ts; only these 8 are used:
//   ba ब, sa स, ka क, pa प, ra र, la ल, cha च, ta त
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
  { id: "bus", word: "बस", letters: ["ba", "sa"], emoji: "🚌", audio: "/audio/words/bus.mp3", label: "bus" },
  { id: "cup", word: "कप", letters: ["ka", "pa"], emoji: "☕", audio: "/audio/words/cup.mp3", label: "cup" },
  { id: "sar", word: "सर", letters: ["sa", "ra"], emoji: "👤", audio: "/audio/words/sar.mp3", label: "head" },
  { id: "ras", word: "रस", letters: ["ra", "sa"], emoji: "🧃", audio: "/audio/words/ras.mp3", label: "juice" },
  { id: "bal", word: "बल", letters: ["ba", "la"], emoji: "💪", audio: "/audio/words/bal.mp3", label: "strong arm" },
  { id: "chal", word: "चल", letters: ["cha", "la"], emoji: "🚶", audio: "/audio/words/chal.mp3", label: "walk" },
  { id: "sab", word: "सब", letters: ["sa", "ba"], emoji: "👥", audio: "/audio/words/sab.mp3", label: "everyone" },
  { id: "kab", word: "कब", letters: ["ka", "ba"], emoji: "⏰❓", audio: "/audio/words/kab.mp3", label: "when" },
  { id: "sach", word: "सच", letters: ["sa", "cha"], emoji: "✅", audio: "/audio/words/sach.mp3", label: "true" },
  { id: "par", word: "पर", letters: ["pa", "ra"], emoji: "🪶", audio: "/audio/words/par.mp3", label: "feather" },
  { id: "pak", word: "पक", letters: ["pa", "ka"], emoji: "🍳", audio: "/audio/words/pak.mp3", label: "frying pan" },
  // तप ("tap" = heat / sun) — the only word using त, so त always has a way to
  // clear. If you change it, also update scripts/generate-boards.mjs + regenerate.
  { id: "tap", word: "तप", letters: ["ta", "pa"], emoji: "☀️", audio: "/audio/words/tap.mp3", label: "heat" },
];

const BY_ID: Record<string, BlockWord> = BLOCK_WORDS.reduce((acc, w) => {
  acc[w.id] = w;
  return acc;
}, {} as Record<string, BlockWord>);

export function getWord(id: string): BlockWord {
  return BY_ID[id] ?? BLOCK_WORDS[0];
}
