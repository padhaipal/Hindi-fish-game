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

// The 8 letters with real voice RECORDINGS. This list stays the pool for the
// standalone games (fish, memory, train, blocks, lekhan) and for the visual
// distractors in the adventures — so those keep sounding exactly as before.
// The FULL alphabet the per-letter adventures cover lives in ALL_LETTERS below;
// letters beyond these 8 are voiced with the phone's Hindi text-to-speech.
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

// ---------------------------------------------------------------------------
// The rest of the alphabet — vowels (स्वर) + the remaining consonants (व्यंजन).
// These have trace strokes (lib/lekhan/hindiStrokes.ts) but no voice recordings,
// so the adventures speak them with the phone's Hindi TTS (see lib/letterVoice).
// `audio` paths are kept only for shape; they are never played for these.
// ---------------------------------------------------------------------------
const EXTRA_LETTERS: Letter[] = [
  // --- vowels (स्वर) -------------------------------------------------------
  { id: "a", char: "अ", roman: "a", audio: "/audio/letters/a.mp3", word: "अनानास", emoji: "🍍", lookAlikes: [], soundAlikes: [] },
  { id: "aa", char: "आ", roman: "aa", audio: "/audio/letters/aa.mp3", word: "आम", emoji: "🥭", lookAlikes: ["a"], soundAlikes: ["a"] },
  { id: "i", char: "इ", roman: "i", audio: "/audio/letters/i.mp3", word: "इंद्रधनुष", emoji: "🌈", lookAlikes: ["ii"], soundAlikes: ["ii"] },
  { id: "ii", char: "ई", roman: "ii", audio: "/audio/letters/ii.mp3", word: "ईंट", emoji: "🧱", lookAlikes: ["i"], soundAlikes: ["i"] },
  { id: "u", char: "उ", roman: "u", audio: "/audio/letters/u.mp3", word: "उल्लू", emoji: "🦉", lookAlikes: ["uu"], soundAlikes: ["uu"] },
  { id: "uu", char: "ऊ", roman: "uu", audio: "/audio/letters/uu.mp3", word: "ऊँट", emoji: "🐫", lookAlikes: ["u"], soundAlikes: ["u"] },
  { id: "e", char: "ए", roman: "e", audio: "/audio/letters/e.mp3", word: "एड़ी", emoji: "🦶", lookAlikes: ["ai"], soundAlikes: ["ai"] },
  { id: "ai", char: "ऐ", roman: "ai", audio: "/audio/letters/ai.mp3", word: "ऐनक", emoji: "👓", lookAlikes: ["e"], soundAlikes: ["e"] },
  { id: "o", char: "ओ", roman: "o", audio: "/audio/letters/o.mp3", word: "ओस", emoji: "💧", lookAlikes: ["au"], soundAlikes: ["au"] },
  { id: "au", char: "औ", roman: "au", audio: "/audio/letters/au.mp3", word: "औज़ार", emoji: "🔧", lookAlikes: ["o"], soundAlikes: ["o"] },
  // --- remaining consonants (व्यंजन), varnamala order ----------------------
  { id: "kha", char: "ख", roman: "kha", audio: "/audio/letters/kha.mp3", word: "खरगोश", emoji: "🐰", lookAlikes: [], soundAlikes: ["ka"] },
  { id: "ga", char: "ग", roman: "ga", audio: "/audio/letters/ga.mp3", word: "गाय", emoji: "🐄", lookAlikes: [], soundAlikes: ["gha"] },
  { id: "gha", char: "घ", roman: "gha", audio: "/audio/letters/gha.mp3", word: "घड़ी", emoji: "⏰", lookAlikes: [], soundAlikes: ["ga"] },
  { id: "chha", char: "छ", roman: "chha", audio: "/audio/letters/chha.mp3", word: "छाता", emoji: "☂️", lookAlikes: [], soundAlikes: ["cha"] },
  { id: "ja", char: "ज", roman: "ja", audio: "/audio/letters/ja.mp3", word: "जहाज़", emoji: "✈️", lookAlikes: [], soundAlikes: ["jha"] },
  { id: "jha", char: "झ", roman: "jha", audio: "/audio/letters/jha.mp3", word: "झंडा", emoji: "🚩", lookAlikes: [], soundAlikes: ["ja"] },
  { id: "tta", char: "ट", roman: "Ta", audio: "/audio/letters/tta.mp3", word: "टमाटर", emoji: "🍅", lookAlikes: ["ttha"], soundAlikes: ["ta"] },
  { id: "ttha", char: "ठ", roman: "Tha", audio: "/audio/letters/ttha.mp3", word: "ठेला", emoji: "🛒", lookAlikes: ["tta"], soundAlikes: ["tta"] },
  { id: "dda", char: "ड", roman: "Da", audio: "/audio/letters/dda.mp3", word: "डिब्बा", emoji: "📦", lookAlikes: [], soundAlikes: ["da"] },
  { id: "tha", char: "थ", roman: "tha", audio: "/audio/letters/tha.mp3", word: "थैला", emoji: "👝", lookAlikes: [], soundAlikes: ["ta"] },
  { id: "da", char: "द", roman: "da", audio: "/audio/letters/da.mp3", word: "दरवाज़ा", emoji: "🚪", lookAlikes: [], soundAlikes: ["dha"] },
  { id: "dha", char: "ध", roman: "dha", audio: "/audio/letters/dha.mp3", word: "धनुष", emoji: "🏹", lookAlikes: [], soundAlikes: ["da"] },
  { id: "na", char: "न", roman: "na", audio: "/audio/letters/na.mp3", word: "नाव", emoji: "⛵", lookAlikes: [], soundAlikes: [] },
  { id: "pha", char: "फ", roman: "pha", audio: "/audio/letters/pha.mp3", word: "फूल", emoji: "🌸", lookAlikes: [], soundAlikes: ["pa"] },
  { id: "bha", char: "भ", roman: "bha", audio: "/audio/letters/bha.mp3", word: "भालू", emoji: "🐻", lookAlikes: [], soundAlikes: ["ba"] },
  { id: "ma", char: "म", roman: "ma", audio: "/audio/letters/ma.mp3", word: "मछली", emoji: "🐟", lookAlikes: [], soundAlikes: [] },
  { id: "ya", char: "य", roman: "ya", audio: "/audio/letters/ya.mp3", word: "यान", emoji: "🚀", lookAlikes: [], soundAlikes: [] },
  { id: "va", char: "व", roman: "va", audio: "/audio/letters/va.mp3", word: "वन", emoji: "🌳", lookAlikes: [], soundAlikes: ["ba"] },
  { id: "sha", char: "श", roman: "sha", audio: "/audio/letters/sha.mp3", word: "शेर", emoji: "🦁", lookAlikes: ["shha"], soundAlikes: ["shha", "sa"] },
  { id: "shha", char: "ष", roman: "Sha", audio: "/audio/letters/shha.mp3", word: "षट्कोण", emoji: "🔷", lookAlikes: ["sha"], soundAlikes: ["sha", "sa"] },
  { id: "ha", char: "ह", roman: "ha", audio: "/audio/letters/ha.mp3", word: "हाथी", emoji: "🐘", lookAlikes: [], soundAlikes: [] },
];

