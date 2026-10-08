// ---------------------------------------------------------------------------
// SCRIPT: everything the demo bot says, in English and Hindi, plus how it
// decides whether an answer was right.
// ---------------------------------------------------------------------------
// The flow (see components/Chat.tsx):
//   word ──right──▶ 👍 sticker
//     └─wrong──▶ letter "what is this?" ──right──▶ back to word
//                  └─wrong──▶ picture "what is this?" ──▶ picture→letter card,
//                             "what is the first sound?" ──▶ back to word
//
// Voice notes are spoken with the device's text-to-speech. Any voice note is
// first tried as a recording at /audio/voice/<lang>/<rec>.mp3, so real
// recordings can replace it without code changes. See README.md for the list.
// ---------------------------------------------------------------------------

import { answerOf, firstConsonant, normalize } from "./match";

export type Lang = "en" | "hi";

export interface VoiceNote {
  rec: string; // recording key: /audio/voice/<lang>/<rec>.mp3
  say: string; // text-to-speech fallback
}

export type Picture = { emoji: string } | { icon: "top" };

export interface LetterInfo {
  char: string;
  picture: Picture;
  pictureName: string;
  // Was this answer to "what is this letter?" / "what's the first sound?" right?
  isLetter: (t: string) => boolean;
  // Was this answer to "what is this?" (the picture) right?
  isPicture: (t: string) => boolean;
  pictureWrong: VoiceNote; // "This is a top. Can you say top?"
  pictureWrongMoveOn: VoiceNote; // "This is a top."
  pictureRight: VoiceNote; // "Yes, a top!"
  firstSoundQ: VoiceNote; // "What is the first sound in top?"
  firstSoundRight: VoiceNote;
  firstSoundWrong: VoiceNote;
}

// What the commentary panel explains at each point of the conversation.
export type NoteKey =
  | "start"
  | "word"
  | "listening"
  | "letter"
  | "picture"
  | "association"
  | "back"
  | "firstTry"
  | "win"
  | "didntHear";

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
    noStt: string;
    didntHear: string;
    heardSound: string;
    btnRight: string;
    btnWrong: string;
    firstTry: string;
    win: string;
    tryAgain: string;
    startOver: string;
    typeHint: string;
    startingMic: string;
    speakNow: string;
  };
  voice: {
    readWord: VoiceNote;
    readAgain: VoiceNote;
    whatLetter: VoiceNote;
    letterRight: VoiceNote;
    whatPicture: VoiceNote;
    wellDone: VoiceNote;
  };
  commentary: {
    title: string;
    tag: string; // phone only: makes clear the panel isn't part of the chat
    steps: string[]; // the loop, for the progress strip
    hindiOnly?: string; // English only: Lifteracy teaches Hindi today
    notes: Record<NoteKey, string>;
  };
}

const v = (rec: string, say: string): VoiceNote => ({ rec, say });

// ---------------------------------------------------------------- ENGLISH ---

// Words people wrap around their answer ("the letter is t", "it's a car").
// "a" is deliberately not here: it's also an answer.
const EN_FILLER = new Set(
  "the letter word is it its it s this that thats that s i think sound sounds says say makes like um uh hmm er ok okay".split(" "),
);

// `sound` is the letter's sound spelt so text-to-speech says the sound, not
// the letter's name ("kuh", not "see").
function enLetter(
  key: string,
  char: string,
  sound: string,
  picture: Picture,
  name: string,
  letterRe: RegExp,
  pictureRe: RegExp,
): LetterInfo {
  const ans = (t: string) => answerOf(t, EN_FILLER);
  return {
    char,
    picture,
    pictureName: name,
    isLetter: (t) => letterRe.test(ans(t)),
    isPicture: (t) => pictureRe.test(ans(t)),
    pictureWrong: v(`picture-wrong-${key}`, `This is a ${name}. Can you say ${name}?`),
    pictureWrongMoveOn: v(`picture-wrong-again-${key}`, `This is a ${name}.`),
    pictureRight: v(`picture-right-${key}`, `Yes, a ${name}!`),
    firstSoundQ: v(`first-sound-${key}`, `What is the first sound in ${name}?`),
    firstSoundRight: v(`first-sound-right-${key}`, `Well done! ${name} starts with the sound, ${sound}.`),
    firstSoundWrong: v(`first-sound-wrong-${key}`, `Listen. ${name} starts with the sound, ${sound}. ${sound}, ${name}.`),
  };
}

