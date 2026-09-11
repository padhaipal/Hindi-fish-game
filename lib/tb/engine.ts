// ---------------------------------------------------------------------------
// TB GAME — ENGINE
// ---------------------------------------------------------------------------
// Holds the rules: how a choice changes the meters, how TB spreads inside the
// house, and how the game ends. All of it is plain data + pure functions, so
// the React component only has to draw the current state.
//
// The numbers are game-balanced approximations of real statistics (WHO Global
// TB Report, India TB Report / NTEP, and the trials listed in docs/tb-game.md).
// They are tuned so that the choices a real doctor would recommend are also the
// choices that win the game.
// ---------------------------------------------------------------------------

import { dealProfile, riskInfo } from "./profile";
import type {
  Effect,
  Ending,
  EndingId,
  GameState,
  Member,
  Profile,
} from "./types";

export const MAX_METER = 10;
/** Drug-sensitive TB is treated for 6 months. That is the length of the road. */
export const TREATMENT_MONTHS = 6;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ---- starting state -------------------------------------------------------
export function newGame(profile?: Profile): GameState {
  const p = profile ?? dealProfile();
  // A healthy adult starts at 8/10. Undernutrition, diabetes, tobacco, alcohol
  // and HIV all start you lower — and all of them make TB deadlier.
  const startHealth = clamp(
    8 + p.risks.reduce((sum, id) => sum + riskInfo(id).health, 0),
    3,
    MAX_METER
  );
  // Daily-wage households have almost no cushion; a shop has a little more.
  const startMoney = p.work === "dihadi" ? 4 : p.work === "kheti" ? 5 : 6;

  return {
    sceneId: "s_cough",
    health: startHealth,
    money: startMoney,
    members: p.members.map((m) => ({ ...m })),
    profile: p,
    month: 0,
    missed: 0,
    resistant: false,
    infectious: true, // untreated pulmonary TB spreads from day one
    flags: {},
    learned: [],
  };
}

/** Extra danger carried by this player's life situation, 0..1. */
export function dangerLoad(s: GameState): number {
  return s.profile.risks.reduce((sum, id) => sum + riskInfo(id).danger, 0);
}

// ---- applying a choice ----------------------------------------------------
// A crowded one-room home makes every hour of untreated coughing count for
// more: TB spreads through breathed air, so small rooms mean more germs.
function homeFactor(s: GameState): number {
  return s.profile.home === "ekKamra" ? 1.4 : 1;
}

export function applyEffect(state: GameState, effect: Effect): GameState {
  const s: GameState = { ...state, members: state.members.map((m) => ({ ...m })) };

  if (effect.health) s.health = clamp(s.health + effect.health, 0, MAX_METER);
  if (effect.money) s.money = clamp(s.money + effect.money, 0, MAX_METER);
  if (effect.month) s.month = Math.max(0, s.month + effect.month);
  if (effect.missed) s.missed = Math.max(0, s.missed + effect.missed);
  if (effect.resistant !== undefined) s.resistant = effect.resistant;
  if (effect.infectious !== undefined) s.infectious = effect.infectious;

  if (effect.exposeAll) {
    const delta = effect.exposeAll;
    // Germs can only be shared while the player is still infectious. Protection
    // (a negative number) always counts.
    const applied = delta > 0 ? (s.infectious ? delta * homeFactor(s) : 0) : delta;
    s.members = s.members.map((m) => ({
      ...m,
      exposure: clamp(m.exposure + applied, 0, 100),
    }));
  }

  if (effect.tpt) {
    // TB preventive treatment for household contacts — mainly the children.
    s.members = s.members.map((m) => ({ ...m, protectedByTpt: true }));
  }

  if (effect.setFlags) {
    s.flags = { ...s.flags };
    for (const f of effect.setFlags) s.flags[f] = true;
  }

  return s;
}

/**
 * Take one choice: apply its effect, then deal with the two things that can
 * only happen between scenes.
 *
 *  1. When the medicine has been working for three to four weeks the player
 *     stops being infectious — so this is the moment the household finds out
 *     who caught TB while the air was still full of germs.
 *  2. A house with nothing left to spend cannot eat properly, and hunger
 *     costs health. That is how catastrophic costs kill.
 */
export function advance(state: GameState, effect: Effect): GameState {
  const before = state.infectious;
  let s = applyEffect(state, effect);

  if (before && !s.infectious) s = resolveInfections(s);
  if (s.money === 0 && (effect.money ?? 0) < 0) {
    s = { ...s, health: clamp(s.health - 1, 0, MAX_METER) };
  }
  return s;
}

