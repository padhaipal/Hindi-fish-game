// ---------------------------------------------------------------------------
// FISH ROUND HELPERS (ALfA English)
// ---------------------------------------------------------------------------
// Pure helpers that decide which lowercase letters the fish carry. Kept out of
// React so the game logic stays easy to read.
//
// The child sees the PICTURE of a target letter (e.g. an apple) and must catch
// a fish showing that letter (a). So every pond must contain the target letter
// on at least one fish, plus distractor letters drawn from the SAME lesson set.
// ---------------------------------------------------------------------------

export interface FishSpec {
  id: number; // stable id for React keys + motion lookup
  letterId: string; // the lowercase letter this fish carries
  char: string; // what is drawn on the fish (== letterId)
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
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Build `count` letter ids for the pond: `targetCount` copies of the target
// letter (so it is always catchable), the rest distractors from the lesson pool
// (excluding the target). If the pool is small the distractors simply repeat.
export function buildLetterIds(
  pool: string[],
  targetId: string,
  count: number,
  targetCount: number
): string[] {
  const distractorPool = pool.filter((id) => id !== targetId);
  const targets = Math.min(targetCount, count);

  const ids: string[] = [];
  for (let i = 0; i < targets; i++) ids.push(targetId);
  for (let i = ids.length; i < count; i++) {
    ids.push(distractorPool.length ? pick(distractorPool) : targetId);
  }
  return shuffle(ids);
}
