// ---------------------------------------------------------------------------
// LESSON PICKER — the screen a lesson-based game (Fish, Frog Jump, Writing)
// shows first. Each lesson is a deep link (e.g. /fish/lesson-1) that can be
// shared on its own.
// ---------------------------------------------------------------------------
import Link from "next/link";
import { Lesson } from "@/lib/lessons";

export default function LessonPicker({
  base,
  title,
  emoji,
  hint,
  lessons,
}: {
  base: string; // e.g. "/fish"
  title: string;
  emoji: string;
  hint: string;
  lessons: Lesson[];
}) {
  return (
    <main className="lessonWrap">
      <div className="lessonCard">
        <div className="lessonEmoji">{emoji}</div>
        <h1 className="lessonTitle">{title}</h1>
        <p className="lessonHint">{hint}</p>
        <div className="lessonList">
          {lessons.map((l) => (
            <Link key={l.n} className="lessonBtn" href={`${base}/lesson-${l.n}`}>
              <span className="lessonBtnNum">{l.n}</span>
              Lesson {l.n}
              <span className="lessonBtnLetters">{l.letters.join(" ")}</span>
            </Link>
          ))}
        </div>
        <Link
          href="/"
          style={{ display: "inline-block", marginTop: 16, fontSize: 16, fontWeight: 800, color: "#1f8bbf", textDecoration: "none" }}
        >
          ← All games
        </Link>
      </div>
    </main>
  );
}
