// ---------------------------------------------------------------------------
// POND HOP — BOARD BUILDER (ALfA English)
// ---------------------------------------------------------------------------
// One "crossing" uses a single TARGET letter. The frog crosses by hopping up a
// stack of rows; every row holds exactly ONE target-letter stone plus a couple
// of distractor letters drawn from the same lesson set. Positions are stored as
// PERCENTAGES of the water area so the layout is responsive on any phone.
//
// Row 0 is the FIRST step (bottom, near the start bank); the last row sits by
// the far bank (top). The frog may only hop to the next row up.
// ---------------------------------------------------------------------------

export interface HopStone {
  id: number;
  letterId: string;
  isTarget: boolean;
  x: number; // % across the water (0–100)
  y: number; // % down the water (0 = far bank side, 100 = near bank side)
}

export interface HopConfig {
  rows: number; // number of hoppable rows = hops needed to cross
  stonesPerRow: number; // stones in each row (1 target + distractors)
}

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Where the rows sit vertically (as % of the water): the top row near the far
// bank, the bottom row near the start.
const Y_TOP = 14;
const Y_BOTTOM = 84;

// Pick `count` distractor ids from `others`, preferring distinct letters and
// only repeating if the lesson pool is too small to fill the row.
function pickDistractors(others: string[], count: number): string[] {
  const out: string[] = [];
  let bag = shuffle([...others]);
  while (out.length < count) {
    if (bag.length === 0) bag = shuffle([...others]);
    const next = bag.pop()!;
    out.push(next);
  }
  return out;
}

export function buildHopBoard(targetId: string, pool: string[], cfg: HopConfig): HopStone[][] {
  const others = pool.filter((id) => id !== targetId);
  const distractorsPerRow = Math.max(0, cfg.stonesPerRow - 1);

  let sid = 0;
  const rows: HopStone[][] = [];
  for (let r = 0; r < cfg.rows; r++) {
    const letters = shuffle([targetId, ...pickDistractors(others, distractorsPerRow)]);

    // vertical band for this row (row 0 = bottom, last row = top), with jitter
    const t = cfg.rows === 1 ? 0 : r / (cfg.rows - 1);
    const yBase = Y_BOTTOM - t * (Y_BOTTOM - Y_TOP);

    // As the crossings grow taller the rows sit closer together, so shrink the
    // vertical jitter to keep neighbouring rows from overlapping on screen.
    const spacing = cfg.rows > 1 ? (Y_BOTTOM - Y_TOP) / (cfg.rows - 1) : Y_BOTTOM - Y_TOP;
    const yJit = Math.min(3, spacing * 0.22);

    // spread the row's stones across the width, then jitter each a little
    const size = letters.length;
    const gap = 76 / size; // usable band is 12%..88%
    const row: HopStone[] = letters.map((letterId, j) => {
      const xBase = 12 + (j + 0.5) * gap;
      return {
        id: sid++,
        letterId,
        isTarget: letterId === targetId,
        x: clamp(xBase + rand(-4, 4), 8, 92),
        y: clamp(yBase + rand(-yJit, yJit), 10, 88),
      };
    });
    rows.push(row);
  }
  return rows;
}
