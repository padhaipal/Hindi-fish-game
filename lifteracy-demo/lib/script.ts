// ---------------------------------------------------------------------------
// SCRIPT: everything the demo bot says, in English and Hindi, plus how it
// decides whether an answer was right.
// ---------------------------------------------------------------------------
// The flow (see components/Chat.tsx):
//   word ──right──▶ 👍 sticker
//     └─wrong──▶ letter "what is this?" ──right──▶ back to word
//                  └─wrong──▶ picture "what is this?" ──▶ "first sound?" ──▶ back to word
//
// A voice note is a list of segments: spoken text (browser text-to-speech) or
// a recorded clip (an mp3 path). Any voice note with a `rec` key is first tried
// as a recording at /audio/voice/<lang>/<rec>.mp3 and only falls back to
// text-to-speech if that file is missing. See README.md for the list.
// ---------------------------------------------------------------------------

import { firstConsonant, normalize, tokens } from "./match";

export type Lang = "en" | "hi";

export type Segment = { say: string } | { src: string };

export interface VoiceNote {
  rec?: string; // optional recording key: /audio/voice/<lang>/<rec>.mp3
  segments: Segment[];
}

export type Picture = { emoji: string } | { icon: "lattu" };

export interface LetterInfo {
  char: string;
  sound?: string; // recorded letter sound
  picture: Picture;
  pictureName: string;
  // Was this answer to "what is this letter?" / "what's the first sound?" right?
  isLetter: (t: string) => boolean;
  // Was this answer to "what is this?" (the picture) right?
  isPicture: (t: string) => boolean;
  // Bot lines that mention this letter / picture.
  pictureWrong: VoiceNote; // "This is a tiger. Can you say tiger?"
  pictureWrongMoveOn: VoiceNote; // "This is a tiger. What is the first sound in tiger?"
  pictureRight: VoiceNote; // "Yes, tiger! What is the first sound in tiger?"
  firstSoundRight: VoiceNote;
  firstSoundWrong: VoiceNote;
}

export interface Script {
  lang: Lang;
  sttLang: string;
  ttsLang: string;
  word: string;
  letters: LetterInfo[];
  isWord: (t: string) => boolean;
  // Index of the letter the learner most likely got wrong.
  wrongLetter: (t: string) => number;
  text: {
    intro: string;
    noStt: string;
    didntHear: string;
    btnRight: string;
    btnWrong: string;
    firstTry: string;
    win: string;
    tryAgain: string;
    startOver: string;
    typeHint: string;
  };
  voice: {
    readWord: VoiceNote;
    readAgain: VoiceNote;
    whatLetter: VoiceNote;
    letterRight: VoiceNote;
    whatPicture: VoiceNote;
    wellDone: VoiceNote;
  };
}

const say = (s: string): Segment => ({ say: s });
const src = (s: string): Segment => ({ src: s });
const v = (rec: string, ...segments: Segment[]): VoiceNote => ({ rec, segments });

const anyToken = (t: string, re: RegExp) => tokens(t).some((w) => re.test(w));

// ---------------------------------------------------------------- ENGLISH ---

const EN_C = "/audio/sounds/en/c.mp3";
const EN_A = "/audio/sounds/en/a.mp3";
const EN_T = "/audio/sounds/en/t.mp3";

function enLetter(
  key: string,
  char: string,
  sound: string,
  emoji: string,
  name: string,
  letterRe: RegExp,
  pictureRe: RegExp,
): LetterInfo {
  return {
    char,
    sound,
    picture: { emoji },
    pictureName: name,
    isLetter: (t) => anyToken(t, letterRe),
    isPicture: (t) => anyToken(t, pictureRe),
    pictureWrong: v(`picture-wrong-${key}`, say(`This is a ${name}. Can you say ${name}?`)),
    pictureWrongMoveOn: v(
      `picture-wrong-again-${key}`,
      say(`This is a ${name}. What is the first sound in ${name}?`),
    ),
    pictureRight: v(`picture-right-${key}`, say(`Yes, a ${name}! What is the first sound in ${name}?`)),
    firstSoundRight: v(
      `first-sound-right-${key}`,
      say(`Well done! ${name} starts with`),
      src(sound),
      say(`This letter says`),
      src(sound),
    ),
    firstSoundWrong: v(
      `first-sound-wrong-${key}`,
      say(`Listen. ${name} starts with`),
      src(sound),
      say(`This letter says`),
      src(sound),
    ),
  };
}

