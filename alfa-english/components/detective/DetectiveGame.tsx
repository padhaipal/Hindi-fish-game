"use client";

// ---------------------------------------------------------------------------
// SOUND DETECTIVE 🕵️ — fill the BLANK with the sound-cluster that's hiding.
// The child hears a word, looks at the picture, and sees the word with its
// tricky cluster BLANKED where it belongs (e.g. "__ar", "fi__"). They tap the
// cluster that fills the blank; a correct tap slots the letters back in, lit
// up. Level 1 hunts beginning BLENDS (st, tr, fr, gr, pl ...); Level 2 hunts
// the DIGRAPHS (ng, sh, ch, th, ph). Mobile-first, big tap targets.
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
  options: string[]; // correct + 2 distractors; shuffled per round
}

// LEVEL 1 — beginning BLENDS. Each word ships its own 3 options (answer + 2
// plausible distractor blends). The blank sits at the START of the word.
const LEVEL1_WORDS: WordItem[] = [
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
  { word: "sled", emoji: "🛷", answer: "sl", options: ["sl", "sn", "sk"] },
];

// LEVEL 2 — DIGRAPHS (ng, sh, ch, th, ph). Options are always drawn from that
// digraph set. The blank sits wherever the cluster lives in the word.
const LEVEL2_WORDS: WordItem[] = [
  { word: "ship", emoji: "🚢", answer: "sh", options: ["sh", "ch", "th"] },
  { word: "fish", emoji: "🐟", answer: "sh", options: ["sh", "ph", "ch"] },
  { word: "shell", emoji: "🐚", answer: "sh", options: ["sh", "th", "ch"] },
  { word: "chair", emoji: "🪑", answer: "ch", options: ["ch", "sh", "th"] },
  { word: "cheese", emoji: "🧀", answer: "ch", options: ["ch", "th", "ph"] },
  { word: "chess", emoji: "♟️", answer: "ch", options: ["ch", "sh", "ng"] },
  { word: "thumb", emoji: "👍", answer: "th", options: ["th", "sh", "ch"] },
  { word: "bath", emoji: "🛁", answer: "th", options: ["th", "sh", "ph"] },
  { word: "teeth", emoji: "🦷", answer: "th", options: ["th", "ch", "ng"] },
  { word: "ring", emoji: "💍", answer: "ng", options: ["ng", "th", "sh"] },
  { word: "king", emoji: "👑", answer: "ng", options: ["ng", "ph", "ch"] },
  { word: "phone", emoji: "📱", answer: "ph", options: ["ph", "sh", "th"] },
];

const ROUNDS_PER_LEVEL = 8;

interface Round {
  word: string;
  emoji: string;
  answer: string;
  blankAt: number; // index in `word` where the cluster (and blank) sits
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
      blankAt: w.word.indexOf(w.answer),
      options: shuffled(w.options),
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
      // Say the word again with the blank now filled in.
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
    // Finished Level 1 blends → hunt the digraphs in Level 2.
    if (level === 0) {
      setLevel(1);
      setRounds(buildLevel(1));
      setRoundIndex(0);
      return;
    }
    // Finished the last digraph round → celebrate.
    setWon(true);
    chimeWin();
  }

  function playAgain() {
    stopAll();
    startGame();
  }

  // ---- the word with a BLANK where the cluster belongs --------------------
  // Before solving: shows e.g. "fi__". After solving: the cluster slots back
  // in, lit up in the highlight colour.
  function renderWordBlank(r: Round, filled: boolean) {
    const before = r.word.slice(0, r.blankAt);
    const after = r.word.slice(r.blankAt + r.answer.length);
    const letter: CSSProperties = {
      fontSize: 46,
      fontWeight: 800,
      color: "#fff",
      letterSpacing: 1,
    };
    const blankSlot: CSSProperties = {
      fontSize: 46,
      fontWeight: 800,
      letterSpacing: 4,
      color: filled ? HILITE : "#ffffff66",
      borderBottom: `5px solid ${filled ? HILITE : GOLD}`,
      padding: "0 6px",
      margin: "0 2px",
      borderRadius: 4,
      textShadow: filled ? "0 0 14px #ff6b3daa" : undefined,
      transition: "color .2s ease, border-color .2s ease",
    };
    // Placeholder blanks — one underscore per hidden letter.
    const placeholder = "_".repeat(r.answer.length);
    return (
      <span style={{ display: "inline-flex", alignItems: "baseline" }}>
        {before && <span style={letter}>{before}</span>}
        <span style={blankSlot}>{filled ? r.answer : placeholder}</span>
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

  const levelName = level === 0 ? "Blends" : "Digraphs";
  const total = rounds.length || ROUNDS_PER_LEVEL;
  const current = Math.min(roundIndex + 1, total);
  const progressPct = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="app" style={rootStyle}>
      <a className="cornerLink" href="/" aria-label="All games">
        🏠
      </a>
      {started && !won && (
        <div className="blocksLevelPill">
          🔍 Level {level + 1} · {levelName}
        </div>
      )}

      {/* ---------------- Play area ---------------- */}
      {started && round && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: "64px 14px 24px",
            minHeight: 0,
          }}
        >
          {/* ---- progress: counter + filling bar ---- */}
          <div style={{ width: "100%", maxWidth: 340, flex: "0 0 auto" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
                fontSize: 14,
                fontWeight: 800,
                color: "#ffffffcc",
                textShadow: "0 1px 3px #00000044",
              }}
            >
              <span>🕵️ Round {current} / {total}</span>
              <span>{levelName}</span>
            </div>
            <div
              style={{
                height: 12,
                borderRadius: 8,
                background: "#ffffff2e",
                overflow: "hidden",
                border: "1px solid #ffffff33",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  borderRadius: 8,
                  background: `linear-gradient(90deg, ${GOLD}, ${HILITE})`,
                  boxShadow: "0 0 12px #ffd23f88",
                  transition: "width .35s ease",
                }}
              />
            </div>
          </div>

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

          {/* the word with a blank (fills in once solved) */}
          <div style={{ minHeight: 56, display: "flex", alignItems: "center" }}>
            {renderWordBlank(round, solved)}
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
              ? `🕵️ Case solved! “${round.answer}” fills the blank.`
              : "🕵️ Which sound fills the blank?"}
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
              A sound is missing from the word! 🔍
              <br />
              Listen, then tap the letters that fill the blank.
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
              You filled every hidden blank! 🕵️🔍
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
