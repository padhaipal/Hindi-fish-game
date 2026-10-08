// Small text helpers for judging what speech recognition heard.

// Lower-case, drop punctuation (keeping Devanagari letters and marks).
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokens(s: string): string[] {
  const n = normalize(s);
  return n ? n.split(" ") : [];
}

// First Devanagari consonant (क–ह, plus the nukta letters क़–य़), or "".
export function firstConsonant(s: string): string {
  const m = s.normalize("NFC").match(/[क-हक़-य़]/);
  return m ? m[0] : "";
}
