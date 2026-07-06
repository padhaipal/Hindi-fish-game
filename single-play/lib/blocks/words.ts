// ---------------------------------------------------------------------------
// BLOCKS GAME — WORD DATA (single-play)
// ---------------------------------------------------------------------------
// A word is 2, 3 or 4 Hindi consonant-blocks read as a straight run (left→right
// or top→bottom). The picture is an emoji (or a drawn SVG via <WordPicture>) and
// the spoken word lives at /audio/words/<id>.mp3.
//
// EACH LETTER APPEARS AT MOST ONCE per board, so words with an internal repeated
// letter (रबर, सरकस) are NOT in this pool. Which lengths appear on each level is
// set in levels.ts; boards are pre-generated (scripts/generate-boards.mjs).
// ---------------------------------------------------------------------------

export interface BlockWord {
  id: string;
  word: string; // Devanagari, shown only for reference / aria
  letters: string[]; // letter ids in spelling order (length 2–4)
  emoji: string; // the picture (or emoji fallback for <WordPicture>)
  audio: string; // spoken word
  label: string; // English meaning (developer-facing)
}

const W = (id: string, word: string, letters: string[], emoji: string, label: string): BlockWord => ({
  id,
  word,
  letters,
  emoji,
  audio: `/audio/words/${id}.mp3`,
  label,
});

export const BLOCK_WORDS: BlockWord[] = [
  // 2-letter
  W("nal", "नल", ["na", "la"], "🚰", "tap"),
  W("ghar", "घर", ["gha", "ra"], "🏠", "house"),
  W("phal", "फल", ["pha", "la"], "🍎", "fruit"),
  W("tab", "टब", ["tta", "ba"], "🛁", "tub"),
  W("bas", "बस", ["ba", "sa"], "🚌", "bus"),
  W("kap", "कप", ["ka", "pa"], "☕", "cup"),
  W("ras", "रस", ["ra", "sa"], "🧃", "juice"),
  W("hal", "हल", ["ha", "la"], "🚜", "plough"),
  // 3-letter
  W("kamal", "कमल", ["ka", "ma", "la"], "🪷", "lotus"),
  W("magar", "मगर", ["ma", "ga", "ra"], "🐊", "crocodile"),
  W("batakh", "बतख", ["ba", "ta", "kha"], "🦆", "duck"),
  W("namak", "नमक", ["na", "ma", "ka"], "🧂", "salt"),
  W("kalam", "कलम", ["ka", "la", "ma"], "🖊️", "pen"),
  W("matar", "मटर", ["ma", "tta", "ra"], "🫛", "peas"),
  W("palak", "पलक", ["pa", "la", "ka"], "👁️", "eyelid"),
  W("sabak", "सबक", ["sa", "ba", "ka"], "📖", "lesson"),
  W("batan", "बटन", ["ba", "tta", "na"], "🔘", "button"),
  W("shahad", "शहद", ["sha", "ha", "da"], "🍯", "honey"),
  W("mahal", "महल", ["ma", "ha", "la"], "🏰", "palace"),
  // 4-letter
  W("kasrat", "कसरत", ["ka", "sa", "ra", "ta"], "🤸", "exercise"),
  W("bargad", "बरगद", ["ba", "ra", "ga", "da"], "🌳", "banyan"),
  W("sharbat", "शरबत", ["sha", "ra", "ba", "ta"], "🥤", "cold drink"),
  W("bartan", "बरतन", ["ba", "ra", "ta", "na"], "🍲", "utensils"),
  W("parval", "परवल", ["pa", "ra", "va", "la"], "🥒", "gourd"),
  W("adrak", "अदरक", ["a", "da", "ra", "ka"], "🫚", "ginger"),
  W("tharmas", "थरमस", ["tha", "ra", "ma", "sa"], "🧴", "thermos"),
  W("ajgar", "अजगर", ["a", "ja", "ga", "ra"], "🐍", "python"),
];

const BY_ID: Record<string, BlockWord> = BLOCK_WORDS.reduce((acc, w) => {
  acc[w.id] = w;
  return acc;
}, {} as Record<string, BlockWord>);

export function getWord(id: string): BlockWord {
  return BY_ID[id] ?? BLOCK_WORDS[0];
}
