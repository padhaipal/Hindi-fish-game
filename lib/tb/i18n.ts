// ---------------------------------------------------------------------------
// TB GAME — TWO LANGUAGES
// ---------------------------------------------------------------------------
// The game is written in Hindi: every scene, choice, result and fact lives in
// lib/tb/ as Hindi text. English is a translation layer on top, keyed by the
// same ids the audio recordings use — so `s_cough_clinic_result_fact` names one
// line of the game, and has a Hindi string, an English string, and (one day) a
// recording in each language.
//
// Nothing here duplicates the structure of the story. Add a scene and it exists
// in both languages at once; only its words need translating, and
// `npm run tb:audio` reports any line that has no English yet.
// ---------------------------------------------------------------------------

import { EN_LINES } from "./en";

export type Lang = "hi" | "en";

export const LANGS: Lang[] = ["hi", "en"];

/** What each language calls itself — for the switch, never translated. */
export const LANG_NAME: Record<Lang, string> = {
  hi: "हिंदी",
  en: "English",
};

/**
 * The words for one line of the game.
 * `id` is the line's audio id; `hindi` is the original, used as the fallback so
 * a missing translation shows real words rather than a blank or a key.
 */
export function line(lang: Lang, id: string, hindi: string): string {
  if (lang === "hi") return hindi;
  return EN_LINES[id] ?? hindi;
}

/** True if this line still needs translating (used by the coverage check). */
export function untranslated(id: string): boolean {
  return EN_LINES[id] === undefined;
}

// ---- the words around the game -------------------------------------------
// Buttons, titles and labels: not part of the story, never spoken.
export interface UiStrings {
  title: string;
  start: string;
  listen: string;
  moreGames: string;
  yourHome: string;
  next: string;
  howToPlay: string;
  begin: string;
  youWon: string;
  notThisTime: string;
  tryAgain: string;
  newHome: string;
  sameAgain: string;
  backToApp: string;
  health: string;
  money: string;
  household: string;
  months: string;
  nobodyIll: string;
  /** e.g. "2 ill at home" */
  someIll: (n: number) => string;
  switchTo: string;
}

export const UI: Record<Lang, UiStrings> = {
  hi: {
    title: "टीबी का सफ़र",
    start: "खेल शुरू करें",
    listen: "सुनिए",
    moreGames: "← और खेल",
    yourHome: "आपका घर",
    next: "आगे",
    howToPlay: "कैसे खेलें",
    begin: "शुरू करें",
    youWon: "आप जीत गए!",
    notThisTime: "इस बार नहीं",
    tryAgain: "फिर से कोशिश करें",
    newHome: "नया घर, नया सफ़र",
    sameAgain: "यही सफ़र फिर से",
    backToApp: "पाठ पर जाएं",
    health: "सेहत",
    money: "पैसा",
    household: "घर के लोग",
    months: "महीने",
    nobodyIll: "घर में कोई बीमार नहीं",
    someIll: (n) => `घर में ${n} बीमार`,
    switchTo: "English",
  },
  en: {
    title: "The TB Journey",
    start: "Start the game",
    listen: "Listen",
    moreGames: "← More games",
    yourHome: "Your household",
    next: "Next",
    howToPlay: "How to play",
    begin: "Begin",
    youWon: "You won!",
    notThisTime: "Not this time",
    tryAgain: "Try again",
    newHome: "New household, new journey",
    sameAgain: "Same journey again",
    backToApp: "Back to the lesson",
    health: "Health",
    money: "Money",
    household: "Your household",
    months: "Months",
    nobodyIll: "Nobody at home fell ill",
    someIll: (n) => (n === 1 ? "1 person at home is ill" : `${n} people at home are ill`),
    switchTo: "हिंदी",
  },
};

/** Where the other language lives, for the switch on the opening screen. */
export const OTHER_LANG: Record<Lang, Lang> = { hi: "en", en: "hi" };
export const LANG_PATH: Record<Lang, string> = { hi: "/tb", en: "/tb/en" };

/** The voice to ask a phone for. */
export const SPEECH_LANG: Record<Lang, string> = { hi: "hi-IN", en: "en-IN" };
