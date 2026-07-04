// ---------------------------------------------------------------------------
// LEKHAN (WRITING) — LEVEL CONFIG
// ---------------------------------------------------------------------------
// The child traces / writes letters (then 2-letter words) on a slate.
//   L1: letter shown at top + a DOTTED guide on the slate to trace.
//   L2: letter shown at top, BLANK slate (write it).
//   L3: only the PICTURE at top (audio plays), blank slate — recall the letter.
//   L4: word mode — picture + the 2-letter word shown, rectangular slate.
//   L5: word mode — only the picture, recall & write the word.
// Each level finishes after `items` letters/words; applause, then next level.
// ---------------------------------------------------------------------------

export interface LekhanLevel {
  mode: "letter" | "word";
  showGuide: boolean; // dotted trace outline on the slate
  showGlyph: boolean; // show the letter / word text at the top
  shape: "square" | "rect";
  items: number; // how many letters/words complete the level
  bg: string;
}

export const LEKHAN_LEVELS: LekhanLevel[] = [
  { mode: "letter", showGuide: true, showGlyph: true, shape: "square", items: 5, bg: "linear-gradient(#e9f7ff 0%, #bfe6ff 100%)" },
  { mode: "letter", showGuide: false, showGlyph: true, shape: "square", items: 5, bg: "linear-gradient(#e7fbe9 0%, #bff0c9 100%)" },
  { mode: "letter", showGuide: false, showGlyph: false, shape: "square", items: 5, bg: "linear-gradient(#fff0e6 0%, #ffd9bf 100%)" },
  { mode: "word", showGuide: false, showGlyph: true, shape: "rect", items: 5, bg: "linear-gradient(#f1e9ff 0%, #d9c9ff 100%)" },
  { mode: "word", showGuide: false, showGlyph: false, shape: "rect", items: 5, bg: "linear-gradient(#e9f7ff 0%, #bfe0ff 100%)" },
];

export const TOTAL_LEKHAN_LEVELS = LEKHAN_LEVELS.length;
