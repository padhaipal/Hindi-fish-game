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

// ---------------------------------------------------------------------------
// THE ORDER OF THE STORY — why the game always ends
// ---------------------------------------------------------------------------
// Every scene has a place in this list, and **every choice must lead to a scene
// further down it**. That one rule makes the story a one-way road: there is no
// way back to a scene you have already seen, so no sequence of choices can
// loop, and the game must reach an ending. The longest possible game is the
// length of the longest path through this order.
//
// It is not a schedule — a choice may skip far ahead (going private jumps
// straight to the diagnosis) — only a direction.
//
// The one place this is worth understanding: `s_cough3` ("too weak to work")
// sits AFTER the sputum scenes rather than before them. Delay in this game
// makes you sicker, and being sicker has to move you forward into a worse
// situation rather than back into the one you just refused. Before this order
// existed, refusing the sputum test sent you back to `s_cough3`, whose only
// way out was the same sputum scene — a loop a player could ride for ever.
//
// `checkStory()` below enforces it, and `npm run tb:audio` fails on a breach.
// ---------------------------------------------------------------------------
export const SCENE_ORDER: string[] = [
  // finding out
  "s_cough",
  "s_ask",
  "s_cough2",
  "s_sputum",
  "s_sputum2",
  "s_cough3",
  "s_result",
  "s_comorbid",
  "s_docs",
  // the house
  "s_tell",
  "s_home",
  "s_contacts",
  // the six months
  "s_month1_side",
  "s_money",
  "s_food",
  "s_habit",
  "s_month2_test",
  "s_better",
  "s_travel",
  "s_stigma",
  "s_neighbour",
  "s_month6",
  // the drug-resistant road, which only ever comes after the above
  "s_relapse",
  "s_mdr",
];

const ORDER = new Map(SCENE_ORDER.map((id, i) => [id, i + 1]));

/** Where a scene sits in the story, 1-based. 0 means "not in SCENE_ORDER". */
export function stageOf(sceneId: string): number {
  return ORDER.get(sceneId) ?? 0;
}

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

/**
 * Everything wrong with the story, as a list of sentences. Empty means the
 * story is sound: every choice leads somewhere that exists, and always further
 * along SCENE_ORDER, so the game cannot loop.
 *
 * Run by `npm run tb:audio`, and in development when this module loads.
 */
export function checkStory(): string[] {
  const problems: string[] = [];

  for (const scene of SCENES) {
    if (!ORDER.has(scene.id)) {
      problems.push(`scene "${scene.id}" is missing from SCENE_ORDER — give it a place in the story`);
    }
  }
  for (const id of SCENE_ORDER) {
    if (!BY_ID.has(id)) problems.push(`SCENE_ORDER lists "${id}", which is not a scene`);
  }

  for (const scene of SCENES) {
    for (const opt of scene.options) {
      if (typeof opt.next !== "string") continue; // decided at runtime; checked when taken
      if (isEnding(opt.next)) continue;
      if (!BY_ID.has(opt.next)) {
        problems.push(`"${scene.id}" option "${opt.id}" leads to "${opt.next}", which is not a scene`);
        continue;
      }
      const from = stageOf(scene.id);
      const to = stageOf(opt.next);
      if (from && to && to <= from) {
        problems.push(
          `"${scene.id}" option "${opt.id}" goes BACKWARDS to "${opt.next}" ` +
            `(${from} -> ${to}). Every choice must lead further along SCENE_ORDER, ` +
            `or the game can loop for ever.`
        );
      }
    }
  }

  return problems;
}

// A story that can loop is a content bug, not a player mistake, so say so as
// soon as the module loads in development.
if (process.env.NODE_ENV !== "production") {
  for (const problem of checkStory()) {
    // eslint-disable-next-line no-console
    console.warn(`TB story: ${problem}`);
  }
}
