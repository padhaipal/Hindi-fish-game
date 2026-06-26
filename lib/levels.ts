// ---------------------------------------------------------------------------
// LEVEL SETTINGS
// ---------------------------------------------------------------------------
// Each level is one "round" of the pond game. Tweak these numbers freely to
// make the game easier or harder — every field is documented below.
//
//   - `fishCount`       : total number of fish swimming in the pond.
//   - `targetCount`     : how many of those fish carry the TARGET letter (the
//                         child must tap all of them). Must be <= fishCount.
//   - `speed`           : base swim speed in pixels-per-second. Bigger = faster.
//   - `timeSeconds`     : how long the timer bar lasts for this level.
//   - `distractorMode`  : how the non-target (distractor) fish are chosen:
//        "easy"        -> random letters that are clearly different.
//        "lookAlike"   -> prefer letters that LOOK similar to the target.
//        "soundAlike"  -> prefer letters that SOUND similar to the target.
//        "mixed"       -> a blend of look- and sound-alike distractors.
//
// EARLY levels: few fish, slow, easy distractors.
// LATER levels: more fish, faster, look/sound-alike distractors.
// ---------------------------------------------------------------------------

export type DistractorMode = "easy" | "lookAlike" | "soundAlike" | "mixed";

export interface LevelConfig {
  fishCount: number;
  targetCount: number;
  speed: number; // pixels per second
  timeSeconds: number;
  distractorMode: DistractorMode;
}

export const LEVELS: LevelConfig[] = [
  // Level 1 — gentle start: 3 fish, slow, only 1 to catch, easy distractors.
  { fishCount: 3, targetCount: 1, speed: 28, timeSeconds: 20, distractorMode: "easy" },

  // Level 2 — a few more fish, still slow and easy.
  { fishCount: 4, targetCount: 2, speed: 36, timeSeconds: 20, distractorMode: "easy" },

  // Level 3 — speed picks up a little.
  { fishCount: 5, targetCount: 2, speed: 46, timeSeconds: 18, distractorMode: "easy" },

  // Level 4 — introduce LOOK-alike distractors.
  { fishCount: 6, targetCount: 2, speed: 56, timeSeconds: 18, distractorMode: "lookAlike" },

  // Level 5 — more fish, introduce SOUND-alike distractors.
  { fishCount: 7, targetCount: 3, speed: 66, timeSeconds: 18, distractorMode: "soundAlike" },

  // Level 6 — busy pond, faster, mixed tricky distractors.
  { fishCount: 8, targetCount: 3, speed: 78, timeSeconds: 16, distractorMode: "mixed" },

  // Level 7 — hardest: many fast fish, all tricky.
  { fishCount: 9, targetCount: 3, speed: 92, timeSeconds: 16, distractorMode: "mixed" },
];

// Get the config for a level number (1-based). If the child goes past the last
// defined level, we keep looping the final (hardest) level so the game never
// "runs out".
export function getLevelConfig(levelNumber: number): LevelConfig {
  const index = Math.min(levelNumber - 1, LEVELS.length - 1);
  return LEVELS[Math.max(0, index)];
}

export const TOTAL_LEVELS = LEVELS.length;
