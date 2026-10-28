import { describe, expect, it } from "vitest";
import { newStudent } from "../store/students";
import { answerLesson, answerWithWrongLetters, openLesson } from "./session";

function run(answers: string[]) {
  let { student, view } = openLesson(newStudent("Asha"));
  const seen = [view.stids.join(",")];
  for (const a of answers) {
    ({ student, view } = answerLesson(student, [a]));
    seen.push(view.stids.join(","));
  }
  return { student, view, seen };
}

describe("अब lesson", () => {
  it("opens on the word", () => {
    const { view } = openLesson(newStudent("Asha"));
    expect(view.word).toBe("अब");
    expect(view.stids).toEqual(["अब-start-word-initial"]);
  });

  it("right first time completes and raises both letters", () => {
    const { student, view } = run(["अब"]);
    expect(view.done).toBe(true);
    expect(view.stids).toEqual(["अब-word-complete-correct-first"]);
    expect(student.scores["अ"]).toBeCloseTo(1.01);
    expect(student.scores["ब"]).toBeCloseTo(1.01);
    expect(student.turns).toHaveLength(1);
  });

  it("misread ब walks letter → picture → letter card → word", () => {
    const { seen, view, student } = run([
      answerWithWrongLetters("अब", [1]), // अज
      "क", // wrong letter
      "बतख", // names the picture
      "ब", // first sound
      "अब",
    ]);
    console.log(seen);
    expect(seen[1]).toBe("ब-word-routeWrongLetter-drillLetters");
    expect(view.done).toBe(true);
    expect(student.scores["ब"]).toBeLessThan(0);
  });

  it("teacher ✅ on each step: expected answer is accepted", () => {
    let { student, view } = openLesson(newStudent("Asha"));
    ({ student, view } = answerLesson(student, [answerWithWrongLetters("अब", [0])]));
    expect(view.letter).toBe("अ");
    for (let i = 0; i < 6 && !view.done; i++) {
      ({ student, view } = answerLesson(student, [view.expected]));
    }
    expect(view.done).toBe(true);
  });

  it("nothing heard counts as wrong", () => {
    const { view } = run([""]);
    expect(view.done).toBe(false);
  });
});