// ---- TB spreading in the house -------------------------------------------
/**
 * Chance (0..1) that this household member falls ill with TB, given how much
 * infected air they have breathed. Small children and old people catch it more
 * easily; preventive treatment cuts the risk by about 80%.
 */
export function infectionChance(m: Member): number {
  const kindFactor = m.kind === "child" ? 1.25 : m.kind === "elder" ? 1.15 : 1;
  const base = (m.exposure / 100) * kindFactor;
  return clamp(m.protectedByTpt ? base * 0.2 : base, 0, 0.95);
}

/** Roll for each not-yet-infected member. Called when the germs stop spreading. */
export function resolveInfections(state: GameState): GameState {
  return {
    ...state,
    members: state.members.map((m) =>
      m.infected ? m : { ...m, infected: Math.random() < infectionChance(m) }
    ),
  };
}

export function infectedCount(s: GameState): number {
  return s.members.filter((m) => m.infected).length;
}

/** How exposed the household is right now, 0..10 — the family meter. */
export function householdRisk(s: GameState): number {
  if (s.members.length === 0) return 0;
  const worst = Math.max(...s.members.map((m) => infectionChance(m)));
  return Math.round(worst * MAX_METER);
}

/**
 * Has the player run out of health? The how-to-play screen promises that an
 * empty health meter is the end, so the game checks it after every choice
 * rather than only when a story path happens to reach an ending.
 */
export function isDead(s: GameState): boolean {
  return s.health <= 0;
}

// ---- endings --------------------------------------------------------------
export const ENDINGS: Record<EndingId, Ending> = {
  curedClean: {
    id: "curedClean",
    art: "strong",
    win: true,
    hi: "आप पूरी तरह ठीक हो गए। घर में किसी को टीबी नहीं हुई। आप जीत गए!",
    factHi:
      "पूरा छह महीने का इलाज करने वाले दस में से नौ लोग ठीक हो जाते हैं। दवा शुरू करने के तीन-चार हफ़्ते बाद बीमारी दूसरों में फैलनी बंद हो जाती है।",
  },
  curedInfected: {
    id: "curedInfected",
    art: "family",
    win: false,
    hi: "आप ठीक हो गए — पर घर में किसी और को टीबी हो गई। अब उसका भी इलाज करना होगा।",
    factHi:
      "टीबी साँस से फैलती है। जल्दी जाँच, खिड़की खुली रखना, मुँह ढकना, और बच्चों को बचाव की दवा — इन्हीं से घर के लोग बचते हैं।",
  },
  curedResistant: {
    id: "curedResistant",
    art: "strong",
    win: false,
    hi: "आप बच तो गए, पर बीच में दवा छूटने से टीबी ज़िद्दी हो गई थी। इलाज बहुत लंबा और भारी पड़ा।",
    factHi:
      "बीच में दवा छोड़ने से टीबी के कीड़े दवा को हरा देते हैं। फिर वही दवा काम नहीं करती और ठीक होने का मौका कम हो जाता है।",
  },
  died: {
    id: "died",
    art: "gone",
    win: false,
    hi: "इलाज देर से हुआ और शरीर हार गया।",
    factHi:
      "बिना इलाज की टीबी से हर तीन में से लगभग दो लोग मर जाते हैं। पर सरकारी अस्पताल में जाँच और दवा मुफ़्त है — समय पर इलाज से जान बच जाती है।",
  },
  spreading: {
    id: "spreading",
    art: "smallHome",
    win: false,
    hi: "इलाज नहीं हुआ। खाँसी चलती रही और घर के लोग भी बीमार पड़ गए।",
    factHi:
      "इलाज न कराने वाला एक व्यक्ति साल भर में दस से पंद्रह लोगों तक टीबी पहुँचा सकता है।",
  },
};

/**
 * Which ending the player has earned. Called at the finish of the road, after
 * the last household infection rolls.
 *
 * Health doubles as the chance of survival, so a player who arrives at the end
 * badly weakened can still lose — but a player who did everything right always
 * lives. That matches real treatment outcomes without punishing good play.
 */
export function finalEnding(s: GameState): EndingId {
  if (s.health <= 0) return "died";
  if (s.health < 5) {
    const deathChance = (5 - s.health) * 0.15;
    if (Math.random() < deathChance) return "died";
  }
  if (infectedCount(s) > 0) return "curedInfected";
  if (s.resistant) return "curedResistant";
  return "curedClean";
}

/** Colour band for the health thermometer. */
export function healthColor(health: number): string {
  if (health >= 8) return "#22a34a";
  if (health >= 6) return "#8bc34a";
  if (health >= 4) return "#f4b400";
  if (health >= 2) return "#f2711c";
  return "#d93025";
}
