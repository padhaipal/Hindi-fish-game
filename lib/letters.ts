// ---------------------------------------------------------------------------
// HINDI LETTER DATA
// ---------------------------------------------------------------------------
// This is the master list of letters the game can use. To add or remove a
// letter, just edit this array. Each letter knows:
//   - `char`        : the Devanagari character shown on the fish / target.
//   - `id`          : a short ASCII id used for audio/image file names and keys.
//   - `roman`       : a rough romanisation (only used by developers / labels).
//   - `audio`       : path to the spoken-letter sound (see /public/audio/letters).
//   - `word`        : a familiar Hindi word that STARTS with this letter — the
//                     picture shown next to the target letter illustrates it.
//   - `image`       : path to that word's picture (see /public/images/words).
//   - `emoji`       : a fallback emoji shown if the image file is missing, so
//                     the picture slot is never empty.
//   - `lookAlikes`  : ids of letters that LOOK similar (visual distractors).
//   - `soundAlikes` : ids of letters that SOUND similar (audio distractors).
//
// `lookAlikes` and `soundAlikes` are used by the level system to pick "tricky"
// distractor fish in later levels. They are optional — leave them empty if you
// are not sure.
// ---------------------------------------------------------------------------

export interface Letter {
  id: string;
  char: string;
  roman: string;
  audio: string;
  word: string;
  image: string;
  emoji: string;
  lookAlikes: string[];
  soundAlikes: string[];
}

// The 8 letters this game practises: ब स प र त क च ल
// Picture words below come from the artwork supplied for each letter.
export const LETTERS: Letter[] = [
  {
    id: "ba",
    char: "ब",
    roman: "ba",
    audio: "/audio/letters/ba.mp3",
    word: "बत्तख़", // duck
    image: "/images/words/ba.png",
    emoji: "🦆",
    lookAlikes: ["ka"], // क has a similar vertical-stroke feel for beginners
    soundAlikes: ["pa"], // ब / प are an easy voiced-vs-unvoiced mix-up
  },
  {
    id: "sa",
    char: "स",
    roman: "sa",
    audio: "/audio/letters/sa.mp3",
    word: "साबुन", // soap
    image: "/images/words/sa.png",
    emoji: "🧼",
    lookAlikes: ["ra"],
    soundAlikes: ["sa"],
  },
  {
    id: "pa",
    char: "प",
    roman: "pa",
    audio: "/audio/letters/pa.mp3",
    word: "पतंग", // kite
    image: "/images/words/pa.png",
    emoji: "🪁",
    lookAlikes: ["ra"], // प and र share the open-top shape for young learners
    soundAlikes: ["ba"],
  },
  {
    id: "ra",
    char: "र",
    roman: "ra",
    audio: "/audio/letters/ra.mp3",
    word: "रस्सी", // rope
    image: "/images/words/ra.png",
    emoji: "🪢",
    lookAlikes: ["pa", "ta"],
    soundAlikes: ["la"],
  },
  {
    id: "ta",
    char: "त",
    roman: "ta",
    audio: "/audio/letters/ta.mp3",
    word: "तरबूज़", // watermelon
    image: "/images/words/ta.png",
    emoji: "🍉",
    lookAlikes: ["ra"],
    soundAlikes: ["ta"],
  },
  {
    id: "ka",
    char: "क",
    roman: "ka",
    audio: "/audio/letters/ka.mp3",
    word: "कबूतर", // pigeon
    image: "/images/words/ka.png",
    emoji: "🕊️",
    lookAlikes: ["ba"],
    soundAlikes: ["cha"],
  },
  {
    id: "cha",
    char: "च",
    roman: "cha",
    audio: "/audio/letters/cha.mp3",
    word: "चम्मच", // spoon
    image: "/images/words/cha.png",
    emoji: "🥄",
    lookAlikes: ["ta"],
    soundAlikes: ["ka"],
  },
  {
    id: "la",
    char: "ल",
    roman: "la",
    audio: "/audio/letters/la.mp3",
    word: "लट्टू", // spinning top
    image: "/images/words/la.png",
    emoji: "🪀",
    lookAlikes: ["sa"],
    soundAlikes: ["ra"],
  },
];

// Quick lookup helper: get a Letter by its id.
const BY_ID: Record<string, Letter> = LETTERS.reduce((acc, l) => {
  acc[l.id] = l;
  return acc;
}, {} as Record<string, Letter>);

export function getLetter(id: string): Letter {
  return BY_ID[id] ?? LETTERS[0];
}