const EN: Script = {
  lang: "en",
  sttLang: "en-IN",
  ttsLang: "en-IN",
  word: "cat",
  letters: [
    enLetter("c", "c", "kuh", { emoji: "🚗" }, "car", /^(c|cc|see|sea|si|cee|kay|key|kk|[ckq][aeiou]?h?)$/, /^(car|cars|kar|carr|kaar|caar)$/),
    enLetter("a", "a", "ah", { emoji: "🍎" }, "apple", /^(a|ay|aye|eh|ah|aa|uh|ae|air|hey|ha)$/, /^(apple|apples|appel|aple)$/),
    enLetter("t", "t", "tuh", { icon: "top" }, "top", /^(tt|tee|tea|too|two|t[aeiou]?h?)$/, /^(top|tops|topp|taap|spinning)$/),
  ],
  isWord: (t) => /^(cat|cats|kat|katt|catt|khat)$/.test(answerOf(t, EN_FILLER)),
  wrongLetter: (t) => {
    const w = answerOf(t, EN_FILLER).replace(/s$/, "");
    if (!/^[ckq]/.test(w)) return 0; // didn't start with /k/
    if (!/t$/.test(w)) return 2; // didn't end with /t/  (cap, can, cab…)
    return 1; // the vowel (cut, cot, kit…)
  },
  text: {
    noStt:
      "ℹ️ This browser can't turn speech into text (Chrome works best). " +
      "You can still send voice messages and then tap a button to say whether you were right, or just type your answer.",
    didntHear: "🎧 Sorry, I couldn't hear that clearly. Try again, or tap below:",
    heardSound: "🎧 I heard a sound, but couldn't tell which one. Did you say it right?",
    btnRight: "✅ I got it right",
    btnWrong: "❌ I got it wrong",
    firstTry:
      "You read it right first time! In the real app the next word would be a little harder.\n\n" +
      "To see how Lifteracy teaches, try again and read one letter wrong.",
    win:
      "🎉 That's the Lifteracy learning loop!\n\n" +
      "Misread word ➜ that letter ➜ a picture hint ➜ its first sound ➜ back to the word.",
    tryAgain: "🔁 Try again",
    startOver: "🌐 Change language",
    typeHint: "Message",
    startingMic: "Starting mic…",
    speakNow: "Speak now",
  },
  voice: {
    readWord: v("read-word", "Can you read this word? Tap the microphone, and send me a voice message."),
    readAgain: v("read-again", "Now read the word again."),
    whatLetter: v("what-letter", "Let's look at this letter. What is this letter?"),
    letterRight: v("letter-right", "Yes! That's right."),
    whatPicture: v("what-picture", "Look at this picture. What is this?"),
    wellDone: v("well-done", "Brilliant! You read it perfectly."),
  },
  commentary: {
    title: "What's happening",
    tag: "Demo guide · not part of the chat",
    steps: ["Word", "Letter", "Picture", "Sound", "Word ✓"],
    hindiOnly: "Lifteracy currently teaches Hindi. English is a preview for this demo.",
    notes: {
      start:
        "Lifteracy runs entirely inside *WhatsApp*: no app to install, and it works on any cheap smartphone. *Pick a language to start.*",
      word:
        "Children who can't read can't follow written instructions, so *everything happens by voice notes and pictures*. The child sees a word and hears a voice note asking them to read it. Tap the green mic, read the word, then tap send. *Try misreading one letter* (say “cap” instead of “cat”) to see the learning loop.",
      listening:
        "*Speech recognition* turns the child's voice into text, and Lifteracy compares it with the word *letter by letter*.",
      letter:
        "The word was misread, so Lifteracy found *the letter that caused the mistake* and zooms in on just that letter. Can the child name it?",
      picture:
        "Still stuck? A *picture of something the child already knows*, whose name starts with the same sound. Naming it is easy.",
      association:
        "The *picture-letter card* links the familiar picture to the letter's shape. Now the child says *the first sound*.",
      back: "With the letter practised, the child goes *back to the whole word* and reads it again.",
      firstTry:
        "Correct first time, so the child gets a sticker and, in the real app, a harder word. *Tap “Try again” and misread a letter* to see the learning loop.",
      win:
        "That's the loop: *word ➜ letter ➜ picture ➜ sound ➜ word*. In the real app the next words *adapt to each child*: extra practice on weak letters, harder words after success. Teachers see every child's progress, letter by letter.",
      didntHear:
        "*Hold the mic closer and try speaking in a full sentence.* Sometimes speech-to-text isn't reliable, but we have honed it further in our real version by using *an ensemble of speech-to-text engines*. You can also tap a button to carry on.",
    },
  },
};

