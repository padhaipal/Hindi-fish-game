import { useState } from "react";
import type { Student } from "../store/students";
import { stopSounds } from "../media/player";
import PondGame from "@/components/fish/PondGame";
import { stopWinLoseSounds } from "@/lib/audio";
import "../games/fish.css";

// The repo's games, copied into src/games and run inside the app. Each opens
// full screen with a ✕ to come back.
const GAMES = [
  { id: "fish", icon: "🐟", name: "मछली पकड़ो", about: "सही अक्षर वाली मछली पकड़ो" },
];

export function GamesScreen({ student }: { student: Student }) {
  const [playing, setPlaying] = useState<string | null>(null);

  const exit = () => {
    stopWinLoseSounds();
    setPlaying(null);
  };

  if (playing === "fish") {
    return (
      <div className="fishgame">
        <button className="fishgame-close" onClick={exit} aria-label="खेल बंद करें">
          ✕
        </button>
        <PondGame onExit={exit} />
      </div>
    );
  }

  return (
    <div className="games">
      <h2>{student.name} के खेल</h2>
      <div className="game-grid">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className="game-tile"
            onClick={() => {
              stopSounds();
              setPlaying(g.id);
            }}
          >
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
