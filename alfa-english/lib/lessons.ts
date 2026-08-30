// ---------------------------------------------------------------------------
// ALfA ENGLISH — LESSON STRUCTURE
// ---------------------------------------------------------------------------
// The book introduces the 26 letters across alternating READING and WRITING
// lessons, each pair covering the same small set of letters:
//
//   Lesson 1  read  / Lesson 2  write : a b t g c m
//   Lesson 3  read  / Lesson 4  write : j e y s v
//   Lesson 5  read  / Lesson 6  write : k i d z p w
//   Lesson 7  read  / Lesson 8  write : l o f r x
//   Lesson 9  read  / Lesson 10 write : h u n q
//
// The reading letters drive the recognition games (Fish, Pond Hop); the writing
// letters drive the Writing game. Each lesson has its own deep link.
// ---------------------------------------------------------------------------

export interface Lesson {
  n: number; // lesson number as printed in the book
  letters: string[]; // letter ids introduced (cumulative sets grow the pool)
  bg: string; // background gradient, for variety
}

// The five reading lessons (odd) — Fish & Pond Hop.
export const READING_LESSONS: Lesson[] = [
  { n: 1, letters: ["a", "b", "t", "g", "c", "m"], bg: "linear-gradient(#aef0ff 0%, #62d0f5 45%, #2bb4ec 100%)" },
  { n: 3, letters: ["j", "e", "y", "s", "v"], bg: "linear-gradient(#e8ffe9 0%, #b8f0c0 55%, #8fe0a0 100%)" },
  { n: 5, letters: ["k", "i", "d", "z", "p", "w"], bg: "linear-gradient(#fff0e6 0%, #ffd9bf 55%, #ffbf95 100%)" },
  { n: 7, letters: ["l", "o", "f", "r", "x"], bg: "linear-gradient(#f1e9ff 0%, #d9c9ff 55%, #b79bf0 100%)" },
  { n: 9, letters: ["h", "u", "n", "q"], bg: "linear-gradient(#ffe9f1 0%, #ffc9dd 55%, #ff9bbf 100%)" },
];

// The five writing lessons (even) — same letter sets as the reading lesson before.
export const WRITING_LESSONS: Lesson[] = [
  { n: 2, letters: ["a", "b", "t", "g", "c", "m"], bg: "linear-gradient(#e7fbe9 0%, #bff0c9 100%)" },
  { n: 4, letters: ["j", "e", "y", "s", "v"], bg: "linear-gradient(#fff0e6 0%, #ffd9bf 100%)" },
  { n: 6, letters: ["k", "i", "d", "z", "p", "w"], bg: "linear-gradient(#e9f7ff 0%, #bfe0ff 100%)" },
  { n: 8, letters: ["l", "o", "f", "r", "x"], bg: "linear-gradient(#f1e9ff 0%, #d9c9ff 100%)" },
  { n: 10, letters: ["h", "u", "n", "q"], bg: "linear-gradient(#fff6da 0%, #ffe1a8 100%)" },
];

export function getReadingLesson(n: number): Lesson | undefined {
  return READING_LESSONS.find((l) => l.n === n);
}
export function getWritingLesson(n: number): Lesson | undefined {
  return WRITING_LESSONS.find((l) => l.n === n);
}

// All letters learned up to and including a given lesson (for a bigger, more
// challenging pool of "wrong" options in the recognition games).
export function lettersUpTo(n: number): string[] {
  const out: string[] = [];
  for (const l of READING_LESSONS) if (l.n <= n) out.push(...l.letters);
  return out;
}

// ---------------------------------------------------------------------------
// CVC WORDS — for the Blocks and Word Train games.
// ---------------------------------------------------------------------------
// Short, decodable words from the book's grids, with a picture where a clear
// emoji exists. Grouped by the reading lesson whose letters first make them
// readable, so these games can also be scoped to a lesson if wanted.
// ---------------------------------------------------------------------------

export interface CvcWord {
  word: string;
  emoji: string;
  lesson: number; // the reading lesson by which this word is decodable
}

export const CVC_WORDS: CvcWord[] = [
  // Lesson 1 (a b t g c m)
  { word: "cat", emoji: "🐱", lesson: 1 },
  { word: "bat", emoji: "🦇", lesson: 1 },
  { word: "bag", emoji: "🎒", lesson: 1 },
  { word: "cab", emoji: "🚕", lesson: 1 },
  { word: "tag", emoji: "🏷️", lesson: 1 },
  { word: "mat", emoji: "🟫", lesson: 1 },
  // Lesson 3 (+ j e y s v)
  { word: "jet", emoji: "✈️", lesson: 3 },
  { word: "jam", emoji: "🍓", lesson: 3 },
  { word: "egg", emoji: "🥚", lesson: 3 },
  { word: "bee", emoji: "🐝", lesson: 3 },
  // Lesson 5 (+ k i d z p w)
  { word: "zip", emoji: "🤐", lesson: 5 },
  { word: "bed", emoji: "🛏️", lesson: 5 },
  { word: "web", emoji: "🕸️", lesson: 5 },
  { word: "cap", emoji: "🧢", lesson: 5 },
  // Lesson 7 (+ l o f r x)
  { word: "fox", emoji: "🦊", lesson: 7 },
  { word: "box", emoji: "📦", lesson: 7 },
  { word: "dog", emoji: "🐕", lesson: 7 },
  { word: "log", emoji: "🪵", lesson: 7 },
  { word: "pot", emoji: "🍲", lesson: 7 },
  // Lesson 9 (+ h u n q) — all letters now
  { word: "sun", emoji: "☀️", lesson: 9 },
  { word: "bus", emoji: "🚌", lesson: 9 },
  { word: "cup", emoji: "☕", lesson: 9 },
  { word: "nut", emoji: "🥜", lesson: 9 },
  { word: "hen", emoji: "🐔", lesson: 9 },
];
