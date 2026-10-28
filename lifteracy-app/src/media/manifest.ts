// What the screen shows and says for each state-transition id (stid) the
// lesson machine emits. On WhatsApp these are media_metadata rows looked up by
// stid, falling back to a generic `_-…` row when a word or letter has none of
// its own (pp-sketch MediaMetaDataService.findMediaByStateTransitionId). Here
// the generic rows are the STEPS below, keyed by the stid without its word or
// letter prefix, and filled in from that prefix.
import { letterMedia } from "./letters";

export type Visual =
  | { kind: "word"; text: string }
  | { kind: "letter"; char: string }
  | { kind: "picture"; char: string }
  | { kind: "pictureLetter"; char: string }
  | { kind: "sticker"; emoji: string };

export type Sound = { src: string } | { say: string };

export interface Media {
  visual?: Visual;
  sounds: Sound[];
}

const letterSound = (char: string): Sound => {
  const m = letterMedia(char);
  return m.letterAudio ? { src: m.letterAudio } : { say: char };
};

const pictureSound = (char: string): Sound => {
  const m = letterMedia(char);
  return m.pictureAudio ? { src: m.pictureAudio } : { say: m.pictureName };
};

const READ_WORD = "क्या तुम यह शब्द पढ़ सकते हो? माइक दबाकर पढ़ो।";
const READ_AGAIN = "अब यह शब्द फिर से पढ़ो।";
const WHAT_LETTER = "इस अक्षर को देखो। यह कौन सा अक्षर है?";
const WHAT_PICTURE = "यह चित्र देखो। यह क्या है?";
const RIGHT = "हाँ! बिल्कुल सही।";
const ALMOST = "लगभग सही! एक बार और पढ़ो।";

const firstSoundQ = (c: string) => `${letterMedia(c).pictureName} की पहली आवाज़ क्या है?`;