const EN: Script = {
  lang: "en",
  sttLang: "en-IN",
  ttsLang: "en-IN",
  word: "cat",
  letters: [
    enLetter("c", "c", EN_C, "🚗", "car", /^(c|cc|see|sea|si|cee|k|kay|ka|kuh|cuh|ke|key|kh|kk)$/, /^(car|cars|kar|carr|kaar|caar)$/),
    enLetter("a", "a", EN_A, "🍎", "apple", /^(a|ay|aye|eh|ah|aa|uh|ae|air|hey|ha)$/, /^(apple|apples|appel|aple)$/),
    enLetter("t", "t", EN_T, "🐯", "tiger", /^(t|tt|tee|tea|ti|tuh|ta|tah|tu|to|too|two|the)$/, /^(tiger|tigers|tigar|tigger)$/),
  ],
  isWord: (t) => anyToken(t, /^(cat|cats|kat|katt|catt|khat)$/),
  wrongLetter: (t) => {
    const w = (tokens(t)[0] ?? "").replace(/s$/, "");
    if (!/^[ckq]/.test(w)) return 0; // didn't start with /k/
    if (!/t$/.test(w)) return 2; // didn't end with /t/  (cap, can, cab…)
    return 1; // the vowel (cut, cot, kit…)
  },
  text: {
    intro:
      "👋 Hi! I'm *Lifteracy*, an AI reading tutor that lives on WhatsApp.\n\n" +
      "Children who can't read yet learn with me by sending voice messages back and forth. " +
      "Every child gets a personal lesson: when they misread a letter, I zoom in on that letter, " +
      "give a picture hint, and build back up to the word.\n\n" +
      "ℹ️ This is just a demo that runs in your browser.\n\n" +
      "👉 *Tip:* when I send you a word, try reading at least one letter wrong " +
      "(say “cap” instead of “cat”) so you can experience the learning loop.",
    noStt:
      "ℹ️ This browser can't turn speech into text (Chrome works best). " +
      "You can still send voice messages and then tap a button to say whether you were right, or just type your answer.",
    didntHear: "🎧 Sorry, I couldn't hear that clearly. Try again, or tap below:",
    btnRight: "✅ I got it right",
    btnWrong: "❌ I got it wrong",
    firstTry:
      "You read it right first time! In the real app the next word would be a little harder.\n\n" +
      "To see how Lifteracy teaches, try again and read one letter wrong.",
    win:
      "🎉 That's the Lifteracy learning loop!\n\n" +
      "Misread word ➜ that letter ➜ a picture hint ➜ its first sound ➜ back to the word.\n\n" +
      "In the real chatbot this adapts across hundreds of words, and teachers can see every child's progress, letter by letter.",
    tryAgain: "🔁 Try again",
    startOver: "🌐 Change language",
    typeHint: "Message",
  },
  voice: {
    readWord: v("read-word", say("Can you read this word? Tap the microphone, and send me a voice message.")),
    readAgain: v("read-again", say("Now read the word again.")),
    whatLetter: v("what-letter", say("Let's look at this letter. What is this letter?")),
    letterRight: v("letter-right", say("Yes! That's right.")),
    whatPicture: v("what-picture", say("Here's a hint. What is this?")),
    wellDone: v("well-done", say("Brilliant! You read it perfectly.")),
  },
};

// ------------------------------------------------------------------ HINDI ---

const HI_KA = "/audio/sounds/hi/ka.mp3";
const HI_LA = "/audio/sounds/hi/la.mp3";

function hiLetter(
  key: string,
  char: string,
  sound: string,
  picture: Picture,
  name: string,
  pictureClip: string,
  latin: RegExp,
  pictureRe: RegExp,
): LetterInfo {
  return {
    char,
    sound,
    picture,
    pictureName: name,
    isLetter: (t) => firstConsonant(t) === char || anyToken(t, latin),
    isPicture: (t) => pictureRe.test(normalize(t)),
    pictureWrong: v(`picture-wrong-${key}`, say("यह"), src(pictureClip), say(`है। बोलो, ${name}।`)),
    pictureWrongMoveOn: v(
      `picture-wrong-again-${key}`,
      say("यह"),
      src(pictureClip),
      say(`है। ${name} की पहली आवाज़ क्या है?`),
    ),
    pictureRight: v(`picture-right-${key}`, say(`हाँ, ${name}! ${name} की पहली आवाज़ क्या है?`)),
    firstSoundRight: v(
      `first-sound-right-${key}`,
      say(`शाबाश! ${name} की पहली आवाज़ है`),
      src(sound),
      say("यह अक्षर है"),
      src(sound),
    ),
    firstSoundWrong: v(
      `first-sound-wrong-${key}`,
      say(`सुनो। ${name} की पहली आवाज़ है`),
      src(sound),
      say("यह अक्षर है"),
      src(sound),
    ),
  };
}

