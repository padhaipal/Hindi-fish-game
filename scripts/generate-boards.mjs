// Board generator for the Hindi Blocks game (reverse construction).
//
// Model: columns of blocks, bottom-aligned, straight-down gravity. A word = two
// HORIZONTALLY adjacent blocks (same level, neighbouring columns) read L->R.
// Removing a pair splices it from each column so blocks above fall straight down.
//
// We build a board by INSERTING 7 word-pairs (reverse of clearing) — this
// guarantees a clearing order exists. Then we VERIFY that, cleared in that
// order, every word has EXACTLY ONE occurrence at its step (so the child's
// correct move is always unambiguous and the board is always winnable).

const LETTERS = ["ba", "sa", "ka", "pa", "ra", "la", "cha", "ta"];
const WORDS = {
  bus: ["ba", "sa"], cup: ["ka", "pa"], sar: ["sa", "ra"], ras: ["ra", "sa"],
  bal: ["ba", "la"], chal: ["cha", "la"], sab: ["sa", "ba"], kab: ["ka", "ba"],
  sach: ["sa", "cha"], par: ["pa", "ra"], pak: ["pa", "ka"], tap: ["ta", "pa"],
};
const WORD_IDS = Object.keys(WORDS);
const TA_WORD = "tap"; // the only word using त — forced into every board
const NON_TA = WORD_IDS.filter((w) => w !== TA_WORD);
const MAX_H = 4;

let seed = 987654321;
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
      if (cols[c][L] === word[0] && cols[c + 1][L] === word[1]) out.push([c, L]);
    }
  }
  return out;
}
function removeAt(cols, c, L) {
  const next = clone(cols);
  next[c].splice(L, 1);
  next[c + 1].splice(L, 1);
  return next;
}
function distinct(cols) { const s = new Set(); for (const c of cols) for (const l of c) s.add(l); return s; }

// Verify clearing `order` works with a UNIQUE occurrence at each step.
function verifyOrder(cols, order) {
  let cur = clone(cols);
  for (const id of order) {
    const occ = occurrences(cur, WORDS[id]);
    if (occ.length !== 1) return false;
    cur = removeAt(cur, occ[0][0], occ[0][1]);
  }
  return isEmpty(cur);
}

// Build a board by inserting 7 word-pairs (one of them always तर).
function buildBoard() {
  const numCols = 4 + ri(2); // 4 or 5
  const cols = Array.from({ length: numCols }, () => []);
  const words = [TA_WORD];
  for (let i = 0; i < 6; i++) words.push(pick(NON_TA));
  for (let i = words.length - 1; i > 0; i--) { const j = ri(i + 1); [words[i], words[j]] = [words[j], words[i]]; }

  const inserted = [];
  for (const id of words) {
    const [l1, l2] = WORDS[id];
    const cands = [];
    for (let c = 0; c < numCols - 1; c++) {
      if (cols[c].length < MAX_H && cols[c + 1].length < MAX_H) cands.push(c);
    }
    if (cands.length === 0) return null;
    const c = pick(cands);
    const L = ri(Math.min(cols[c].length, cols[c + 1].length) + 1);
    cols[c].splice(L, 0, l1);
    cols[c + 1].splice(L, 0, l2);
    inserted.push(id);
  }
  return { cols, order: inserted.slice().reverse() };
}

const boards = [];
const seen = new Set();
let tries = 0;
const TARGET = 30;
while (boards.length < TARGET && tries < 3_000_000) {
  tries++;
  const b = buildBoard();
  if (!b) continue;
  const { cols, order } = b;
  // tidy shape: every column height in [2,4]
  if (!cols.every((c) => c.length >= 2 && c.length <= MAX_H)) continue;
  if (distinct(cols).size !== 8) continue; // all 8 letters incl. त
  if (!verifyOrder(cols, order)) continue;
  const k = key(cols);
  if (seen.has(k)) continue;
  seen.add(k);
  boards.push({ cols, order });
}

console.error(`tries=${tries} boards=${boards.length}`);
process.stdout.write(JSON.stringify(boards));