// p = the stid's prefix: the word, or for letter steps the letter.
const STEPS: Record<string, (p: string) => Media> = {
  // ── the word ──
  "start-word-initial": (w) => ({ visual: { kind: "word", text: w }, sounds: [{ say: READ_WORD }] }),
  "word-complete-correct-first": () => ({
    visual: { kind: "sticker", emoji: "🌟" },
    sounds: [{ say: "वाह! तुमने पहली बार में बिल्कुल सही पढ़ा।" }],
  }),
  "word-complete-correct-retry": () => ({
    visual: { kind: "sticker", emoji: "👍" },
    sounds: [{ say: "शाबाश! तुमने सही पढ़ा।" }],
  }),
  "word-complete-maxErrors": (w) => ({
    visual: { kind: "word", text: w },
    sounds: [{ say: `यह शब्द है, ${w}। कोई बात नहीं, अगली बार फिर पढ़ेंगे।` }],
  }),
  "word-word-endMatra-first": (w) => ({ visual: { kind: "word", text: w }, sounds: [{ say: ALMOST }] }),
  "word-word-endMatra-retry": (w) => ({ visual: { kind: "word", text: w }, sounds: [{ say: ALMOST }] }),
  "word-word-middleMatra-first": (w) => ({ visual: { kind: "word", text: w }, sounds: [{ say: ALMOST }] }),
  "word-word-middleMatra-retry": (w) => ({ visual: { kind: "word", text: w }, sounds: [{ say: ALMOST }] }),
  "word-word-insertion-first": (w) => ({ visual: { kind: "word", text: w }, sounds: [{ say: ALMOST }] }),
  "word-word-insertion-retry": (w) => ({ visual: { kind: "word", text: w }, sounds: [{ say: ALMOST }] }),
  "word-word-loopBack": (w) => ({ visual: { kind: "word", text: w }, sounds: [{ say: READ_AGAIN }] }),
  // back to the word after the letter drill
  "letter-word-correct-last": (w) => ({
    visual: { kind: "word", text: w },
    sounds: [{ say: `${RIGHT} ${READ_AGAIN}` }],
  }),
  "letterImage-word-correct-last": (w) => ({
    visual: { kind: "word", text: w },
    sounds: [{ say: `${RIGHT} ${READ_AGAIN}` }],
  }),
  "letterImage-word-maxErrors-last": (w) => ({
    visual: { kind: "word", text: w },
    sounds: [{ say: READ_AGAIN }],
  }),
  "letterNoImage-word-correct-first-last": (w) => ({
    visual: { kind: "word", text: w },
    sounds: [{ say: `${RIGHT} ${READ_AGAIN}` }],
  }),
  "letterNoImage-word-correct-retry-last": (w) => ({
    visual: { kind: "word", text: w },
    sounds: [{ say: `${RIGHT} ${READ_AGAIN}` }],
  }),
  "letterNoImage-word-wrong-last": (w) => ({
    visual: { kind: "word", text: w },
    sounds: [{ say: READ_AGAIN }],
  }),

  // ── the letter ──
  "word-routeWrongLetter-drillLetters": (c) => ({
    visual: { kind: "letter", char: c },
    sounds: [{ say: WHAT_LETTER }],
  }),
  "letter-routeWrongLetter-correct-more": (c) => ({
    visual: { kind: "letter", char: c },
    sounds: [{ say: `${RIGHT} ${WHAT_LETTER}` }],
  }),
  "letterImage-routeWrongLetter-correct-more": (c) => ({
    visual: { kind: "letter", char: c },
    sounds: [{ say: `${RIGHT} ${WHAT_LETTER}` }],
  }),
  "letterImage-routeWrongLetter-maxErrors-more": (c) => ({
    visual: { kind: "letter", char: c },
    sounds: [{ say: WHAT_LETTER }],
  }),
  "letterNoImage-routeWrongLetter-correct-first-more": (c) => ({
    visual: { kind: "letter", char: c },
    sounds: [{ say: `${RIGHT} ${WHAT_LETTER}` }],
  }),
  "letterNoImage-routeWrongLetter-correct-retry-more": (c) => ({
    visual: { kind: "letter", char: c },
    sounds: [{ say: `${RIGHT} ${WHAT_LETTER}` }],
  }),
  "letterNoImage-routeWrongLetter-wrong-more": (c) => ({
    visual: { kind: "letter", char: c },
    sounds: [{ say: WHAT_LETTER }],
  }),
  "letterNoImage-letterNoImage-wrong-first": (c) => ({
    visual: { kind: "letter", char: c },
    sounds: [{ say: "सुनो। यह अक्षर है" }, letterSound(c), { say: "बोलो।" }],
  }),

  // ── the picture ──
  "letter-image-wrong": (c) => ({
    visual: { kind: "picture", char: c },
    sounds: [{ say: WHAT_PICTURE }],
  }),
  "image-image-wrong-first": (c) => ({
    visual: { kind: "picture", char: c },
    sounds: [{ say: "यह है" }, pictureSound(c), { say: "बोलो।" }, pictureSound(c)],
  }),

  // ── the picture-letter card ──
  "image-letterImage-correct": (c) => ({
    visual: { kind: "pictureLetter", char: c },
    sounds: [{ say: `हाँ, ${letterMedia(c).pictureName}!` }, { say: firstSoundQ(c) }],
  }),
  "image-letterImage-maxErrors": (c) => ({
    visual: { kind: "pictureLetter", char: c },
    sounds: [{ say: "यह है" }, pictureSound(c), { say: firstSoundQ(c) }],
  }),
  "letterImage-letterImage-wrong-first": (c) => ({
    visual: { kind: "pictureLetter", char: c },
    sounds: [
      { say: `सुनो। ${letterMedia(c).pictureName} की पहली आवाज़ है` },
      letterSound(c),
      { say: "अब तुम बोलो।" },
    ],
  }),
  "letterImage-letterImage-wrong-second": (c) => {
    const m = letterMedia(c);
    return {
      visual: { kind: "pictureLetter", char: c },
      sounds: [
        { say: "सुनो।" },
        m.pictureLetterAudio ? { src: m.pictureLetterAudio } : { say: `${m.pictureName}। ${c}।` },
        { say: "अब तुम बोलो।" },
      ],
    };
  },

  // Appended after a turn whose wrong answer pinned a letter at the lowest score.
  "letter-score-floor": () => ({ sounds: [{ say: "कोई बात नहीं। धीरे-धीरे सीख जाओगे।" }] }),
};

export function mediaFor(stid: string): Media {
  const dash = stid.indexOf("-");
  if (dash > 0) {
    const step = STEPS[stid.slice(dash + 1)];
    if (step) return step(stid.slice(0, dash));
  }
  console.warn(`no media for stid ${stid}`);
  return { sounds: [] };
}

// A turn can return several stids (e.g. an answer plus the score-floor
// note): play all their sounds, show the last picture.
export function mediaForTurn(stids: string[]): Media {
  const all = stids.map(mediaFor);
  return {
    visual: [...all].reverse().find((m) => m.visual)?.visual,
    sounds: all.flatMap((m) => m.sounds),
  };
}
