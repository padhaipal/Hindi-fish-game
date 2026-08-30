"use client";

// ---------------------------------------------------------------------------
// LESSON FLOW — one lesson = Frog Jump then Fish, for that lesson's letters.
// ---------------------------------------------------------------------------
// Each odd reading lesson (1/3/5/7/9) has its own URL (/lesson/1 ...) for the
// book's QR codes. The child plays Frog Jump first; on finishing it they
// continue to the Fish game; finishing that completes the lesson.
// ---------------------------------------------------------------------------

import { useState } from "react";
import PondHopGame from "@/components/pond/PondHopGame";
import FishGame from "@/components/fish/FishGame";
import { getReadingLesson, READING_LESSONS } from "@/lib/lessons";

type Stage = "frog" | "fish" | "done";

export default function LessonFlow({ lesson }: { lesson: number }) {
  const [stage, setStage] = useState<Stage>("frog");

  const cfg = getReadingLesson(lesson);
  const idx = READING_LESSONS.findIndex((l) => l.n === lesson);
  const next = idx >= 0 && idx < READING_LESSONS.length - 1 ? READING_LESSONS[idx + 1].n : null;

  if (stage === "frog") {
    return <PondHopGame key={`frog-${lesson}`} lesson={lesson} onFinish={() => setStage("fish")} />;
  }
  if (stage === "fish") {
    return <FishGame key={`fish-${lesson}`} lesson={lesson} onFinish={() => setStage("done")} />;
  }

  // Lesson complete.
  return (
    <main style={{ position: "relative", height: "100dvh", background: cfg?.bg ?? "linear-gradient(#aef0ff,#62d0f5)" }}>
      <div className="overlay">
        <div className="overlayCard">
          <div className="overlayEmoji">🏆</div>
          <div className="overlayTitle">Lesson {lesson} done!</div>
          <div style={{ fontSize: 18, color: "#0a3d57", margin: "2px 0 16px" }}>
            You finished Frog Jump and Fish 🎉
          </div>
          <button type="button" className="bigButton" onClick={() => setStage("frog")}>
            ▶ Play again
          </button>
          {next && (
            <a className="bigButton blue" href={`/lesson/${next}`} style={{ marginTop: 10 }}>
              Lesson {next} →
            </a>
          )}
          <a
            className="bigButton"
            href="/"
            style={{ marginTop: 10, background: "linear-gradient(#8fa6b5,#6f8898)", boxShadow: "0 6px 0 #566d7b" }}
          >
            🏠 All games
          </a>
        </div>
      </div>
    </main>
  );
}