// ------------------------------------------------------------------ HINDI ---

const HI_FILLER = new Set("यह ये है हैं अक्षर शब्द का की के वाला वाली मुझे लगता तो और".split(" "));

function hiLetter(
  key: string,
  char: string,
  picture: Picture,
  name: string,
  latin: RegExp,
  pictureRe: RegExp,
): LetterInfo {
  const ans = (t: string) => answerOf(t, HI_FILLER);
  return {
    char,
    picture,
    pictureName: name,
    isLetter: (t) => firstConsonant(ans(t)) === char || latin.test(ans(t)),
    isPicture: (t) => pictureRe.test(normalize(t)),
    pictureWrong: v(`picture-wrong-${key}`, `यह ${name} है। बोलो, ${name}।`),
    pictureWrongMoveOn: v(`picture-wrong-again-${key}`, `यह ${name} है।`),
    pictureRight: v(`picture-right-${key}`, `हाँ, ${name}!`),
    firstSoundQ: v(`first-sound-${key}`, `${name} की पहली आवाज़ क्या है?`),
    firstSoundRight: v(`first-sound-right-${key}`, `शाबाश! ${name} की पहली आवाज़ है ${char}। यह अक्षर है ${char}।`),
    firstSoundWrong: v(`first-sound-wrong-${key}`, `सुनो। ${name} की पहली आवाज़ है ${char}। यह अक्षर है ${char}।`),
  };
}

