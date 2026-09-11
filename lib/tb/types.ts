// ---------------------------------------------------------------------------
// TB GAME — TYPES
// ---------------------------------------------------------------------------
// "टीबी का सफ़र" (the TB journey) is a decision-path game for tb.care.
//
// The player is a person in a poor North Indian household who develops TB
// symptoms. Every screen is one SCENE: a line drawing, one short spoken line of
// simple Hindustani, and 2-4 picture OPTIONS. Each option changes the player's
// meters (health / money / how much their family is exposed), teaches one true
// fact about TB, and decides which scene comes next.
//
// You win by finishing the game ALIVE, CURED, and with NOBODY ELSE INFECTED.
// ---------------------------------------------------------------------------

// ---- art ------------------------------------------------------------------
// Big line-drawing shown at the top of a scene.
export type ArtName =
  | "cough"
  | "coughBlood"
  | "weak"
  | "chemist"
  | "quack"
  | "clinic"
  | "privateClinic"
  | "labTest"
  | "goodNews"
  | "badNews"
  | "pillsDaily"
  | "smallHome"
  | "family"
  | "familyTest"
  | "food"
  | "money"
  | "work"
  | "travel"
  | "calendar"
  | "neighbours"
  | "strong"
  | "resting"
  | "gone";

// Small line-drawing on an option button (and in the result panel).
export type IconName =
  | "wait"
  | "chemist"
  | "quack"
  | "clinic"
  | "privateClinic"
  | "spit"
  | "yes"
  | "no"
  | "pill"
  | "pillFood"
  | "stopPill"
  | "mask"
  | "window"
  | "sleepApart"
  | "familyTest"
  | "child"
  | "food"
  | "money"
  | "loan"
  | "work"
  | "rest"
  | "bus"
  | "phone"
  | "bidi"
  | "sharab"
  | "talk"
  | "hide"
  | "help"
  | "doctor";

// ---- household ------------------------------------------------------------
export type MemberKind = "man" | "woman" | "child" | "elder";

export interface Member {
  id: string;
  kind: MemberKind;
  hi: string; // "पत्नी", "बेटा" ... (spoken, not required reading)
  /** How much TB-laden air this person has breathed, 0..100. */
  exposure: number;
  /** Given TB preventive treatment (TPT) after contact screening. */
  protectedByTpt: boolean;
  /** Caught TB. Losing even one means the player has not fully won. */
  infected: boolean;
}

// ---- life situation -------------------------------------------------------
// Dealt at random at the start of a game. These are the real risks that decide
// how hard this player's road will be (and which extra scenes they meet).
export type RiskId =
  | "kamzori" // undernutrition — low body weight
  | "sugar" // diabetes
  | "bidi" // tobacco / bidi smoking
  | "sharab" // alcohol
  | "hiv" // HIV
  | "dhool"; // dust / smoke at home or work

export type WorkId = "dihadi" | "dukan" | "kheti";
export type HomeId = "ekKamra" | "doKamre";

export interface Profile {
  work: WorkId;
  home: HomeId;
  risks: RiskId[];
  members: Member[];
}

// ---- game state -----------------------------------------------------------
export interface GameState {
  sceneId: string;
  /** 0..10 — health AND chance of survival. Shown as the colour thermometer. */
  health: number;
  /** 0..10 — money left in the house. 0 means catastrophic costs. */
  money: number;
  members: Member[];
  profile: Profile;
  /** Months of correct treatment completed, 0..6 (0..6 again if drug-resistant). */
  month: number;
  /** Months of treatment missed / skipped. Drives drug resistance. */
  missed: number;
  /** True once the player's TB became drug-resistant. */
  resistant: boolean;
  /** True while the player can still spread TB (until 2 weeks of real medicine). */
  infectious: boolean;
  flags: Record<string, boolean>;
  /** Facts the player has been shown — used for the end-of-game recap. */
  learned: string[];
}

// ---- scenes ---------------------------------------------------------------
export interface Effect {
  health?: number;
  money?: number;
  /** Added to every household member's exposure (negative = protection). */
  exposeAll?: number;
  month?: number;
  missed?: number;
  setFlags?: string[];
  /** Give TB preventive treatment to the children/contacts. */
  tpt?: boolean;
  resistant?: boolean;
  infectious?: boolean;
}

export type Tone = "good" | "bad" | "mixed";

export interface Result {
  tone: Tone;
  /** What happened, in simple Hindustani. */
  hi: string;
  /** The true TB fact this choice teaches. This is the learning. */
  factHi: string;
  icon: IconName;
}

export interface Option {
  id: string;
  hi: string;
  icon: IconName;
  effect: Effect;
  result: Result;
  next: string | ((s: GameState) => string);
  /** Options can depend on the player's life situation. */
  show?: (s: GameState) => boolean;
}

export interface Scene {
  id: string;
  art: ArtName;
  /** The spoken line. Also printed, but the game is playable without reading. */
  hi: string;
  /** Optional second line, e.g. the doctor speaking. */
  subHi?: string;
  options: Option[];
  /** Set when arriving at this scene (e.g. a month passing). */
  onEnter?: Effect;
}

export type EndingId =
  | "curedClean"
  | "curedInfected"
  | "curedResistant"
  | "died"
  | "spreading";

export interface Ending {
  id: EndingId;
  art: ArtName;
  win: boolean;
  hi: string;
  factHi: string;
}
