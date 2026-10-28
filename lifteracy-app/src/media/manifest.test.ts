import { describe, expect, it } from "vitest";
import { newStudent, type Student } from "../store/students";
import { answerLesson, answerWithWrongLetters, openLesson } from "../lesson/session";
import { LESSON_WORDS } from "../lesson/words";
import { mediaFor } from "./manifest";

// Walk every path through each lesson word with right / wrong / misread
// answers, and check the screen has something to show and say at each step.
function reachableStids(): Set<string> {
  const seen = new Set<string>();
  const walk = (student: Student, depth: number) => {
    if (depth > 14) return;
    const word = student.lesson!.word;
    const view = openLesson(student).view;
    const answers =
      view.state === "word"
        ? [view.expected, "~", ...Array.from(word).map((_, i) => answerWithWrongLetters(word, [i]))]
        : [view.expected, "~"];
    for (const a of answers) {
      const next = answerLesson(student, [a]);
      next.view.stids.forEach((s) => seen.add(s));
      if (!next.view.done) walk(next.student, depth + 1);
    }
  };
  for (let i = 0; i < LESSON_WORDS.length * 3; i++) {
    const opened = openLesson(newStudent("x"));
    opened.view.stids.forEach((s) => seen.add(s));
    walk(opened.student, 0);
  }
  return seen;
}

describe("media manifest", () => {
  it("covers every step the lesson words can reach", () => {
    const stids = [...reachableStids()];
    expect(stids.length).toBeGreaterThan(10);
    for (const stid of stids) {
      const media = mediaFor(stid);
      expect(media.sounds.length, stid).toBeGreaterThan(0);
    }
  });
});
