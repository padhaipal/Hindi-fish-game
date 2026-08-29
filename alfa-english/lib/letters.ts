// ---------------------------------------------------------------------------
// ALfA ENGLISH — LETTER DATA
// ---------------------------------------------------------------------------
// The ALfA method teaches each letter through a PICTURE the child already knows,
// and asks for the SOUND, not the letter name. So every letter carries the
// picture-word the book uses to introduce it (a -> apple, b -> bus ...), plus an
// emoji for that picture. Only lowercase is taught at this stage.
//
// Audio is spoken by the browser (see lib/speech.ts). Because text-to-speech is
// good at whole WORDS but poor at isolated phonemes, the games speak the
// picture-word ("apple") and blended words ("cat"), never a bare /a/.
// ---------------------------------------------------------------------------

export type IconKey = "top" | "jam";

export interface Letter {
  id: string; // the lowercase letter, also the key
  char: string; // what shows on a tile (lowercase)
  word: string; // the ALfA picture-word (a -> "apple")
  emoji: string; // picture for that word
  icon?: IconKey; // optional custom drawing instead of the emoji
  vowel: boolean; // vowels are shown in blue, consonants in red (ALfA convention)
}

function L(id: string, word: string, emoji: string, extra?: { icon?: IconKey }): Letter {
  return {
    id,
    char: id,
    word,
    emoji,
    icon: extra?.icon,
    vowel: "aeiou".includes(id),
  };
}

// The 26 letters, each with its ALfA picture-word (see book Lessons 1-10).
export const LETTERS: Letter[] = [
  L("a", "apple", "🍎"),
  L("b", "bus", "🚌"),
  L("c", "car", "🚗"),
  L("d", "dog", "🐕"),
  L("e", "egg", "🥚"),
  L("f", "fan", "🪭"),
  L("g", "goat", "🐐"),
  L("h", "hat", "🎩"),
  L("i", "insect", "🐛"),
  L("j", "jam", "🍓", { icon: "jam" }),
  L("k", "kite", "🪁"),
  L("l", "lion", "🦁"),
  L("m", "mug", "☕"),
  L("n", "nest", "🪺"),
  L("o", "orange", "🍊"),
  L("p", "pot", "🍲"),
  L("q", "queen", "👸"),
  L("r", "rabbit", "🐰"),
  L("s", "sun", "☀️"),
  L("t", "top", "🌀", { icon: "top" }),
  L("u", "umbrella", "☂️"),
  L("v", "van", "🚐"),
  L("w", "watch", "⌚"),
  L("x", "box", "📦"), // x is the ENDING sound /ks/ in "box"
  L("y", "yo-yo", "🪀"),
  L("z", "zebra", "🦓"),
];

const BY_ID: Record<string, Letter> = LETTERS.reduce((acc, l) => {
  acc[l.id] = l;
  return acc;
}, {} as Record<string, Letter>);

export function getLetter(id: string): Letter {
  return BY_ID[id] ?? LETTERS[0];
}
