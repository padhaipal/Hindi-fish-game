// Phone port of the word section (levels 2–7) of
// LiteracyLessonService.selectNextString (pp-sketch
// src/literacy/literacy-lesson/literacy-lesson.service.ts). Passages
// (level 8+) aren't in the app yet, so the level is capped at 7.
import type { Turn } from "../store/students";

const RECENT_WORDS_TO_EXCLUDE = 10;
const SNAPSHOT_THRESHOLD_ADD_WORD_LENGTH = 8;
const SNAPSHOT_THRESHOLD_KEEP_WORD_LENGTH_SAME = 15;
const MIN_UNIQUE_WORDS_FOR_PROGRESS = 3;
const MIN_WORD_LENGTH_FLOOR = 2;
const NEW_USER_THRESHOLD = 3;
const LEVEL_BOOST_WINDOW = 6;
const LEVEL_BOOST_INCREMENT = 3;
const FIRST_WORD_ROW_COUNT = 2;
const SECOND_WORD_ROW_COUNT = 4;
const SENTENCE_RECENT_ROWS_WINDOW = 20;
const MAX_WORD_LEVEL = 7;

const length = (w: string) => Array.from(w).length;

export function selectNextWord(
  wordList: string[],
  scores: Record<string, number>,
  turns: Turn[],
): { word: string; level: number } {
  const newestFirst = [...turns].reverse();

  const recentWords: string[] = [];
  for (const t of newestFirst) {
    if (!recentWords.includes(t.word)) recentWords.push(t.word);
    if (recentWords.length === RECENT_WORDS_TO_EXCLUDE) break;
  }
  const recentRows = newestFirst.slice(0, SENTENCE_RECENT_ROWS_WINDOW);
  const uniqueDone = (n: number) =>
    new Set(recentRows.slice(0, n).filter((t) => t.done).map((t) => t.word)).size;
  const uniqueInAddWindow = uniqueDone(SNAPSHOT_THRESHOLD_ADD_WORD_LENGTH);
  const uniqueInKeepWindow = uniqueDone(SNAPSHOT_THRESHOLD_KEEP_WORD_LENGTH_SAME);
  const uniqueInBoostWindow = uniqueDone(LEVEL_BOOST_WINDOW);
  const recentRowCount = recentRows.length;
  const distinctWordCount = new Set(turns.map((t) => t.word)).size;
  const prevLevel = newestFirst.find((t) => t.level != null)?.level ?? null;
  const base = prevLevel ?? length(recentWords[0] ?? "");

  const accelerate =
    uniqueInBoostWindow >= MIN_UNIQUE_WORDS_FOR_PROGRESS ||
    (uniqueInKeepWindow >= 1 && recentRowCount === FIRST_WORD_ROW_COUNT) ||
    (uniqueInKeepWindow >= 2 && recentRowCount === SECOND_WORD_ROW_COUNT);

  let level: number;
  if (accelerate) level = base + LEVEL_BOOST_INCREMENT;
  else if (
    distinctWordCount < NEW_USER_THRESHOLD ||
    recentRowCount < SNAPSHOT_THRESHOLD_ADD_WORD_LENGTH ||
    recentWords.length === 0
  )
    level = MIN_WORD_LENGTH_FLOOR;
  else if (uniqueInAddWindow >= MIN_UNIQUE_WORDS_FOR_PROGRESS) level = base + 1;
  else if (uniqueInKeepWindow >= MIN_UNIQUE_WORDS_FOR_PROGRESS) level = base;
  else level = base - 1;
  level = Math.min(Math.max(level, MIN_WORD_LENGTH_FLOOR), MAX_WORD_LEVEL);

  // Unlike the server (whose word list is hundreds long), a short word list
  // can run out of fresh words, so recent words come back before giving up.
  const fitting = wordList.filter((w) => length(w) <= level);
  const fresh = fitting.filter((w) => !recentWords.includes(w));
  const candidates = fresh.length > 0 ? fresh : fitting.length > 0 ? fitting : wordList;

  // Seed scores come in steps of 0.5; anything else has been graded, and is
  // measured against the mean of the graded letters.
  const graded = Object.values(scores).filter((s) => !Number.isInteger(s * 2));
  const baseline = graded.length ? graded.reduce((a, b) => a + b, 0) / graded.length : 0;
  const scored = candidates.map((word) => ({
    word,
    score: Array.from(word).reduce((sum, ch) => {
      const s = scores[ch];
      if (s === undefined) return sum;
      return sum + (Number.isInteger(s * 2) ? s : s - baseline);
    }, 0),
  }));

  // Lowest score (the weakest letters) → longest → random.
  const min = Math.min(...scored.map((s) => s.score));
  const ties = scored.filter((s) => Math.abs(s.score - min) < 1e-9);
  const longest = Math.max(...ties.map((s) => length(s.word)));
  const pool = ties.filter((s) => length(s.word) === longest);
  return { word: pool[Math.floor(Math.random() * pool.length)].word, level };
}
