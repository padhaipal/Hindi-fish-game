// ---------------------------------------------------------------------------
// HINDI LETTER DATA — SINGLE-PLAY (full alphabet)
// ---------------------------------------------------------------------------
// This build practises the WHOLE alphabet (every letter that has a picture),
// used equally at random by each game. Six letters from the source alphabet
// were left out because their picture-word has no usable emoji and we chose not
// to draw them (अ अनार, इ इमली, ओ ओखली, ज जलेबी, ढ ढक्कन, थ थर्मस).
//
// Each letter knows:
//   - `char`   : the Devanagari character shown on the tile.
//   - `id`     : short ASCII id used for audio filenames + keys.
//   - `roman`  : rough romanisation (labels/dev only).
//   - `audio`  : the LETTER-ONLY sound (/audio/letters/<id>.mp3).
//   - `word`   : the familiar Hindi word the picture illustrates.
//   - `emoji`  : the picture. A few have no emoji and are drawn as custom SVGs
//                (see `icon`); the emoji is then only a last-ditch fallback.
//   - `icon`   : optional custom-SVG key (rendered by <LetterPicture/>).
//   - `lookAlikes` / `soundAlikes` : optional distractor hints (empty is fine).
//
// A second recording exists per letter — the PICTURE+LETTER prompt — at
// /audio/letters-word/<id>.mp3 (see `letterWordAudio`).
// ---------------------------------------------------------------------------

export type IconKey = "lattu" | "handcart" | "damroo" | "rope";

export interface Letter {
  id: string;
  char: string;
  roman: string;
  audio: string;
  word: string;
  emoji: string;
  icon?: IconKey;
  lookAlikes: string[];
  soundAlikes: string[];
}

// helper to keep the list terse
function L(
  id: string,
  char: string,
  roman: string,
  word: string,
  emoji: string,
  extra?: { icon?: IconKey; lookAlikes?: string[]; soundAlikes?: string[] }
): Letter {
  return {
    id,
    char,
    roman,
    audio: `/audio/letters/${id}.mp3`,
    word,
    emoji,
    icon: extra?.icon,
    lookAlikes: extra?.lookAlikes ?? [],
    soundAlikes: extra?.soundAlikes ?? [],
  };
}

export const LETTERS: Letter[] = [
  // ---- vowels (स्वर) ----
  L("aa", "आ", "aa", "आम", "🥭"), // mango
  L("ii", "ई", "ii", "ईंट", "🧱"), // brick
  L("u", "उ", "u", "उल्लू", "🦉"), // owl
  L("uu", "ऊ", "uu", "ऊन", "🧶"), // wool
  L("ri", "ऋ", "ri", "ऋषि", "🧙"), // sage
  L("e", "ए", "e", "एक", "1️⃣"), // one
  L("ai", "ऐ", "ai", "ऐनक", "👓"), // glasses
  L("au", "औ", "au", "औरत", "👩"), // woman
  L("an", "अं", "an", "अंगूर", "🍇"), // grapes

  // ---- consonants (व्यंजन) ----
  L("ka", "क", "ka", "कबूतर", "🕊️", { lookAlikes: ["pha"], soundAlikes: ["kha"] }), // pigeon
  L("kha", "ख", "kha", "खरगोश", "🐰", { soundAlikes: ["ka"] }), // rabbit
  L("ga", "ग", "ga", "गमला", "🪴", { soundAlikes: ["gha"] }), // flowerpot
  L("gha", "घ", "gha", "घड़ी", "⏰", { soundAlikes: ["ga"] }), // clock
  L("cha", "च", "cha", "चम्मच", "🥄", { soundAlikes: ["chha"] }), // spoon
  L("chha", "छ", "chha", "छाता", "☂️", { soundAlikes: ["cha"] }), // umbrella
  L("jha", "झ", "jha", "झंडा", "🚩"), // flag
  L("tta", "ट", "tta", "टमाटर", "🍅", { soundAlikes: ["ttha"] }), // tomato
  L("ttha", "ठ", "ttha", "ठेला", "🛒", { icon: "handcart", soundAlikes: ["tta"] }), // handcart
  L("dda", "ड", "dda", "डमरू", "🥁", { icon: "damroo" }), // damroo (drum)
  L("ta", "त", "ta", "तरबूज", "🍉", { soundAlikes: ["da"] }), // watermelon
  L("da", "द", "da", "दरवाज़ा", "🚪", { soundAlikes: ["dha", "ta"] }), // door
  L("dha", "ध", "dha", "धनुष", "🏹", { soundAlikes: ["da"] }), // bow
  L("na", "न", "na", "नल", "🚰"), // tap
  L("pa", "प", "pa", "पतंग", "🪁", { lookAlikes: ["ba"], soundAlikes: ["pha"] }), // kite
  L("pha", "फ", "pha", "फल", "🍎", { soundAlikes: ["pa"] }), // fruit
  L("ba", "ब", "ba", "बतख", "🦆", { lookAlikes: ["pa"], soundAlikes: ["bha"] }), // duck
  L("bha", "भ", "bha", "भालू", "🐻", { soundAlikes: ["ba"] }), // bear
  L("ma", "म", "ma", "मछली", "🐟"), // fish
  L("ya", "य", "ya", "योगी", "🧘"), // yoga person
  L("ra", "र", "ra", "रस्सी", "🪢", { icon: "rope", lookAlikes: ["sa"] }), // rope
  L("la", "ल", "la", "लट्टू", "🌀", { icon: "lattu", lookAlikes: ["sa"] }), // spinning top
  L("va", "व", "va", "वजन", "🏋️"), // weight
  L("sha", "श", "sha", "शहद", "🍯", { soundAlikes: ["sa", "shha"] }), // honey
  L("shha", "ष", "shha", "षट्कोण", "⬢", { soundAlikes: ["sha", "sa"] }), // hexagon
  L("sa", "स", "sa", "साबुन", "🧼", { lookAlikes: ["ra"], soundAlikes: ["sha"] }), // soap
  L("ha", "ह", "ha", "हथौड़ा", "🔨"), // hammer
];

// Quick lookup helper: get a Letter by its id.
const BY_ID: Record<string, Letter> = LETTERS.reduce((acc, l) => {
  acc[l.id] = l;
  return acc;
}, {} as Record<string, Letter>);

export function getLetter(id: string): Letter {
  return BY_ID[id] ?? LETTERS[0];
}

// The PICTURE+LETTER prompt (letter + its word, e.g. "ब … बतख").
export function letterWordAudio(id: string): string {
  return `/audio/letters-word/${id}.mp3`;
}
