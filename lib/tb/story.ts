// ---------------------------------------------------------------------------
// TB GAME — STORY INDEX
// ---------------------------------------------------------------------------
// Puts the two halves of the story together and gives the component a simple
// way to look a scene up by id. Endings are not scenes — they are ids starting
// with "e_", handled by the component.
// ---------------------------------------------------------------------------

import { SCENES_DIAGNOSIS } from "./scenes/diagnosis";
import { SCENES_TREATMENT } from "./scenes/treatment";
import type { GameState, Scene } from "./types";

export const FIRST_SCENE = "s_cough";

export const SCENES: Scene[] = [...SCENES_DIAGNOSIS, ...SCENES_TREATMENT];

const BY_ID = new Map(SCENES.map((s) => [s.id, s]));

export function getScene(id: string): Scene | undefined {
  return BY_ID.get(id);
}

export function isEnding(id: string): boolean {
  return id.startsWith("e_");
}

/** Resolve an option's `next`, which may depend on the state. */
export function nextSceneId(
  next: string | ((s: GameState) => string),
  state: GameState
): string {
  return typeof next === "function" ? next(state) : next;
}

// A scene reached with an option the player cannot see (e.g. one that depends on
// their life situation) would be a dead end, so check the story at module load
// in development — a missing id is a content bug, not a player mistake.
if (process.env.NODE_ENV !== "production") {
  for (const scene of SCENES) {
    for (const opt of scene.options) {
      if (typeof opt.next === "string" && !isEnding(opt.next) && !BY_ID.has(opt.next)) {
        // eslint-disable-next-line no-console
        console.warn(`TB story: scene "${scene.id}" option "${opt.id}" -> unknown "${opt.next}"`);
      }
    }
  }
}
