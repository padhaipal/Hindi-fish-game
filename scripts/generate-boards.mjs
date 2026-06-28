// Board generator for the Hindi Blocks game (5x4 full grid, reverse construction).
//
// Model: 5 columns x 4 rows = 20 blocks (a FULL rectangle), bottom-aligned,
// straight-down gravity. A word is two ADJACENT blocks that spell it:
//   - HORIZONTAL: same row, neighbouring columns, read left -> right.
//   - VERTICAL:   same column, stacked, read top -> bottom.
// Removing a pair splices it from the column(s) so blocks above fall straight
// down. (A full 5-wide grid can't be cleared with horizontal pairs alone, so
// vertical pairs are allowed too.)
//
// We build a board by INSERTING 10 word-pairs (reverse of clearing) until the
// grid is full, then VERIFY that, cleared in that order, every word has EXACTLY
// ONE occurrence at its step — so the child's correct move is always unambiguous
// and the board is always winnable.

const LETTERS = ["ba", "sa", "ka", "pa", "ra", "la", "cha", "ta"];
const WORDS = {
  bus: ["ba", "sa"], cup: ["ka", "pa"], sar: ["sa", "ra"], ras: ["ra", "sa"],
  bal: ["ba", "la"], chal: ["cha", "la"], sab: ["sa", "ba"], kab: ["ka", "ba"],
  sach: ["sa", "cha"], par: ["pa", "ra"], pak: ["pa", "ka"], tap: ["ta", "pa"],
};
const WORD_IDS = Object.keys(WORDS);
const TA_WORD = "tap";
const NON_TA = WORD_IDS.filter((w) => w !== TA_WORD);

const COLS = 5;
const ROWS = 4;
const PAIRS = (COLS * ROWS) / 2; // 10

let seed = 20260628;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
const ri = (n) => Math.floor(rnd() * n);
const pick = (a) => a[ri(a.length)];
const clone = (cols) => cols.map((c) => c.slice());
const key = (cols) => cols.map((c) => c.join(",")).join("|");
const isEmpty = (cols) => cols.every((c) => c.length === 0);

function occurrences(cols, word) {
  const out = [];
  for (let c = 0; c < cols.length - 1; c++) {
    const h = Math.min(cols[c].length, cols[c + 1].length);
    for (let L = 0; L < h; L++) {
      if (cols[c][L] === word[0] && cols[c + 1][L] === word[1]) out.push({ c, L, o: "h" });
    }
  }
  for (let c = 0; c < cols.length; c++) {
    for (let L = 0; L < cols[c].length - 1; L++) {
      if (cols[c][L + 1] === word[0] && cols[c][L] === word[1]) out.push({ c, L, o: "v" });
    }
  }
  return out;
}
function removeOcc(cols, occ) {
  const next = clone(cols);
  if (occ.o === "h") { next[occ.c].splice(occ.L, 1); next[occ.c + 1].splice(occ.L, 1); }
  else { next[occ.c].splice(occ.L, 2); }
  return next;
}
function distinct(cols) { const s = new Set(); for (const c of cols) for (const l of c) s.add(l); return s; }

// Find ANY clearing order where every removed word has exactly one occurrence
// at its step (DFS with memoised dead-ends). Returns the order, or null.
function solve(cols) {
  const dead = new Set();
  let budget = 20000; // cap states explored per board so one bad board can't hang
  function go(cur) {
    if (isEmpty(cur)) return [];
    if (--budget < 0) return null;
    const k = key(cur);
    if (dead.has(k)) return null;
    const ids = WORD_IDS.slice();
    for (let i = ids.length - 1; i > 0; i--) { const j = ri(i + 1); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    for (const id of ids) {
      const occ = occurrences(cur, WORDS[id]);
      if (occ.length !== 1) continue;
      const rest = go(removeOcc(cur, occ[0]));
      if (rest) return [id, ...rest];
    }
    dead.add(k);
    return null;
  }
  return go(cols);
}

function buildBoard() {
  const cols = Array.from({ length: COLS }, () => []);
  const words = [TA_WORD];
  for (let i = 0; i < PAIRS - 1; i++) words.push(pick(NON_TA));
  for (let i = words.length - 1; i > 0; i--) { const j = ri(i + 1); [words[i], words[j]] = [words[j], words[i]]; }

  const inserted = [];
  for (const id of words) {
    const [w0, w1] = WORDS[id];
    const moves = [];
    for (let c = 0; c < COLS - 1; c++) {
      if (cols[c].length < ROWS && cols[c + 1].length < ROWS) moves.push({ o: "h", c });
    }
    for (let c = 0; c < COLS; c++) {
      if (cols[c].length <= ROWS - 2) moves.push({ o: "v", c });
    }
    if (moves.length === 0) return null;
    const m = pick(moves);
    if (m.o === "h") {
      const L = ri(Math.min(cols[m.c].length, cols[m.c + 1].length) + 1);
      cols[m.c].splice(L, 0, w0);
      cols[m.c + 1].splice(L, 0, w1);
    } else {
      const L = ri(cols[m.c].length + 1);
      cols[m.c].splice(L, 0, w1, w0);
    }
    inserted.push(id);
  }
  return { cols, order: inserted.slice().reverse() };
}


import { writeFileSync } from "fs";
function genSeed(seedVal, acc, seenSet, wantTotal) {
  seed = seedVal;
  let tries = 0;
  let lastNew = 0;
  while (acc.length < wantTotal && tries < 400000) {
    tries++;
    const b = buildBoard();
    if (!b) continue;
    const { cols } = b;
    if (!cols.every((c) => c.length === ROWS)) continue;
    if (distinct(cols).size !== 8) continue;
    const k = key(cols);
    if (seenSet.has(k)) continue;
    const order = solve(cols);
    if (!order || order.length !== PAIRS) continue;
    seenSet.add(k);
    acc.push({ cols, order });
    lastNew = tries;
    if (acc.length >= wantTotal) break;
    if (tries - lastNew > 80000) break; // this seed exhausted
  }
  return tries;
}
import { readFileSync, existsSync } from "fs";
const acc = existsSync("boards2.json") ? JSON.parse(readFileSync("boards2.json","utf8")) : [];
const seenSet = new Set(acc.map(b => key(b.cols)));
const WANT = 30;
for (let s = 1; s <= 200 && acc.length < WANT; s++) {
  const t = genSeed(s * 2654435761 % 2147483647 + 7, acc, seenSet, WANT);
  console.error(`seed#${s} -> total ${acc.length} (tries ${t})`);
  writeFileSync("boards2.json", JSON.stringify(acc)); // incremental save
}
console.error(`DONE total=${acc.length}`);
