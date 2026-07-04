// Parametrised board generator for the single-play word set.
//   node generate-boards.mjs COLS ROWS WANT OUTFILE
// Builds full COLS x ROWS boards (horizontal + vertical pairs, gravity) and
// keeps those with a unique-step clearing order (each word used at most once).
// Resumes from OUTFILE, saves incrementally.

import { readFileSync, writeFileSync, existsSync } from "fs";

const COLS = parseInt(process.argv[2], 10);
const ROWS = parseInt(process.argv[3], 10);
const WANT = parseInt(process.argv[4], 10);
const OUT = process.argv[5];
const PAIRS = (COLS * ROWS) / 2;

// new single-play 2-letter words
const WORDS = {
  nal: ["na", "la"], ghar: ["gha", "ra"], phal: ["pha", "la"], tab: ["tta", "ba"],
  bas: ["ba", "sa"], kap: ["ka", "pa"], ras: ["ra", "sa"], hal: ["ha", "la"],
};
const WORD_IDS = Object.keys(WORDS);

let seed = 12345;
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
    for (let L = 0; L < h; L++) if (cols[c][L] === word[0] && cols[c + 1][L] === word[1]) out.push({ c, L, o: "h" });
  }
  for (let c = 0; c < cols.length; c++)
    for (let L = 0; L < cols[c].length - 1; L++) if (cols[c][L + 1] === word[0] && cols[c][L] === word[1]) out.push({ c, L, o: "v" });
  return out;
}
function removeOcc(cols, occ) {
  const next = clone(cols);
  if (occ.o === "h") { next[occ.c].splice(occ.L, 1); next[occ.c + 1].splice(occ.L, 1); }
  else next[occ.c].splice(occ.L, 2);
  return next;
}

function solve(cols) {
  const dead = new Set();
  let budget = 20000;
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
  const pool = WORD_IDS.slice();
  for (let i = pool.length - 1; i > 0; i--) { const j = ri(i + 1); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const words = pool.slice(0, PAIRS);
  for (const id of words) {
    const [w0, w1] = WORDS[id];
    const moves = [];
    for (let c = 0; c < COLS - 1; c++) if (cols[c].length < ROWS && cols[c + 1].length < ROWS) moves.push({ o: "h", c });
    for (let c = 0; c < COLS; c++) if (cols[c].length <= ROWS - 2) moves.push({ o: "v", c });
    if (moves.length === 0) return null;
    const m = pick(moves);
    if (m.o === "h") {
      const L = ri(Math.min(cols[m.c].length, cols[m.c + 1].length) + 1);
      cols[m.c].splice(L, 0, w0); cols[m.c + 1].splice(L, 0, w1);
    } else {
      const L = ri(cols[m.c].length + 1);
      cols[m.c].splice(L, 0, w1, w0);
    }
  }
  return cols;
}

const acc = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : [];
const seen = new Set(acc.map((b) => key(b.cols)));
for (let s = 1; s <= 600 && acc.length < WANT; s++) {
  seed = s * 2654435761 % 2147483647 + 9;
  let tries = 0;
  while (acc.length < WANT && tries < 300000) {
    tries++;
    const cols = buildBoard();
    if (!cols) continue;
    if (!cols.every((c) => c.length === ROWS)) continue;
    const k = key(cols);
    if (seen.has(k)) continue;
    const order = solve(cols);
    if (!order || order.length !== PAIRS) continue;
    if (new Set(order).size !== order.length) continue;
    seen.add(k);
    acc.push({ cols, order });
  }
  writeFileSync(OUT, JSON.stringify(acc));
}
console.error(`${COLS}x${ROWS} DONE ${acc.length}`);
