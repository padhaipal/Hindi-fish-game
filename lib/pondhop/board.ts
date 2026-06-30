// ---------------------------------------------------------------------------
// POND HOP — BOARD BUILDER
// ---------------------------------------------------------------------------
// Lays out the stones in rows. There is one target-letter stone per row (the
// correct hop), padded out with distractor letters. Row 0 is the FIRST step
// (nearest the start / bottom of the river); the last row reaches the far bank.
// ---------------------------------------------------------------------------

import { LETTERS } from "@/lib/letters";
import { HopLevel } from "./levels";

export interface HopStone {
  id: number;
  letterId: string;
  isTarget: boolean;
}

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build the rows of stones for a level. `targets` rows; the `stones` total is
// spread as evenly as possible across them (earlier rows get the extra stones).
export function buildHopBoard(targetId: string, cfg: HopLevel): HopStone[][] {
  const base = Math.floor(cfg.stones / cfg.targets);
  const rem = cfg.stones % cfg.targets;
  const others = LETTERS.map((l) => l.id).filter((id) => id !== targetId);

  let sid = 0;
  const rows: HopStone[][] = [];
  for (let r = 0; r < cfg.targets; r++) {
    const size = base + (r < rem ? 1 : 0);
    const distractors = shuffle([...others]).slice(0, Math.max(0, size - 1));
    const row: HopStone[] = [
      { id: sid++, letterId: targetId, isTarget: true },
      ...distractors.map((id) => ({ id: sid++, letterId: id, isTarget: false })),
    ];
    rows.push(shuffle(row));
  }
  return rows;
}
