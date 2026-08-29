// ---------------------------------------------------------------------------
// BLOCKS GAME — WORD POOL & BOARD BUILDER (ALfA English)
// ---------------------------------------------------------------------------
// A curated set of short, decodable 3-letter CVC words drawn from the shared
// CVC_WORDS list (so the pictures match the rest of the app). Each board is
// filled with all the letters of a handful of these words, shuffled.
// ---------------------------------------------------------------------------

import { CVC_WORDS, type CvcWord } from "@/lib/lessons";

// The words used in this game (all have a clear emoji in CVC_WORDS).
const USE = [
  "cat", "dog", "pig", "fox", "hen",
  "bat", "bag", "jet", "jam", "bed",
  "cap", "box", "sun", "bus", "cup",
];

export const BLOCK_WORDS: CvcWord[] = USE
  .map((w) => CVC_WORDS.find((c) => c.word === w))
  .filter((w): w is CvcWord => Boolean(w));

// Pick `n` distinct random words for a board.
export function pickWords(n: number): CvcWord[] {
  const pool = BLOCK_WORDS.slice();
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

// Build a full cols×rows column grid from the given words: every letter of every
// word, shuffled and packed into columns bottom→top. Total letters always equals
// cols*rows (each word is 3 letters, levels are sized to match).
export function buildBoardCols(words: string[], cols: number, rows: number): string[][] {
  const chars: string[] = [];
  for (const w of words) for (const ch of w) chars.push(ch);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  const grid: string[][] = [];
  for (let c = 0; c < cols; c++) grid.push(chars.slice(c * rows, c * rows + rows));
  return grid;
}
