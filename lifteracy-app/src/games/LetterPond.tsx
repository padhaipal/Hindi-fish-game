// A short fish game built into the app, after the repo's /fish game: tap
// every fish carrying the target letter. Targets are the student's practice
// letters, weakest first.
import { useEffect, useMemo, useState } from "react";
import { letterMedia } from "../media/letters";
import { playEffect, playSounds, stopSounds } from "../media/player";

const ROUNDS = 4;
const TARGETS_PER_ROUND = 2;
const FISH_PER_ROUND = 5;
// Letters that look or sound like the practice letters, as distractors.
const DISTRACTORS = ["क", "प", "म", "ज", "आ", "स"];
const FISH_COLOURS = ["#ff8a5b", "#ffd166", "#7bdff2", "#b388eb", "#90e39a"];

interface Fish {
  id: number;
  char: string;
  top: number; // % from the top of the pond
  duration: number; // seconds to cross
  delay: number;
  colour: string;
  caught: boolean;
  shaking: boolean;
}

function makeRound(target: string, letters: string[], round: number): Fish[] {
  const others = [...letters.filter((l) => l !== target), ...DISTRACTORS.filter((d) => !letters.includes(d))];
  const chars = [
    ...Array(TARGETS_PER_ROUND).fill(target),
    ...others.sort(() => Math.random() - 0.5).slice(0, FISH_PER_ROUND - TARGETS_PER_ROUND),
  ].sort(() => Math.random() - 0.5);
  return chars.map((char, i) => ({
    id: round * 100 + i,
    char,
    top: 8 + i * (80 / FISH_PER_ROUND),
    duration: 7 + Math.random() * 4,
    delay: -Math.random() * 8,
    colour: FISH_COLOURS[i % FISH_COLOURS.length],
    caught: false,
    shaking: false,
  }));
}

const sayTarget = (char: string) => {
  const m = letterMedia(char);
  return playSounds([{ say: "पकड़ो" }, m.letterAudio ? { src: m.letterAudio } : { say: char }]);
};

export function LetterPond({ letters, onExit }: { letters: string[]; onExit: () => void }) {
  const [round, setRound] = useState(0);
  const target = letters[round % letters.length];
  const letterKey = letters.join("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialFish = useMemo(() => makeRound(target, letters, round), [target, letterKey, round]);
  const [fish, setFish] = useState(initialFish);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    setFish(initialFish);
    if (round < ROUNDS) void sayTarget(target);
    return stopSounds;
  }, [initialFish, round, target]);

  const tap = (f: Fish) => {
    if (f.caught) return;
    if (f.char === target) {
      const m = letterMedia(f.char);
      void playSounds([m.letterAudio ? { src: m.letterAudio } : { say: f.char }]);
      setStars((s) => s + 1);
      const next = fish.map((x) => (x.id === f.id ? { ...x, caught: true } : x));
      setFish(next);
      if (next.filter((x) => x.char === target && !x.caught).length === 0) {
        setTimeout(() => setRound((r) => r + 1), 900);
      }
    } else {
      setFish((all) => all.map((x) => (x.id === f.id ? { ...x, shaking: true } : x)));
      setTimeout(() => setFish((all) => all.map((x) => (x.id === f.id ? { ...x, shaking: false } : x))), 500);
    }
  };

  useEffect(() => {
    if (round === ROUNDS) {
      playEffect("clap");
      void playSounds([{ say: "शाबाश! तुमने सारी मछलियाँ पकड़ लीं।" }]);
    }
  }, [round]);

  if (round >= ROUNDS) {
    return (
      <div className="pond-done">
        <div className="sticker">🏆</div>
        <p>शाबाश! ⭐ × {stars}</p>
        <div className="row">
          <button className="secondary big" onClick={onExit}>वापस</button>
          <button className="primary big" onClick={() => { setStars(0); setRound(0); }}>फिर खेलो</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pond-game">
      <div className="pond-top">
        <button className="link" onClick={onExit}>← वापस</button>
        <button className="pond-target" onClick={() => sayTarget(target)} aria-label="फिर सुनो">
          {target} <span>🔊</span>
        </button>
        <span className="pond-stars">⭐ {stars}</span>
      </div>
      <div className="pond">
        {fish.map((f) => (
          <button
            key={f.id}
            className={`fish ${f.caught ? "caught" : ""} ${f.shaking ? "shake" : ""}`}
            style={{
              top: `${f.top}%`,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
              ["--fish" as string]: f.colour,
            }}
            onClick={() => tap(f)}
            aria-label={`मछली ${f.char}`}
          >
            <span className="fish-body">{f.char}</span>
            <span className="fish-tail" />
          </button>
        ))}
      </div>
    </div>
  );
}
