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

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Build a full cols×rows column grid from the given words so that EACH word sits
// on the board as a straight, contiguous run (like the Hindi board generator).
// A run is read left→right (horizontal) or top→bottom (vertical); the child must
// tap those adjacent blocks in order to spell it. The board is fully packed —
// cols*rows always equals words*3 (each word is a 3-letter CVC word).
//
//   - VERTICAL layout (rows === word length): one word per column, stacked so
//     the top block is the word's first letter. Removing a solved word clears a
//     whole column, so the other columns stay intact. Used when rows === 3.
//   - HORIZONTAL layout (cols === word length): one word per row, left→right.
//     Removing a solved row lets the rows above fall a slot, each still a run.
//     Used when a level is 3-wide but shorter than 3 tall (levels 1 & 2).
//
// When a board is square (3×3) either layout works, so one is chosen at random
// for variety — both orientations are exercised across play.
export function buildBoardCols(words: string[], cols: number, rows: number): string[][] {
  const wlen = words[0]?.length ?? 3; // CVC words are 3 letters
  const canVertical = rows === wlen && cols === words.length;
  const canHorizontal = cols === wlen && rows === words.length;
  const vertical =
    canVertical && (!canHorizontal || Math.random() < 0.5);

  const placed = shuffle(words.slice()); // random spatial order (not the spell order)
  const grid: string[][] = Array.from({ length: cols }, () => [] as string[]);

  if (vertical) {
    // Column c holds word `placed[c]`, stored bottom→top = the word reversed,
    // so index (rows-1) (the top block) is the word's first letter.
    for (let c = 0; c < cols; c++) {
      grid[c] = placed[c].split("").reverse();
    }
    return grid;
  }

  // Horizontal: row L (0 = bottom) holds word `placed[L]`, column c = its Lth
  // letter's home. Filling L from 0 upward keeps each column bottom-packed.
  for (let L = 0; L < rows; L++) {
    const w = placed[L];
    for (let c = 0; c < cols; c++) grid[c][L] = w[c];
  }
  return grid;
}
