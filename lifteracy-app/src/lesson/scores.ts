// Phone port of ScoreService.gradeAndRecord (pp-sketch
// src/literacy/score/score.service.ts). Keep the numbers in step with it.
export const MIN_SCORE = -10;

function calculateNewScore(
  previousScore: number | undefined,
  correct: boolean,
): { score: number; floored: boolean } {
  const base = previousScore ?? 0;
  const raw = correct ? base + 1.01 : base - 3.001;
  return {
    score: Math.max(MIN_SCORE, raw),
    floored: !correct && raw < MIN_SCORE,
  };
}

// Returns the new score map and the letters whose wrong answer hit the floor.
// Like pp-sketch, a whole-number score (a seed nobody has graded yet) counts
// as no previous score.
export function gradeAndRecord(
  scores: Record<string, number>,
  correct: string[],
  incorrect: string[],
): { scores: Record<string, number>; floored: string[] } {
  const next = { ...scores };
  const floored: string[] = [];
  const grade = (grapheme: string, isCorrect: boolean) => {
    const latest = next[grapheme];
    const previous = latest === undefined || latest % 1 === 0 ? undefined : latest;
    const result = calculateNewScore(previous, isCorrect);
    next[grapheme] = result.score;
    if (result.floored) floored.push(grapheme);
  };
  for (const g of correct) grade(g, true);
  for (const g of incorrect) grade(g, false);
  return { scores: next, floored };
}
