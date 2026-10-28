// ---------------------------------------------------------------------------
// ROUND BUILDER
// ---------------------------------------------------------------------------
// Pure helper functions that turn a LevelConfig into the actual set of fish for
// one round: which letter is the target, and which letters the distractor fish
// carry. Kept separate from React so the game logic is easy to read and edit.
// ---------------------------------------------------------------------------

import { LETTERS, Letter, getLetter } from "../letters";
import { DistractorMode, LevelConfig } from "./levels";

export interface FishSpec {
  id: number; // unique id for React keys
  letterId: string;
  char: string;
  isTarget: boolean;
  color: string; // fish body colour (random — NOT tied to the letter)
}

export interface RoundPlan {
  target: Letter;
  fish: FishSpec[];
}

// Fish body colours. Each fish gets a RANDOM colour from this list so colour
// never hints at which letter a fish carries. Deliberately NO blue (the pond is
// blue) and NO red — just cheerful yellow / green / purple / orange.
export const FISH_COLORS = [
  "#ffc233", // yellow
  "#36c46b", // green
  "#9b5cff", // purple
  "#ff8a3d", // orange
];

// Pick a random item from an array.
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Build the pool of distractor letter-ids based on the level's distractor mode.
// We always exclude the target letter from the distractor pool.
function buildDistractorPool(target: Letter, mode: DistractorMode): string[] {
  const allOthers = LETTERS.filter((l) => l.id !== target.id).map((l) => l.id);

  let preferred: string[] = [];
  if (mode === "lookAlike") {
    preferred = target.lookAlikes.filter((id) => id !== target.id);
  } else if (mode === "soundAlike") {
    preferred = target.soundAlikes.filter((id) => id !== target.id);
  } else if (mode === "mixed") {
    preferred = [...target.lookAlikes, ...target.soundAlikes].filter(
      (id) => id !== target.id
    );
  }

  // De-duplicate the preferred list.
  preferred = Array.from(new Set(preferred));

  // For tricky modes we weight the pool toward the preferred (tricky) letters
  // but still include some plain "other" letters so there is variety.
  if (preferred.length > 0) {
    return [...preferred, ...preferred, ...allOthers];
  }
  // "easy" mode (or no preferred letters): just use clearly-different letters.
  return allOthers;
}

// Create the full plan of fish for one round. The target letter is chosen by
// the caller (each level gets a fixed letter), not at random.
export function buildRound(
  level: LevelConfig,
  target: Letter,
  fishIdStart: number
): RoundPlan {
  // The target appears in HALF the fish (rounded down), the rest are distractors.
  const targetCount = Math.max(1, Math.floor(level.fishCount / 2));
  const distractorCount = level.fishCount - targetCount;

  const distractorPool = buildDistractorPool(target, level.distractorMode);

  const fish: FishSpec[] = [];
  let nextId = fishIdStart;

  // Target fish.
  for (let i = 0; i < targetCount; i++) {
    fish.push({
      id: nextId++,
      letterId: target.id,
      char: target.char,
      isTarget: true,
      color: pick(FISH_COLORS),
    });
  }

  // Distractor fish.
  for (let i = 0; i < distractorCount; i++) {
    const letterId = pick(distractorPool);
    const letter = getLetter(letterId);
    fish.push({
      id: nextId++,
      letterId: letter.id,
      char: letter.char,
      isTarget: false,
      color: pick(FISH_COLORS),
    });
  }

  // 3) Shuffle so target fish are not always first (Fisher–Yates).
  for (let i = fish.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fish[i], fish[j]] = [fish[j], fish[i]];
  }

  return { target, fish };
}
