import { useState } from "react";
import type { Student } from "../store/students";
import { LetterPond } from "../games/LetterPond";
import { LESSON_WORDS } from "../lesson/words";
import { LETTER_MEDIA } from "../media/letters";

// The games run inside the app and practise the current student's letters:
// those in the lesson words that have pictures and sounds, weakest first.
export function practiceLetters(student: Student): string[] {
  const letters = [...new Set(LESSON_WORDS.flatMap((w) => Array.from(w)))].filter((c) => LETTER_MEDIA[c]);
  return letters.sort((a, b) => (student.scores[a] ?? 0) - (student.scores[b] ?? 0));
}

const GAMES = [
  { id: "pond", icon: "🐟", name: "मछली तालाब", about: "सही अक्षर वाली मछली पकड़ो" },
];

export function GamesScreen({ student }: { student: Student }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const letters = practiceLetters(student);

  if (playing === "pond") {
    return <LetterPond letters={letters} onExit={() => setPlaying(null)} />;
  }

  return (
    <div className="games">
      <h2>{student.name} के खेल</h2>
      <p className="hint">
        अभ्यास के अक्षर: <b>{letters.join(" ")}</b> (सबसे कमज़ोर पहले)
      </p>
      <div className="game-grid">
        {GAMES.map((g) => (
          <button key={g.id} className="game-tile" onClick={() => setPlaying(g.id)}>
            <span className="game-icon">{g.icon}</span>
            <strong>{g.name}</strong>
            <small>{g.about}</small>
          </button>
        ))}
        <div className="game-tile soon">
          <span className="game-icon">🧩</span>
          <strong>और खेल जल्द</strong>
          <small>ब्लॉक, मेमोरी, वर्ड ट्रेन, तालाब कूद, लेखन</small>
        </div>
      </div>
    </div>
  );
}
