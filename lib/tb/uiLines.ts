// ---------------------------------------------------------------------------
// TB GAME — THE SPOKEN LINES THAT ARE NOT PART OF THE STORY
// ---------------------------------------------------------------------------
// The scenes live in lib/tb/scenes/. These are the other lines the game says:
// the opening line, the "your household" screen, and what each meter says when
// it is tapped.
//
// Every one of them is a FIXED sentence with a fixed audio id — no numbers
// spliced in — so each can be recorded once as /public/audio/tb/<id>.mp3.
// A meter says which BAND it is in ("you are getting weak"), never a number.
//
// This file is the single source of truth for these lines: the game reads them
// from here, and so does `npm run tb:audio`, which writes the recording script.
// ---------------------------------------------------------------------------

export interface SpokenLine {
  id: string;
  hi: string;
  /** Where in the game it is heard — for the recording script only. */
  where: string;
}

export const INTRO_LINE =
  "छह महीने का इलाज पूरा कीजिए। ज़िंदा रहिए, ठीक हो जाइए, और घर में किसी को टीबी मत होने दीजिए।";

export const LIFE_INTRO = "यह आपका घर है।";
export const LIFE_START = "अब आपको खाँसी शुरू हुई है। आगे के फ़ैसले आपके हैं।";

export const HEALTH_LINES = {
  good: { id: "meter_health_good", hi: "आपकी सेहत ठीक है।" },
  mid: { id: "meter_health_mid", hi: "आप कमज़ोर हो रहे हैं। ध्यान रखिए।" },
  low: { id: "meter_health_low", hi: "आपकी हालत ख़राब है। जान का ख़तरा है।" },
} as const;

export const MONEY_LINES = {
  ok: { id: "meter_money_ok", hi: "घर में अभी कुछ पैसा है।" },
  low: { id: "meter_money_low", hi: "घर का पैसा लगभग खत्म हो गया है।" },
} as const;

export const FAMILY_LINES = {
  clear: { id: "meter_family_clear", hi: "घर में अभी किसी को टीबी नहीं हुई है।" },
  ill: { id: "meter_family_ill", hi: "घर में किसी को टीबी हो गई है।" },
} as const;

/** Everything above, in the order a voice artist would record it. */
export const UI_LINES: SpokenLine[] = [
  { id: "intro", hi: INTRO_LINE, where: "पहली स्क्रीन" },
  { id: "life_intro", hi: LIFE_INTRO, where: "आपका घर" },
  { id: "life_start", hi: LIFE_START, where: "आपका घर" },
  { ...HEALTH_LINES.good, where: "सेहत का मीटर दबाने पर" },
  { ...HEALTH_LINES.mid, where: "सेहत का मीटर दबाने पर" },
  { ...HEALTH_LINES.low, where: "सेहत का मीटर दबाने पर" },
  { ...MONEY_LINES.ok, where: "पैसे का मीटर दबाने पर" },
  { ...MONEY_LINES.low, where: "पैसे का मीटर दबाने पर" },
  { ...FAMILY_LINES.clear, where: "घर के लोग दबाने पर" },
  { ...FAMILY_LINES.ill, where: "घर के लोग दबाने पर" },
];
