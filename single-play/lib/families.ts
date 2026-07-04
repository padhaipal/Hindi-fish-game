// ---------------------------------------------------------------------------
// CONFUSABLE FAMILIES
// ---------------------------------------------------------------------------
// Letters that look/sound too similar to sit next to each other on one screen.
// Games use this to make sure a screen never shows two letters from the same
// family (and, above all, that a distractor is never in the TARGET's family).
// Only letters present in this build are listed; the source families also
// include letters we don't use (क़ ख़ ग़ ज़ फ़ ड़ ढ़ ओ and the mat
// signs), which are simply omitted.
// ---------------------------------------------------------------------------

// letter id -> family key (letters with no in-set partner are left out => null)
const FAMILY: Record<string, string> = {
  ka: "k", kha: "k",
  ga: "g", gha: "g",
  cha: "ch", chha: "ch",
  ja: "j", jha: "j",
  tta: "t", ttha: "t", ta: "t", tha: "t",
  dda: "d", da: "d", dha: "d",
  pa: "p", pha: "p",
  ba: "b", bha: "b",
  sha: "s", shha: "s", sa: "s",
  ya: "y", e: "y", ai: "y",
  a: "aA", aa: "aA",
};

export function familyOf(id: string): string | null {
  return FAMILY[id] ?? null;
}

export function sameFamily(a: string, b: string): boolean {
  const fa = FAMILY[a];
  return fa !== undefined && fa === FAMILY[b];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// From `pool`, return a shuffled list of letter ids such that no two share a
// family AND none is in the family of any id in `avoid`. (Family-less letters
// never conflict, so they all pass through.)
export function nonConfusableChoices(pool: string[], avoid: string[] = []): string[] {
  const bannedFams = new Set<string>();
  for (const id of avoid) {
    const f = FAMILY[id];
    if (f) bannedFams.add(f);
  }
  const usedFams = new Set<string>();
  const out: string[] = [];
  for (const id of shuffle(pool)) {
    const f = FAMILY[id];
    if (f && (bannedFams.has(f) || usedFams.has(f))) continue;
    if (f) usedFams.add(f);
    out.push(id);
  }
  return out;
}