const HI: Script = {
  lang: "hi",
  sttLang: "hi-IN",
  ttsLang: "hi-IN",
  word: "कल",
  letters: [
    hiLetter("ka", "क", { emoji: "🕊️" }, "कबूतर", /^(k|ka|kaa|kah|c|ca|q|kay|key)$/, /कबूत|कबुत|kab(oo|u)tar|kabutar|pigeon/),
    hiLetter("la", "ल", { icon: "top" }, "लट्टू", /^(l|la|laa|lah|el|ell)$/, /लट्ट|लटू|लट्टु|lat+(u|oo)|lattoo|spinning|top/),
  ],
  isWord: (t) => {
    const w = answerOf(t, HI_FILLER);
    return w === "कल" || /^(kal|kall|cal|call|kul)$/.test(w);
  },
  wrongLetter: (t) => {
    const w = answerOf(t, HI_FILLER);
    if (/[ऀ-ॿ]/.test(w)) return firstConsonant(w) === "क" ? 1 : 0;
    return /^[kcq]/.test(w) ? 1 : 0;
  },
  text: {
    noStt:
      "ℹ️ यह ब्राउज़र आवाज़ को टेक्स्ट में नहीं बदल सकता (Chrome सबसे अच्छा है)। " +
      "आप फिर भी वॉइस मैसेज भेज सकते हैं और फिर बटन दबाकर बता सकते हैं कि जवाब सही था या नहीं, या जवाब टाइप कर सकते हैं।",
    didntHear: "🎧 माफ़ कीजिए, मैं ठीक से सुन नहीं पाया। फिर से कोशिश करें, या नीचे दबाएँ:",
    heardSound: "🎧 मैंने एक आवाज़ सुनी, पर पहचान नहीं पाया कि कौन सी। क्या आपने सही बोला?",
    btnRight: "✅ सही पढ़ा",
    btnWrong: "❌ गलत पढ़ा",
    firstTry:
      "पहली बार में सही! असली ऐप में अगला शब्द थोड़ा कठिन होता।\n\n" +
      "Lifteracy कैसे सिखाता है यह देखने के लिए, फिर से कोशिश करें और एक अक्षर गलत पढ़ें।",
    win: "🎉 यही है Lifteracy का सीखने का चक्र!\n\n" + "गलत शब्द ➜ वह अक्षर ➜ चित्र ➜ पहली आवाज़ ➜ वापस शब्द।",
    tryAgain: "🔁 फिर से",
    startOver: "🌐 भाषा बदलें",
    typeHint: "मैसेज",
    startingMic: "माइक शुरू हो रहा है…",
    speakNow: "अब बोलिए",
  },
  voice: {
    readWord: v("read-word", "क्या तुम यह शब्द पढ़ सकते हो? माइक दबाओ, और मुझे अपनी आवाज़ में भेजो।"),
    readAgain: v("read-again", "अब यह शब्द फिर से पढ़ो।"),
    whatLetter: v("what-letter", "इस अक्षर को देखो। यह कौन सा अक्षर है?"),
    letterRight: v("letter-right", "हाँ! बिल्कुल सही।"),
    whatPicture: v("what-picture", "यह चित्र देखो। यह क्या है?"),
    wellDone: v("well-done", "वाह! तुमने बिल्कुल सही पढ़ा।"),
  },
  commentary: {
    title: "क्या हो रहा है",
    tag: "डेमो गाइड · चैट का हिस्सा नहीं",
    steps: ["शब्द", "अक्षर", "चित्र", "आवाज़", "शब्द ✓"],
    notes: {
      start: "Lifteracy पूरी तरह *WhatsApp* के अंदर चलता है: कोई ऐप डाउनलोड नहीं, किसी भी सस्ते स्मार्टफ़ोन पर। *शुरू करने के लिए भाषा चुनें।*",
      word: "जो बच्चे पढ़ नहीं सकते, वे लिखे निर्देश भी नहीं पढ़ सकते, इसलिए *सब कुछ वॉइस नोट और चित्रों से होता है*। बच्चा एक शब्द देखता है और वॉइस नोट सुनता है जो उसे शब्द पढ़ने को कहता है। हरा माइक दबाएँ, शब्द पढ़ें, फिर भेजें। *एक अक्षर गलत पढ़कर देखिए* (जैसे “कल” की जगह “कम”), ताकि सीखने का चक्र दिखे।",
      listening: "*स्पीच रिकग्निशन* बच्चे की आवाज़ को टेक्स्ट में बदलता है, और Lifteracy उसे शब्द से *अक्षर-अक्षर* मिलाता है।",
      letter: "शब्द गलत पढ़ा गया, तो Lifteracy ने *वह अक्षर ढूँढा जिसकी वजह से गलती हुई*, और अब सिर्फ़ उसी अक्षर पर ध्यान देता है। क्या बच्चा उसे पहचानता है?",
      picture: "अब भी मुश्किल? *एक जानी-पहचानी चीज़ का चित्र*, जिसका नाम उसी आवाज़ से शुरू होता है। उसका नाम बताना आसान है।",
      association: "*चित्र-अक्षर कार्ड* जानी-पहचानी चीज़ को अक्षर के आकार से जोड़ता है। अब बच्चा *पहली आवाज़* बताता है।",
      back: "अक्षर का अभ्यास हो गया, अब बच्चा *फिर से पूरा शब्द* पढ़ता है।",
      firstTry: "पहली बार में सही, तो स्टिकर मिलता है और असली ऐप में अगला शब्द कठिन होता है। *“फिर से” दबाएँ और एक अक्षर गलत पढ़ें*, ताकि सीखने का चक्र दिखे।",
      win: "यही है चक्र: *शब्द ➜ अक्षर ➜ चित्र ➜ आवाज़ ➜ शब्द*। असली ऐप में अगले शब्द *हर बच्चे के हिसाब से बदलते हैं*, और शिक्षक हर बच्चे की प्रगति अक्षर-अक्षर देख सकते हैं।",
      didntHear: "*माइक को पास रखें और पूरे वाक्य में बोलकर देखें।* कभी-कभी स्पीच-टू-टेक्स्ट भरोसेमंद नहीं होता, लेकिन हमने अपने असली वर्ज़न में इसे *कई स्पीच-टू-टेक्स्ट इंजनों के समूह* से और बेहतर बनाया है। आगे बढ़ने के लिए आप बटन भी दबा सकते हैं।",
    },
  },
};

export const SCRIPTS: Record<Lang, Script> = { en: EN, hi: HI };
