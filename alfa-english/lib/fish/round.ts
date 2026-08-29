// ---------------------------------------------------------------------------
// FISH ROUND HELPERS (ALfA English)
// ---------------------------------------------------------------------------
// Pure helpers that decide which lowercase letters the fish carry. Kept out of
// React so the game logic stays easy to read.
//
// Each round has ONE target letter. The pond holds several fish: some are TARGET
// fish (showing the round's target letter) and the rest are DISTRACTORS drawn
// from the SAME lesson set. The child must catch ALL the target fish to finish
// the round. The number of target fish grows with the pond size.
// ---------------------------------------------------------------------------

export interface FishSpec {
  id: number; // stable id for React keys + motion lookup
  letterId: string; // the lowercase letter this fish carries
  char: string; // what is drawn on the fish (== letterId)
  isTarget: boolean; // true if this fish carries the round's target letter
  color: string; // body colour (random — never hints at the letter)
}

// Cheerful fish colours. No blue (the pond is blue) and no red, so colour never
// competes with the letter for attention.
export const FISH_COLORS = [
  "#ffc233", // yellow
  "#36c46b", // green
  "#9b5cff", // purple
  "#ff8a3d", // orange
];

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomColor(): string {
  return pick(FISH_COLORS);
}

// Fisher–Yates shuffle (in place) — returns the same array for chaining.
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// How many TARGET fish belong in a pond of `total` fish:
//   3 fish       -> 1 target
//   4 or 5 fish  -> 2 targets
//   6 or 7 fish  -> 3 targets
export function targetCountForTotal(total: number): number {
  if (total <= 3) return 1;
  if (total <= 5) return 2;
  return 3;
}

// Build `count` fish for one round: `targetCount` fish carry the target letter
// (so the child catches ALL of them to win), the rest carry distractor letters
// from the lesson pool (excluding the target). If the pool has no other letters
// the distractors simply repeat the target. Ids start at `idStart` and increase.
export function buildFish(
  pool: string[],
  targetId: string,
  count: number,
  idStart: number
): FishSpec[] {
  const targetCount = Math.min(targetCountForTotal(count), count);
  const distractorPool = pool.filter((id) => id !== targetId);

  const specs: FishSpec[] = [];
  let id = idStart;

  for (let i = 0; i < targetCount; i++) {
    specs.push({
      id: id++,
      letterId: targetId,
      char: targetId,
      isTarget: true,
      color: randomColor(),
    });
  }
  for (let i = specs.length; i < count; i++) {
    const letterId = distractorPool.length ? pick(distractorPool) : targetId;
    specs.push({
      id: id++,
      letterId,
      char: letterId,
      isTarget: letterId === targetId,
      color: randomColor(),
    });
  }

  return shuffle(specs);
}
