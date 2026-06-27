// ---------------------------------------------------------------------------
// LEVEL SETTINGS
// ---------------------------------------------------------------------------
// There are 8 levels — one per letter. Each game assigns a DIFFERENT one of the
// 8 target letters to each level, in a RANDOM order (see PondGame), so Level 1
// could be any letter and differs between players.
//
// Difficulty ramps from 3 fish up to 10 fish. The target letter always appears
// in HALF the fish (rounded down) — that count is computed from `fishCount` in
// lib/round.ts, so you only set `fishCount` here.
//
// Fields you can tweak per level:
//   - `fishCount`      : total fish in the pond (target fish = floor(fishCount/2)).
//   - `speed`          : base swim speed in pixels-per-second. Bigger = faster.
//   - `timeSeconds`    : how long the timer bar lasts.
//   - `distractorMode` : how the non-target fish are chosen:
//        "easy"       -> clearly-different letters.
//        "lookAlike"  -> prefer letters that LOOK similar to the target.
//        "soundAlike" -> prefer letters that SOUND similar to the target.
//        "mixed"      -> a blend of look- and sound-alike distractors.
//
// EARLY levels: few fish, slow, easy distractors.
// LATER levels: more fish, faster, look/sound-alike distractors.
// ---------------------------------------------------------------------------

export type DistractorMode = "easy" | "lookAlike" | "soundAlike" | "mixed";

export interface LevelConfig {
  fishCount: number;
  speed: number; // pixels per second
  timeSeconds: number;
  distractorMode: DistractorMode;
}

// 8 levels: fishCount 3 → 10, so target fish (floor/2) goes 1 → 5.
export const LEVELS: LevelConfig[] = [
  // Lvl  fish  target  speed  time  distractors
  /* 1 */ { fishCount: 3, speed: 26, timeSeconds: 20, distractorMode: "easy" }, //  1 target
  /* 2 */ { fishCount: 4, speed: 32, timeSeconds: 20, distractorMode: "easy" }, //  2 target
  /* 3 */ { fishCount: 5, speed: 40, timeSeconds: 18, distractorMode: "easy" }, //  2 target
  /* 4 */ { fishCount: 6, speed: 48, timeSeconds: 18, distractorMode: "lookAlike" }, // 3
  /* 5 */ { fishCount: 7, speed: 58, timeSeconds: 18, distractorMode: "soundAlike" }, // 3
  /* 6 */ { fishCount: 8, speed: 68, timeSeconds: 16, distractorMode: "mixed" }, //  4 target
  /* 7 */ { fishCount: 9, speed: 80, timeSeconds: 16, distractorMode: "mixed" }, //  4 target
  /* 8 */ { fishCount: 10, speed: 92, timeSeconds: 16, distractorMode: "mixed" }, // 5 target
];

export const TOTAL_LEVELS = LEVELS.length;

// Get the config for a level number (1-based), clamped to the defined range.
export function getLevelConfig(levelNumber: number): LevelConfig {
  const index = Math.min(Math.max(1, levelNumber), TOTAL_LEVELS) - 1;
  return LEVELS[index];
}
