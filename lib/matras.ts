// ---------------------------------------------------------------------------
// MATRAS — the Hindi vowel signs (मात्राएँ).
// ---------------------------------------------------------------------------
// A matra is the sign a vowel becomes when it joins a consonant: क + ी = की.
// Each attaches in a characteristic PLACE (right, left, above or below the
// consonant) — the font renders the combined glyph for us, so we only need the
// sign itself. `pos` is a rough hint (for teaching / layout), not used for
// rendering. `roman` is a kid-friendly hint of the sound.
// ---------------------------------------------------------------------------

export interface Matra {
  id: string;
  sign: string; // the combining mark
  roman: string; // rough sound, e.g. "aa"
  pos: "right" | "left" | "above" | "below";
}

// A dotted circle so a bare matra can be shown on its own (◌ा, ◌ि, …).
export const DOTTED_CIRCLE = "◌";

// The common matras, in बारहखड़ी order. (अ needs no sign, so it is omitted.)
export const MATRAS: Matra[] = [
  { id: "aa", sign: "ा", roman: "aa", pos: "right" }, // ा
  { id: "i", sign: "ि", roman: "i", pos: "left" }, // ि
  { id: "ii", sign: "ी", roman: "ee", pos: "right" }, // ी
  { id: "u", sign: "ु", roman: "u", pos: "below" }, // ु
  { id: "uu", sign: "ू", roman: "oo", pos: "below" }, // ू
  { id: "e", sign: "े", roman: "e", pos: "above" }, // े
  { id: "ai", sign: "ै", roman: "ai", pos: "above" }, // ै
  { id: "o", sign: "ो", roman: "o", pos: "right" }, // ो
  { id: "au", sign: "ौ", roman: "au", pos: "right" }, // ौ
];

export function getMatra(id: string): Matra {
  return MATRAS.find((m) => m.id === id) ?? MATRAS[0];
}

// The syllable a consonant makes with a matra: क + ी → की.
export function syllable(consonantChar: string, matra: Matra): string {
  return consonantChar + matra.sign;
}

// A bare matra shown on its own, e.g. ◌ी.
export function matraChip(matra: Matra): string {
  return DOTTED_CIRCLE + matra.sign;
}
