// ---------------------------------------------------------------------------
// BLOCKS GAME — WORD POOL & PLACEMENT GENERATOR (ALfA English)
// ---------------------------------------------------------------------------
// A curated set of short, decodable 3-letter CVC words drawn from the shared
// CVC_WORDS list (so the pictures match the rest of the app). The placement
// generator takes a board's cell MASK and drops K words onto it as contiguous
// straight runs — a MIX of horizontal (left→right) and vertical (top→bottom)
// wherever the shape allows — with no two runs overlapping. Any leftover valid
// cell is filled with a random filler letter. Because the runs never overlap,
// clearing one solved word can never break another, so the board is always
// solvable in any order.
// ---------------------------------------------------------------------------

import { CVC_WORDS, type CvcWord } from "@/lib/lessons";

const WORD_LEN = 3; // every CVC word is 3 letters

// The words used in this game (all have a clear emoji in the shared CVC_WORDS).
const USE = [
  "cat", "dog", "fox", "hen", "bat",
  "bag", "jet", "jam", "bed", "cap",
  "box", "sun", "bus", "cup", "nut",
];

export const BLOCK_WORDS: CvcWord[] = Array.from(new Set(USE))
  .map((w) => CVC_WORDS.find((c) => c.word === w))
  .filter((w): w is CvcWord => Boolean(w));

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const FILLER = "abcdefghijklmnoprstuvwy".split(""); // no q/x/z — friendlier fillers

function randFiller(): string {
  return FILLER[Math.floor(Math.random() * FILLER.length)];
}

// Pick `n` distinct random words for a board.
export function pickWords(n: number): CvcWord[] {
  return shuffle(BLOCK_WORDS).slice(0, n);
}

// ---------------------------------------------------------------------------
// PLACEMENT
// ---------------------------------------------------------------------------

export interface Placement {
  word: string;
  row: number; // anchor: left cell (h) or top cell (v)
  col: number;
  o: "h" | "v";
}

interface Slot {
  row: number;
  col: number;
  o: "h" | "v";
  cells: string[]; // "r,c" keys the run covers
}

// Every straight length-WORD_LEN run of valid cells in the mask.
function slotsFor(mask: boolean[][]): Slot[] {
  const rows = mask.length;
  const cols = rows ? mask[0].length : 0;
  const slots: Slot[] = [];
  const valid = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols && mask[r][c];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c + WORD_LEN <= cols; c++) {
      const cells: string[] = [];
      let ok = true;
      for (let i = 0; i < WORD_LEN; i++) {
        if (!valid(r, c + i)) { ok = false; break; }
        cells.push(`${r},${c + i}`);
      }
      if (ok) slots.push({ row: r, col: c, o: "h", cells });
    }
  }
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r + WORD_LEN <= rows; r++) {
      const cells: string[] = [];
      let ok = true;
      for (let i = 0; i < WORD_LEN; i++) {
        if (!valid(r + i, c)) { ok = false; break; }
        cells.push(`${r + i},${c}`);
      }
      if (ok) slots.push({ row: r, col: c, o: "v", cells });
    }
  }
  return slots;
}

// One randomized attempt to seat every word in a free, non-overlapping slot.
// Bias each choice toward the orientation used LESS so far, to encourage a mix.
function attempt(words: string[], slots: Slot[]): Placement[] | null {
  const used = new Set<string>();
  const placements: Placement[] = [];
  let hCount = 0;
  let vCount = 0;

  for (const word of words) {
    const free = shuffle(slots.filter((s) => s.cells.every((k) => !used.has(k))));
    if (free.length === 0) return null;
    // Prefer the under-represented orientation when one is available.
    const wantV = vCount < hCount;
    const preferred = free.filter((s) => (wantV ? s.o === "v" : s.o === "h"));
    const pick = (preferred.length ? preferred : free)[0];
    for (const k of pick.cells) used.add(k);
    if (pick.o === "h") hCount++; else vCount++;
    placements.push({ word, row: pick.row, col: pick.col, o: pick.o });
  }
  return placements;
}

// Does a set of placements use both orientations?
function isMixed(p: Placement[]): boolean {
  return p.some((x) => x.o === "h") && p.some((x) => x.o === "v");
}

// Place `words` onto the mask. Retry with random restarts, preferring a result
// that MIXES horizontal and vertical; accept a single-orientation fit only if no
// mixed one is found (e.g. a 3×3 board with two 3-letter words cannot mix).
export function placeWords(mask: boolean[][], words: string[]): Placement[] {
  const slots = slotsFor(mask);
  let fallback: Placement[] | null = null;
  for (let i = 0; i < 400; i++) {
    const p = attempt(shuffle(words), slots);
    if (!p) continue;
    if (isMixed(p)) return p;
    if (!fallback) fallback = p;
  }
  if (fallback) return fallback;
  // Last resort: seat words greedily with no mix requirement.
  const p = attempt(words, slots);
  if (p) return p;
  throw new Error("placement failed"); // unreachable for the sized levels
}

// Build the row-major char grid for a board: gaps are "", placed word letters
// sit on their runs, and every other valid cell gets a random filler.
export function buildBoard(
  mask: boolean[][],
  words: string[]
): { grid: string[][]; placements: Placement[] } {
  const rows = mask.length;
  const cols = rows ? mask[0].length : 0;
  const placements = placeWords(mask, words);

  const grid: string[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => (mask[r][c] ? randFiller() : ""))
  );
  for (const p of placements) {
    for (let i = 0; i < WORD_LEN; i++) {
      const r = p.o === "v" ? p.row + i : p.row;
      const c = p.o === "h" ? p.col + i : p.col;
      grid[r][c] = p.word[i];
    }
  }
  return { grid, placements };
}
