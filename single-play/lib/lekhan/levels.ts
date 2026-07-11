// ---------------------------------------------------------------------------
// LEKHAN (WRITING) — LEVEL CONFIG
// ---------------------------------------------------------------------------
// The child writes letters (then 2-letter words) on a blank slate.
//   L1: letter shown at top, BLANK slate — write it; recognised, not measured.
//   L2: only the PICTURE at top (audio plays), blank slate — recall the letter.
//   L3: word mode — picture + the 2-letter word shown, rectangular slate.
//   L4: word mode — only the picture, recall & write the word.
// (There used to be a traced "guide" level 1 before these; it was removed and
// the child now comes straight into writing the letter.)
// Each level finishes after `items` letters/words; applause, then next level.
// ---------------------------------------------------------------------------

export interface LekhanLevel {
  mode: "letter" | "word";
  showGlyph: boolean; // show the letter / word text at the top
  shape: "square" | "rect";
  items: number; // how many letters/words complete the level
  bg: string;
}

export const LEKHAN_LEVELS: LekhanLevel[] = [
  { mode: "letter", showGlyph: true, shape: "square", items: 5, bg: "linear-gradient(#e7fbe9 0%, #bff0c9 100%)" },
  { mode: "letter", showGlyph: false, shape: "square", items: 5, bg: "linear-gradient(#fff0e6 0%, #ffd9bf 100%)" },
  { mode: "word", showGlyph: true, shape: "rect", items: 5, bg: "linear-gradient(#f1e9ff 0%, #d9c9ff 100%)" },
  { mode: "word", showGlyph: false, shape: "rect", items: 5, bg: "linear-gradient(#e9f7ff 0%, #bfe0ff 100%)" },
];

export const TOTAL_LEKHAN_LEVELS = LEKHAN_LEVELS.length;