// Which ids have real voice recordings (the LETTERS above). Everything else is
// spoken with TTS. Used by lib/letterVoice.
const RECORDED_IDS = new Set(LETTERS.map((l) => l.id));
export function hasLetterRecording(id: string): boolean {
  return RECORDED_IDS.has(id);
}

// The full alphabet the per-letter adventures cover, in Devanagari (varnamala)
// order — vowels first, then consonants. The home screen and /letter/[id] use
// this; getLetter resolves any of them.
const VARNAMALA_ORDER = [
  "a", "aa", "i", "ii", "u", "uu", "e", "ai", "o", "au",
  "ka", "kha", "ga", "gha", "cha", "chha", "ja", "jha",
  "tta", "ttha", "dda", "ta", "tha", "da", "dha", "na",
  "pa", "pha", "ba", "bha", "ma", "ya", "ra", "la", "va",
  "sha", "shha", "sa", "ha",
];
const _byId = new Map<string, Letter>([...LETTERS, ...EXTRA_LETTERS].map((l) => [l.id, l]));
export const ALL_LETTERS: Letter[] = VARNAMALA_ORDER.map((id) => _byId.get(id)).filter(
  (l): l is Letter => Boolean(l)
);

// Quick lookup helper: get a Letter by its id (resolves the full alphabet).
const BY_ID: Record<string, Letter> = ALL_LETTERS.reduce((acc, l) => {
  acc[l.id] = l;
  return acc;
}, {} as Record<string, Letter>);

export function getLetter(id: string): Letter {
  return BY_ID[id] ?? ALL_LETTERS[0];
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
