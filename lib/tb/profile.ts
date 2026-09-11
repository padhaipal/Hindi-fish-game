// ---------------------------------------------------------------------------
// TB GAME — LIFE SITUATION (dealt at random at the start of every game)
// ---------------------------------------------------------------------------
// Two people with TB do not face the same road. Before the first scene we deal
// the player a household, a kind of work, and one or two real risk factors.
// These change the starting meters and unlock extra scenes, so replaying the
// game teaches something new.
//
// The weights are rough real-world frequencies among people with TB in India
// (see docs/tb-game.md for the sources).
// ---------------------------------------------------------------------------

import type { HomeId, Member, Profile, RiskId, WorkId } from "./types";

export interface RiskInfo {
  id: RiskId;
  hi: string; // spoken label
  /** Health the player starts with (relative to 8/10). */
  health: number;
  /** Extra chance of a bad outcome, 0..1 — used by the engine. */
  danger: number;
  /** Roughly how often this is found alongside TB in India. */
  weight: number;
}

// Undernutrition is by far the biggest driver of TB in India, so it is dealt
// most often; HIV is rare here compared with Africa, so it is dealt rarely.
export const RISKS: RiskInfo[] = [
  { id: "kamzori", hi: "कमज़ोरी — वज़न बहुत कम है", health: -2, danger: 0.3, weight: 40 },
  { id: "bidi", hi: "बीड़ी — रोज़ पीते हैं", health: -1, danger: 0.2, weight: 25 },
  { id: "sharab", hi: "शराब — रोज़ पीते हैं", health: -1, danger: 0.25, weight: 15 },
  { id: "sugar", hi: "शुगर की बीमारी", health: -1, danger: 0.25, weight: 15 },
  { id: "dhool", hi: "काम में धुआँ और धूल", health: -1, danger: 0.1, weight: 20 },
  { id: "hiv", hi: "एच०आई०वी०", health: -2, danger: 0.35, weight: 5 },
];

export const WORK_HI: Record<WorkId, string> = {
  dihadi: "दिहाड़ी मज़दूरी — रोज़ कमाओ, रोज़ खाओ",
  dukan: "छोटी दुकान",
  kheti: "खेती और मज़दूरी",
};

export const HOME_HI: Record<HomeId, string> = {
  ekKamra: "एक कमरे का घर — सब साथ सोते हैं",
  doKamre: "दो कमरों का घर",
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Weighted draw, without repeats.
function drawRisks(count: number): RiskId[] {
  const pool = [...RISKS];
  const out: RiskId[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const total = pool.reduce((sum, r) => sum + r.weight, 0);
    let n = Math.random() * total;
    let idx = 0;
    for (let j = 0; j < pool.length; j++) {
      n -= pool[j].weight;
      if (n <= 0) {
        idx = j;
        break;
      }
    }
    out.push(pool[idx].id);
    pool.splice(idx, 1);
  }
  return out;
}

// A household of 3-5 people, always including at least one child — children
// who breathe TB air are the ones most likely to fall ill.
function dealFamily(): Member[] {
  const base: Member[] = [
    { id: "m1", kind: "woman", hi: "पत्नी", exposure: 0, protectedByTpt: false, infected: false },
    { id: "m2", kind: "child", hi: "बेटा", exposure: 0, protectedByTpt: false, infected: false },
  ];
  const extras: Member[] = [
    { id: "m3", kind: "child", hi: "बेटी", exposure: 0, protectedByTpt: false, infected: false },
    { id: "m4", kind: "elder", hi: "माँ", exposure: 0, protectedByTpt: false, infected: false },
  ];
  const n = 1 + Math.floor(Math.random() * 2); // 1 or 2 extra people
  return [...base, ...extras.slice(0, n)];
}

export function dealProfile(): Profile {
  return {
    work: pick<WorkId>(["dihadi", "dihadi", "dukan", "kheti"]),
    // Most TB in India is in crowded housing — one room is the common case.
    home: Math.random() < 0.65 ? "ekKamra" : "doKamre",
    risks: drawRisks(Math.random() < 0.55 ? 1 : 2),
    members: dealFamily(),
  };
}

export function riskInfo(id: RiskId): RiskInfo {
  return RISKS.find((r) => r.id === id) ?? RISKS[0];
}

export function hasRisk(profile: Profile, id: RiskId): boolean {
  return profile.risks.includes(id);
}
