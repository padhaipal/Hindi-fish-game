"use client";

// ---------------------------------------------------------------------------
// SOUND DETECTIVE 🕵️ — find the two-letters-that-make-ONE-sound.
// The child hears a word, looks at the picture, and taps the sound-cluster
// hiding inside it. Level 1 hunts the digraphs sh / ch / th; Level 2 hunts
// beginning blends (st, tr, fr, gr, pl ...). A correct tap lights up those
// exact letters inside the printed word. Mobile-first, big tap targets.
// ---------------------------------------------------------------------------

import { useEffect, useState, type CSSProperties } from "react";
import SpeakerIcon from "@/components/shared/SpeakerIcon";
import { primeSpeech } from "@/lib/speech";
import { speakWord, stopAll } from "@/lib/sound";
import { dingCorrect, buzzWrong, chimeWin, unlockSfx } from "@/lib/sfx";

// ---- word data -------------------------------------------------------------
interface WordItem {
  word: string;
  emoji: string;
  answer: string;
  options?: string[]; // only Level 2 carries its own option set
}

// LEVEL 1 — digraphs. The three option buttons are ALWAYS sh / ch / th.
const DIGRAPH_OPTIONS = ["sh", "ch", "th"] as const;
const LEVEL1_WORDS: WordItem[] = [
  { word: "ship", emoji: "🚢", answer: "sh" },
  { word: "fish", emoji: "🐟", answer: "sh" },
  { word: "shell", emoji: "🐚", answer: "sh" },
  { word: "brush", emoji: "🖌️", answer: "sh" },
  { word: "chair", emoji: "🪑", answer: "ch" },
  { word: "cheese", emoji: "🧀", answer: "ch" },
  { word: "chess", emoji: "♟️", answer: "ch" },
  { word: "thumb", emoji: "👍", answer: "th" },
  { word: "three", emoji: "3️⃣", answer: "th" },
  { word: "bath", emoji: "🛁", answer: "th" },
  { word: "teeth", emoji: "🦷", answer: "th" },
  { word: "math", emoji: "➗", answer: "th" },
];

// LEVEL 2 — beginning blends. Each word ships its own 3 options (answer + 2
// plausible distractor blends). Options get shuffled per round.
const LEVEL2_WORDS: WordItem[] = [
  { word: "star", emoji: "⭐", answer: "st", options: ["st", "sp", "sk"] },
  { word: "stop", emoji: "🛑", answer: "st", options: ["st", "sn", "sl"] },
  { word: "tree", emoji: "🌳", answer: "tr", options: ["tr", "dr", "cr"] },
  { word: "frog", emoji: "🐸", answer: "fr", options: ["fr", "fl", "pr"] },
  { word: "grapes", emoji: "🍇", answer: "gr", options: ["gr", "gl", "br"] },
  { word: "plane", emoji: "✈️", answer: "pl", options: ["pl", "cl", "bl"] },
  { word: "clock", emoji: "🕐", answer: "cl", options: ["cl", "cr", "pl"] },
  { word: "snake", emoji: "🐍", answer: "sn", options: ["sn", "sm", "st"] },
  { word: "flag", emoji: "🚩", answer: "fl", options: ["fl", "fr", "bl"] },
  { word: "drum", emoji: "🥁", answer: "dr", options: ["dr", "tr", "gr"] },
  { word: "crab", emoji: "🦀", answer: "cr", options: ["cr", "cl", "gr"] },
];

const ROUNDS_PER_LEVEL = 7;

interface Round {
  word: string;
  emoji: string;
  answer: string;
  options: string[]; // shuffled, ready to render
}

// Fisher–Yates, returns a new array.
function shuffled<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildLevel(level: 0 | 1): Round[] {
  const src = level === 0 ? LEVEL1_WORDS : LEVEL2_WORDS;
  return shuffled(src)
    .slice(0, ROUNDS_PER_LEVEL)
    .map((w) => ({
      word: w.word,
      emoji: w.emoji,
      answer: w.answer,
      options: shuffled(level === 0 ? DIGRAPH_OPTIONS : (w.options ?? [])),
    }));
}

// ---- palette ---------------------------------------------------------------
const INK = "#20304a";
const GOLD = "#ffd23f";
const HILITE = "#ff6b3d"; // the colour the caught letters glow

