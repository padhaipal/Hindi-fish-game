// ---------------------------------------------------------------------------
// ROUND BUILDER
// ---------------------------------------------------------------------------
// Pure helper functions that turn a LevelConfig into the actual set of fish for
// one round: which letter is the target, and which letters the distractor fish
// carry. Kept separate from React so the game logic is easy to read and edit.
// ---------------------------------------------------------------------------

import { LETTERS, Letter, getLetter } from "./letters";
import { DistractorMode, LevelConfig } from "./levels";

export interface FishSpec {
  id: number; // unique id for React keys
  letterId: string;
  char: string;
  isTarget: boolean;
}

export interface RoundPlan {
  target: Letter;
  fish: FishSpec[];
}

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

// Create the full plan of fish for one round given the level config.
export function buildRound(level: LevelConfig, fishIdStart: number): RoundPlan {
  // 1) Choose a random target letter from our 8 letters.
  const target = pick(LETTERS);

  // 2) Decide how many target fish vs distractor fish.
  const targetCount = Math.min(level.targetCount, level.fishCount);
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
    });
  }

  // 3) Shuffle so target fish are not always first (Fisher–Yates).
  for (let i = fish.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fish[i], fish[j]] = [fish[j], fish[i]];
  }

  return { target, fish };
}
