// ---------------------------------------------------------------------------
// HINDI LETTER DATA
// ---------------------------------------------------------------------------
// This is the master list of letters the game can use. To add or remove a
// letter, just edit this array. Each letter knows:
//   - `char`        : the Devanagari character shown on the fish / target.
//   - `id`          : a short ASCII id used for audio file names and keys.
//   - `roman`       : a rough romanisation (only used by developers / labels).
//   - `audio`       : path to the spoken-letter sound (see /public/audio/letters).
//   - `word`        : a familiar Hindi word that STARTS with this letter — the
//                     emoji shown next to the target letter illustrates it.
//   - `emoji`       : the picture (an emoji) shown beside the target letter.
//                     We use emojis instead of image files: crisp on small
//                     screens, no asset loading, and easy to swap here.
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
  emoji: string;
  lookAlikes: string[];
  soundAlikes: string[];
}

// The 8 letters this game practises: ब स प र त क च ल
export const LETTERS: Letter[] = [
  {
    id: "ba",
    char: "ब",
    roman: "ba",
    audio: "/audio/letters/ba.mp3",
    word: "बत्तख़", // duck
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
    emoji: "🥄",
    lookAlikes: ["ta"],
    soundAlikes: ["ka"],
  },
  {
    id: "la",
    char: "ल",
    roman: "la",
    audio: "/audio/letters/la.mp3",
    word: "लट्टू", // spinning top (lattu)
    // No emoji is a real lattu (🪀 is a yo-yo), so this one is drawn as a custom
    // SVG — see `LattuIcon` in components/fish/PondGame.tsx. Emoji kept only as a
    // last-ditch fallback.
    emoji: "🌀",
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

// Two recordings exist per letter:
//   - `audio` (above) = the LETTER ONLY  (/audio/letters)       — bare sound.
//   - this            = the PICTURE+LETTER (/audio/letters-word) — letter + its
//                       word (e.g. "ब … बत्तख़").
// The fish game plays picture+letter for the intro / सुनो prompt, and letter-only
// when a fish is tapped. (Blocks game taps use letter-only too.)
export function letterWordAudio(id: string): string {
  return `/audio/letters-word/${id}.mp3`;
}