// A moody detective-office indigo, layered over the .app frame.
const rootStyle: CSSProperties = {
  background:
    "radial-gradient(circle at 18% 12%, #4b6ea8 0, transparent 55%)," +
    "radial-gradient(circle at 84% 16%, #6d8fd0 0, transparent 45%)," +
    "linear-gradient(#1f2c4d 0%, #2c3f6b 55%, #3a548c 100%)",
};

export default function DetectiveGame() {
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);
  const [level, setLevel] = useState<0 | 1>(0);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [solved, setSolved] = useState(false);
  const [wrongOption, setWrongOption] = useState<string | null>(null);
  const [wrongNonce, setWrongNonce] = useState(0);

  const round = rounds[roundIndex];

  // Auto-speak the mystery word whenever a fresh round appears.
  useEffect(() => {
    if (!started || won || !round) return;
    const id = setTimeout(() => speakWord(round.word), 260);
    return () => clearTimeout(id);
  }, [started, won, level, roundIndex, round]);

  function startGame() {
    unlockSfx();
    primeSpeech();
    setLevel(0);
    setRounds(buildLevel(0));
    setRoundIndex(0);
    setSolved(false);
    setWrongOption(null);
    setWon(false);
    setStarted(true);
  }

  function listen() {
    if (round) speakWord(round.word);
  }

  function pick(opt: string) {
    if (solved || !round) return;
    if (opt === round.answer) {
      dingCorrect();
      setWrongOption(null);
      setSolved(true);
      // Say the word again with the caught letters now lit up.
      setTimeout(() => speakWord(round.word), 220);
    } else {
      buzzWrong();
      setWrongOption(opt);
      setWrongNonce((n) => n + 1);
      setTimeout(() => setWrongOption((cur) => (cur === opt ? null : cur)), 480);
    }
  }

  function next() {
    stopAll();
    setSolved(false);
    setWrongOption(null);

    // More rounds left in this level?
    if (roundIndex + 1 < rounds.length) {
      setRoundIndex(roundIndex + 1);
      return;
    }
    // Finished Level 1 → hunt the blends in Level 2.
    if (level === 0) {
      setLevel(1);
      setRounds(buildLevel(1));
      setRoundIndex(0);
      return;
    }
    // Finished the last blend round → celebrate.
    setWon(true);
    chimeWin();
  }

  function playAgain() {
    stopAll();
    startGame();
  }

  // ---- the printed word, with the caught cluster lit up once solved -------
  function renderWord(w: string, answer: string, lit: boolean) {
    const idx = lit ? w.indexOf(answer) : -1;
    const letter: CSSProperties = {
      fontSize: 46,
      fontWeight: 800,
      color: "#fff",
      letterSpacing: 1,
    };
    if (idx < 0) {
      return <span style={letter}>{w}</span>;
    }
    const before = w.slice(0, idx);
    const match = w.slice(idx, idx + answer.length);
    const after = w.slice(idx + answer.length);
    const hit: CSSProperties = {
      ...letter,
      color: HILITE,
      borderBottom: `5px solid ${HILITE}`,
      padding: "0 2px",
      borderRadius: 4,
      textShadow: "0 0 14px #ff6b3daa",
    };
    return (
      <span style={{ display: "inline-flex", alignItems: "baseline" }}>
        {before && <span style={letter}>{before}</span>}
        <span style={hit}>{match}</span>
        {after && <span style={letter}>{after}</span>}
      </span>
    );
  }

  // ---- one option button --------------------------------------------------
  function optionButton(opt: string) {
    const isCorrect = solved && round && opt === round.answer;
    const isWrong = wrongOption === opt;
    const style: CSSProperties = {
      minWidth: 92,
      padding: "16px 8px",
      borderRadius: 20,
      fontSize: 34,
      fontWeight: 800,
      lineHeight: 1,
      color: isCorrect ? "#1f7a3f" : isWrong ? "#b3261e" : INK,
      background: isCorrect ? "#e7ffef" : isWrong ? "#ffe1de" : "#fff",
      border: `5px solid ${isCorrect ? "#37c46b" : isWrong ? "#ff5a5a" : "#c7d4ea"}`,
      boxShadow: isCorrect
        ? "0 6px 0 #00000018, 0 0 20px 3px #37c46b66"
        : "0 6px 0 #00000018",
      cursor: solved ? "default" : "pointer",
      transition: "background .18s ease, border-color .18s ease, color .18s ease",
      animation: isWrong ? "shake .42s ease" : undefined,
      WebkitTapHighlightColor: "transparent",
      flex: "0 0 auto",
    };
    return (
      <button
        key={`${opt}-${isWrong ? wrongNonce : 0}`}
        onClick={() => pick(opt)}
        disabled={solved}
        style={style}
      >
        {opt}
      </button>
    );
  }

  const pillText =
    level === 0
      ? "🔍 sh · ch · th"
      : `🔍 Round ${roundIndex + 1}/${rounds.length}`;

  return (
    <div className="app" style={rootStyle}>
      <a className="cornerLink" href="/" aria-label="All games">
        🏠
      </a>
      {started && !won && <div className="blocksLevelPill">{pillText}</div>}

      {/* ---------------- Play area ---------------- */}
      {started && round && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
            padding: "64px 14px 24px",
            minHeight: 0,
          }}
        >
          {/* the picture clue */}
          <div
            style={{
              width: 128,
              height: 128,
              borderRadius: 28,
              background: "#fff",
              border: `5px solid ${GOLD}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 76,
              lineHeight: 1,
              boxShadow: "0 6px 0 #00000026, 0 0 22px 3px #ffd23f55",
              flex: "0 0 auto",
            }}
          >
            <span aria-hidden="true">{round.emoji}</span>
          </div>

          {/* the printed word (cluster lights up once caught) */}
          <div style={{ minHeight: 56, display: "flex", alignItems: "center" }}>
            {renderWord(round.word, round.answer, solved)}
          </div>

          {/* listen again */}
          <button className="soundBtn" onClick={listen} style={{ marginTop: 0 }}>
            <SpeakerIcon size={26} />
            Listen
          </button>

          {/* the detective question */}
          <div
            style={{
              fontSize: 19,
              fontWeight: 800,
              color: "#ffffffdd",
              textAlign: "center",
              textShadow: "0 1px 4px #00000033",
              maxWidth: 320,
            }}
          >
            {solved
              ? `🕵️ Found it! “${round.answer}” makes one sound.`
              : "🕵️ Which 2 letters make ONE sound?"}
          </div>

          {/* the option buttons */}
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center",
              width: "100%",
              maxWidth: 360,
            }}
          >
            {round.options.map((o) => optionButton(o))}
          </div>

          {/* next */}
          {solved && (
            <button
              className="bigButton blue"
              onClick={next}
              style={{ maxWidth: 340, animation: "pop .4s ease" }}
            >
              {level === 1 && roundIndex + 1 >= rounds.length
                ? "Finish 🎉"
                : "Next →"}
            </button>
          )}
        </div>
      )}

      {/* ---------------- Start overlay ---------------- */}
      {!started && (
        <div className="overlay">
          <div className="overlayCard" style={{ textAlign: "center" }}>
            <div className="overlayEmoji">🕵️</div>
            <div className="overlayTitle">Sound Detective</div>
            <p
              style={{
                margin: "4px 0 18px",
                fontSize: 17,
                fontWeight: 700,
                color: "#1f8bbf",
              }}
            >
              Two letters can hide ONE sound! 🔍
              <br />
              Listen, then catch the sound in the word.
            </p>
            <button className="bigButton" onClick={startGame}>
              ▶ Play
            </button>
          </div>
        </div>
      )}

      {/* ---------------- Win overlay ---------------- */}
      {won && (
        <div className="overlay">
          <div className="overlayCard" style={{ textAlign: "center" }}>
            <div className="overlayEmoji">🏆</div>
            <div className="overlayTitle">Case closed!</div>
            <p
              style={{
                margin: "2px 0 18px",
                fontSize: 18,
                fontWeight: 700,
                color: "#1f8bbf",
              }}
            >
              You caught every hidden sound! 🕵️🔍
            </p>
            <button
              className="bigButton"
              onClick={playAgain}
              style={{ marginBottom: 12 }}
            >
              ▶ Play again
            </button>
            <a className="bigButton blue" href="/">
              🏠 All games
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
