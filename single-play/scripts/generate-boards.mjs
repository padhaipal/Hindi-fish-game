// Mixed-length Blocks board generator.
//   node generate-mixed.mjs COLS ROWS WANT LENS OUTFILE
// Tiles a COLS x ROWS grid with straight word-runs (2/3/4 letters, horizontal
// or vertical) so EVERY LETTER IS DISTINCT, then keeps boards that are winnable
// (removable one word at a time, each a straight run at its step, with gravity).
// LENS is e.g. "2", "23", "234".

import { readFileSync, writeFileSync, existsSync } from "fs";

const COLS = parseInt(process.argv[2], 10);
const ROWS = parseInt(process.argv[3], 10);
const WANT = parseInt(process.argv[4], 10);
const LENS = process.argv[5].split("").map(Number);
const OUT = process.argv[6];

// Blocks word pool (no word with an internal repeated letter — those can't be
// used when every letter must be distinct). letters in spelling order.
const WORDS = {
  nal: ["na", "la"], ghar: ["gha", "ra"], phal: ["pha", "la"], tab: ["tta", "ba"],
  bas: ["ba", "sa"], kap: ["ka", "pa"], ras: ["ra", "sa"], hal: ["ha", "la"],
  kamal: ["ka", "ma", "la"], magar: ["ma", "ga", "ra"], batakh: ["ba", "ta", "kha"],
  namak: ["na", "ma", "ka"], kalam: ["ka", "la", "ma"], matar: ["ma", "tta", "ra"],
  palak: ["pa", "la", "ka"], sabak: ["sa", "ba", "ka"], batan: ["ba", "tta", "na"],
  shahad: ["sha", "ha", "da"], mahal: ["ma", "ha", "la"],
  kasrat: ["ka", "sa", "ra", "ta"], bargad: ["ba", "ra", "ga", "da"],
  sharbat: ["sha", "ra", "ba", "ta"], bartan: ["ba", "ra", "ta", "na"],
  parval: ["pa", "ra", "va", "la"], adrak: ["a", "da", "ra", "ka"],
  tharmas: ["tha", "ra", "ma", "sa"], ajgar: ["a", "ja", "ga", "ra"],
};
const IDS = Object.keys(WORDS).filter((id) => LENS.includes(WORDS[id].length));

let seed = 12345;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const ri = (n) => Math.floor(rnd() * n);
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---- tiler: exact-cover the grid with straight runs, distinct letters -------
// grid[c][r] = letterId | null.  r=0 bottom.
function tile() {
  const grid = Array.from({ length: COLS }, () => Array(ROWS).fill(null));
  const usedLetters = new Set();
  const usedWords = new Set();
  const placements = [];

  function firstEmpty() {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (grid[c][r] === null) return [c, r];
    return null;
  }
  function go() {
    const cell = firstEmpty();
    if (!cell) return true;
    const [cf, rf] = cell;
    for (const id of shuffle(IDS.slice())) {
      if (usedWords.has(id)) continue;
      const w = WORDS[id];
      if (w.some((l) => usedLetters.has(l))) continue;
      const k = w.length;
      // orientations that COVER (cf,rf): horizontal starting at cf (going right),
      // or vertical starting at rf (going up).
      for (const o of shuffle(["h", "v"])) {
        const cells = [];
        if (o === "h") { for (let i = 0; i < k; i++) cells.push([cf + i, rf]); }
        else { for (let i = 0; i < k; i++) cells.push([cf, rf + i]); }
        if (cells.some(([c, r]) => c >= COLS || r >= ROWS || grid[c][r] !== null)) continue;
        // assign letters in reading order: h left->right; v top->bottom
        for (let i = 0; i < k; i++) {
          const [c, r] = o === "h" ? cells[i] : cells[k - 1 - i]; // v: top cell first
          grid[c][r] = w[i];
        }
        w.forEach((l) => usedLetters.add(l));
        usedWords.add(id);
        placements.push({ id, o, cells });
        if (go()) return true;
        // undo
        placements.pop();
        usedWords.delete(id);
        w.forEach((l) => usedLetters.delete(l));
        for (const [c, r] of cells) grid[c][r] = null;
      }
    }
    return false;
  }
  if (!go()) return null;
  const cols = grid.map((col) => col.slice());
  return { cols, words: placements.map((p) => p.id) };
}

// ---- winnability (remove words one at a time, straight run + gravity) -------
const key = (cols) => cols.map((c) => c.join(",")).join("|");
const isEmpty = (cols) => cols.every((c) => c.length === 0);

function occ(cols, w) {
  const k = w.length;
  const out = [];
  // horizontal at row r
  for (let r = 0; r < ROWS; r++)
    for (let c0 = 0; c0 + k <= cols.length; c0++) {
      let ok = true;
      for (let i = 0; i < k; i++) { const col = cols[c0 + i]; if (r >= col.length || col[r] !== w[i]) { ok = false; break; } }
      if (ok) out.push({ c: c0, r, o: "h", k });
    }
  // vertical, read top->bottom
  for (let c = 0; c < cols.length; c++)
    for (let r0 = 0; r0 + k <= cols[c].length; r0++) {
      let ok = true;
      for (let i = 0; i < k; i++) if (cols[c][r0 + k - 1 - i] !== w[i]) { ok = false; break; }
      if (ok) out.push({ c, r: r0, o: "v", k });
    }
  return out;
}
function remove(cols, o) {
  const next = cols.map((c) => c.slice());
  if (o.o === "h") { for (let i = 0; i < o.k; i++) next[o.c + i].splice(o.r, 1); }
  else next[o.c].splice(o.r, o.k);
  return next;
}
function solve(cols, ids) {
  const dead = new Set();
  let budget = 40000;
  function go(cur) {
    if (isEmpty(cur)) return [];
    if (--budget < 0) return null;
    const kk = key(cur);
    if (dead.has(kk)) return null;
    for (const id of shuffle(ids.slice())) {
      const os = occ(cur, WORDS[id]);
      if (os.length !== 1) continue;
      const rest = go(remove(cur, os[0]));
      if (rest) return [id, ...rest];
    }
    dead.add(kk);
    return null;
  }
  return go(cols);
}

const acc = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : [];
const seen = new Set(acc.map((b) => key(b.cols)));
let tries = 0;
for (let s = 1; s <= 4000 && acc.length < WANT; s++) {
  seed = (s * 2654435761) % 2147483647 + 7;
  const t = tile();
  tries++;
  if (!t) continue;
  const k = key(t.cols);
  if (seen.has(k)) continue;
  const flat = t.cols.flat();
  if (new Set(flat).size !== flat.length) continue; // safety: distinct
  if (flat.length !== COLS * ROWS) continue;
  const order = solve(t.cols, t.words);
  if (!order) continue;
  seen.add(k);
  acc.push({ cols: t.cols, order });
  writeFileSync(OUT, JSON.stringify(acc));
}
console.error(`${COLS}x${ROWS} lens=${LENS.join("")} -> ${acc.length}/${WANT} (tries ${tries})`);