const HI: Script = {
  lang: "hi",
  sttLang: "hi-IN",
  ttsLang: "hi-IN",
  word: "कल",
  letters: [
    hiLetter("ka", "क", HI_KA, { emoji: "🕊️" }, "कबूतर", "/audio/pictures/hi/ka.mp3", /^(k|ka|kaa|kah|c|ca|q|kay|key)$/, /कबूत|कबुत|kab(oo|u)tar|kabutar|pigeon/),
    hiLetter("la", "ल", HI_LA, { icon: "lattu" }, "लट्टू", "/audio/pictures/hi/la.mp3", /^(l|la|laa|lah|el|ell)$/, /लट्ट|लटू|लट्टु|lat+(u|oo)|lattoo|spinning|top/),
  ],
  isWord: (t) => {
    const n = normalize(t);
    return tokens(n).some((w) => w === "कल" || /^(kal|kall|cal|call|kul)$/.test(w));
  },
  wrongLetter: (t) => {
    const w = tokens(t)[0] ?? "";
    if (/[ऀ-ॿ]/.test(w)) return firstConsonant(w) === "क" ? 1 : 0;
    return /^[kcq]/.test(w) ? 1 : 0;
  },
  text: {
    intro:
      "👋 नमस्ते! मैं *Lifteracy* हूँ, WhatsApp पर एक AI पढ़ाई साथी।\n\n" +
      "जो बच्चे अभी पढ़ना नहीं जानते, वे मुझसे वॉइस मैसेज के ज़रिए पढ़ना सीखते हैं। " +
      "हर बच्चे को अपना पाठ मिलता है: अगर कोई अक्षर गलत पढ़ा, तो मैं उसी अक्षर पर ध्यान देता हूँ, " +
      "तस्वीर से इशारा देता हूँ, और फिर वापस शब्द तक ले जाता हूँ।\n\n" +
      "ℹ️ यह सिर्फ़ एक डेमो है, जो आपके ब्राउज़र में चलता है।\n\n" +
      "👉 *सुझाव:* जब मैं शब्द भेजूँ, तो कम से कम एक अक्षर गलत पढ़िए " +
      "(जैसे “कल” की जगह “कम”), ताकि आप सीखने का पूरा चक्र देख सकें।",
    noStt:
      "ℹ️ यह ब्राउज़र आवाज़ को टेक्स्ट में नहीं बदल सकता (Chrome सबसे अच्छा है)। " +
      "आप फिर भी वॉइस मैसेज भेज सकते हैं और फिर बटन दबाकर बता सकते हैं कि जवाब सही था या नहीं, या जवाब टाइप कर सकते हैं।",
    didntHear: "🎧 माफ़ कीजिए, मैं ठीक से सुन नहीं पाया। फिर से कोशिश करें, या नीचे दबाएँ:",
    btnRight: "✅ सही पढ़ा",
    btnWrong: "❌ गलत पढ़ा",
    firstTry:
      "पहली बार में सही! असली ऐप में अगला शब्द थोड़ा कठिन होता।\n\n" +
      "Lifteracy कैसे सिखाता है यह देखने के लिए, फिर से कोशिश करें और एक अक्षर गलत पढ़ें।",
    win:
      "🎉 यही है Lifteracy का सीखने का चक्र!\n\n" +
      "गलत शब्द ➜ वह अक्षर ➜ तस्वीर का इशारा ➜ पहली आवाज़ ➜ वापस शब्द।\n\n" +
      "असली चैटबॉट सैकड़ों शब्दों में ऐसे ही ढलता है, और शिक्षक हर बच्चे की प्रगति, अक्षर-अक्षर देख सकते हैं।",
    tryAgain: "🔁 फिर से",
    startOver: "🌐 भाषा बदलें",
    typeHint: "मैसेज",
  },
  voice: {
    readWord: v("read-word", say("क्या तुम यह शब्द पढ़ सकते हो? माइक दबाओ, और मुझे अपनी आवाज़ में भेजो।")),
    readAgain: v("read-again", say("अब यह शब्द फिर से पढ़ो।")),
    whatLetter: v("what-letter", say("इस अक्षर को देखो। यह कौन सा अक्षर है?")),
    letterRight: v("letter-right", say("हाँ! बिल्कुल सही।")),
    whatPicture: v("what-picture", say("यह इशारा देखो। यह क्या है?")),
    wellDone: v("well-done", say("वाह! तुमने बिल्कुल सही पढ़ा।")),
  },
};

export const SCRIPTS: Record<Lang, Script> = { en: EN, hi: HI };
