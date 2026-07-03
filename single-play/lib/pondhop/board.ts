// ---------------------------------------------------------------------------
// POND HOP — BOARD BUILDER
// ---------------------------------------------------------------------------
// Lays out the stones in rows (one target-letter stone per row + distractors),
// then scatters each stone to a slightly random position so the river looks
// natural rather than a neat grid. Positions are PERCENTAGES of the water area.
// Row 0 is the FIRST step (bottom, near the start); the last row reaches the
// far bank (top). The frog may only hop to the next row up.
// ---------------------------------------------------------------------------

import { LETTERS } from "@/lib/letters";
import { HopLevel } from "./levels";

export interface HopStone {
  id: number;
  letterId: string;
  isTarget: boolean;
  x: number; // % across the water (0–100)
  y: number; // % down the water (0 = far bank side, 100 = near bank side)
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

// Where the rows sit vertically (as % of the water): row 0 near the bottom,
// the last row near the top.
const Y_TOP = 13;
const Y_BOTTOM = 84;

export function buildHopBoard(targetId: string, cfg: HopLevel): HopStone[][] {
  const base = Math.floor(cfg.stones / cfg.targets);
  const rem = cfg.stones % cfg.targets;
  const others = LETTERS.map((l) => l.id).filter((id) => id !== targetId);

  let sid = 0;
  const rows: HopStone[][] = [];
  for (let r = 0; r < cfg.targets; r++) {
    const size = base + (r < rem ? 1 : 0);
    const distractors = shuffle([...others]).slice(0, Math.max(0, size - 1));
    const letters = shuffle([
      targetId,
      ...distractors,
    ]);

    // vertical band for this row (with a little per-stone jitter)
    const t = cfg.targets === 1 ? 0 : r / (cfg.targets - 1);
    const yBase = Y_BOTTOM - t * (Y_BOTTOM - Y_TOP);

    // spread the row's stones across the width, then jitter each
    const gap = 76 / size; // usable band is 12%..88%
    const row: HopStone[] = letters.map((letterId, j) => {
      const xBase = 12 + (j + 0.5) * gap;
      return {
        id: sid++,
        letterId,
        isTarget: letterId === targetId,
        x: clamp(xBase + rand(-4, 4), 7, 93),
        y: clamp(yBase + rand(-3, 3), 9, 88),
      };
    });
    rows.push(row);
  }
  return rows;
}
