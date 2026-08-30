"use client";

// ---------------------------------------------------------------------------
// ALfA ENGLISH — SILLY SENTENCES  (book Lesson 37, "Sentences Game")
// ---------------------------------------------------------------------------
// The child builds a (possibly silly) sentence by picking ONE word from each of
// FOUR columns, in order:
//   A — Who?         (nouns/subjects)  e.g. "The fish"
//   B — Doing what?  (verbs)           e.g. "swims"
//   C — Where?       (prepositions)    e.g. "in"
//   D — What?        (nouns/objects)   e.g. "the pond"
//
// Each pick appends to a big SENTENCE-IN-PROGRESS strip at the top and advances
// to the next column (step 1/4 … 4/4). After the fourth pick the whole sentence
// is assembled with a capital first letter and a full stop, spoken aloud with
// applause + a celebration, and a "🔄 New sentence" button reshuffles and starts
// over. It is endless: silly sentences are the point — there is no lose state.
//
// Only the full sentence is spoken (never the tiny function words on their own).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { speakWord, playApplause, stopAll } from "@/lib/sound";
import { unlockSfx } from "@/lib/sfx";
import { primeSpeech } from "@/lib/speech";

// ---- The four columns of words --------------------------------------------
interface Column {
  key: "A" | "B" | "C" | "D";
  heading: string;
  accent: string; // solid accent colour for this column
  soft: string; // pale background tint for the strip slot
  words: string[];
}

const COLUMNS: Column[] = [
  {
    key: "A",
    heading: "Who?",
    accent: "#e8477a",
    soft: "#ffe1ec",
    words: [
      "A cat",
      "The fish",
      "The teacher",
      "A doctor",
      "A friend",
      "The grandmother",
      "A baby",
      "An elephant",
      "An aunt",
    ],
  },
  {
    key: "B",
    heading: "Doing what?",
    accent: "#f08a24",
    soft: "#ffecd6",
    words: [
      "runs",
      "eats",
      "sleeps",
      "plays",
      "goes",
      "reads",
      "writes",
      "swims",
      "talks",
      "helps",
    ],
  },
  {
    key: "C",
    heading: "Where?",
    accent: "#2fa84f",
    soft: "#d9f6e0",
    words: ["in", "on", "under", "at", "with", "by", "near", "behind", "over"],
  },
  {
    key: "D",
    heading: "What?",
    accent: "#3d7de0",
    soft: "#dce9ff",
    words: [
      "the ball",
      "the bike",
      "a book",
      "a house",
      "the car",
      "the park",
      "school",
      "a chair",
      "the pond",
    ],
  },
];

// Fisher–Yates shuffle (returns a new array).
function shuffle<T>(input: T[]): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Assemble the four chosen words into a real sentence: capital first letter,
// single spaces, full stop at the end.
function assemble(words: string[]): string {
  const joined = words.join(" ").trim();
  const capped = joined.charAt(0).toUpperCase() + joined.slice(1);
  return `${capped}.`;
}

type Phase = "start" | "building" | "done";

// A magical playful sky for the .app frame.
const rootStyle: CSSProperties = {
  background:
    "radial-gradient(circle at 18% 12%, #ffd36e 0, transparent 42%)," +
    "radial-gradient(circle at 84% 16%, #7ee0ff 0, transparent 40%)," +
    "linear-gradient(#7b5ce0 0%, #9b6ff0 45%, #c68bf5 100%)",
};

export default function SillySentencesGame() {
  const [phase, setPhase] = useState<Phase>("start");
  const [step, setStep] = useState(0); // 0..3 = which column is active
  const [picked, setPicked] = useState<string[]>([]); // chosen word per column
  const [order, setOrder] = useState<string[][]>([]); // shuffled words per column
  const [pop, setPop] = useState(false); // celebration pop on completion

  const timers = useRef<number[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
  }, []);
  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => () => clearTimers(), []);
  useEffect(() => stopAll, []); // stop speech/audio on unmount

  // Reshuffle every column and reset to column A.
  const reset = useCallback(() => {
    clearTimers();
    stopAll();
    setOrder(COLUMNS.map((c) => shuffle(c.words)));
    setPicked([]);
    setStep(0);
    setPop(false);
  }, []);

  const startGame = useCallback(() => {
    unlockSfx();
    primeSpeech();
    reset();
    setPhase("building");
  }, [reset]);

  const newSentence = useCallback(() => {
    reset();
    setPhase("building");
  }, [reset]);

  // The child tapped a word in the active column.
  const onPick = useCallback(
    (word: string) => {
      if (phase !== "building") return;
      const next = [...picked, word];
      setPicked(next);

      if (next.length < COLUMNS.length) {
        setStep(next.length); // advance to the next column
        return;
      }

      // Fourth (final) word chosen → assemble, READ the sentence, and only clap
      // once it has finished being read out.
      const sentence = assemble(next);
      setPhase("done");
      setPop(true);
      later(() => speakWord(sentence, () => playApplause()), 260);
      later(() => setPop(false), 700);
    },
    [phase, picked, later]
  );

  const activeCol = COLUMNS[step];
  const activeWords = order[step] ?? activeCol?.words ?? [];
  const fullSentence = picked.length === COLUMNS.length ? assemble(picked) : "";

  return (
    <div className="app" style={rootStyle}>
      <a className="cornerLink" href="/" aria-label="All games">
        ←
      </a>
      {phase !== "start" && <div className="blocksLevelPill">🤪 Silly Sentences</div>}

      {phase !== "start" && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            padding: "58px 12px 16px",
            gap: 12,
          }}
        >
          {/* ---- Sentence-in-progress strip (top) ---- */}
          <div
            style={{
              flex: "0 0 auto",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              minHeight: 78,
              padding: "12px 12px",
              borderRadius: 20,
              background: "#ffffff26",
              border: "3px solid #ffffff55",
              boxShadow: "0 4px 0 #00000018",
              animation: pop ? "pop 0.5s ease" : undefined,
            }}
          >
            {COLUMNS.map((col, i) => {
              const has = picked[i] !== undefined;
              const isLastFilled = i === COLUMNS.length - 1 && has;
              return (
                <span
                  key={col.key}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 44,
                    minHeight: 44,
                    padding: "6px 14px",
                    borderRadius: 13,
                    fontSize: 22,
                    fontWeight: 800,
                    lineHeight: 1.1,
                    color: has ? "#fff" : col.accent,
                    background: has ? col.accent : col.soft,
                    border: has ? "none" : `3px dashed ${col.accent}66`,
                    boxShadow: has ? "0 4px 0 #00000026" : "none",
                    opacity: has ? 1 : i === step && phase === "building" ? 1 : 0.55,
                    outline:
                      i === step && phase === "building" ? `3px solid #ffffffcc` : undefined,
                    transition: "all 0.18s ease",
                  }}
                >
                  {has ? `${picked[i]}${isLastFilled ? "." : ""}` : "•••"}
                </span>
              );
            })}
          </div>

          {/* ---- Step indicator + column heading ---- */}
          {phase === "building" && activeCol && (
            <div
              style={{
                flex: "0 0 auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 14px",
                  borderRadius: 999,
                  background: activeCol.accent,
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 800,
                  boxShadow: "0 3px 0 #00000022",
                }}
              >
                Step {step + 1}/4
              </div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  color: "#fff",
                  textShadow: "0 2px 6px #00000033",
                }}
              >
                {activeCol.heading}
              </div>
            </div>
          )}

          {/* ---- Active column: grid of tappable word chips ---- */}
          {phase === "building" && activeCol && (
            <div
              style={{
                flex: "1 1 auto",
                minHeight: 0,
                overflowY: "auto",
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: 12,
                alignContent: "start",
                padding: "4px 4px 8px",
              }}
            >
              {activeWords.map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => onPick(word)}
                  aria-label={word}
                  style={{
                    minHeight: 64,
                    padding: "10px 12px",
                    borderRadius: 18,
                    fontSize: 22,
                    fontWeight: 800,
                    lineHeight: 1.15,
                    color: activeCol.accent,
                    background: "#fff",
                    border: `4px solid ${activeCol.accent}`,
                    boxShadow: `0 5px 0 ${activeCol.accent}`,
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {word}
                </button>
              ))}
            </div>
          )}

          {/* ---- Completion: celebration + New sentence ---- */}
          {phase === "done" && (
            <div
              style={{
                flex: "1 1 auto",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 18,
                padding: "8px 10px 20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 48, animation: "pop 0.6s ease" }}>🎉 🤪 🎉</div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#fff",
                  textShadow: "0 2px 6px #00000033",
                  maxWidth: 340,
                }}
              >
                {fullSentence}
              </div>
              <button
                type="button"
                className="soundBtn soundBtn--compact"
                onClick={() => speakWord(fullSentence)}
                aria-label="Listen again"
              >
                🔊 Listen
              </button>
              <button
                type="button"
                className="bigButton"
                style={{ maxWidth: 320 }}
                onClick={newSentence}
              >
                🔄 New sentence
              </button>
              <a className="bigButton blue" href="/" style={{ maxWidth: 320 }}>
                🏠 All games
              </a>
            </div>
          )}
        </div>
      )}

      {/* ---- Start overlay ---- */}
      {phase === "start" && (
        <div className="overlay">
          <div className="overlayCard" style={{ textAlign: "center" }}>
            <div className="overlayEmoji">🤪</div>
            <div className="overlayTitle">Silly Sentences</div>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#7b5ce0", margin: "4px 0 18px" }}>
              Pick a word from each box to build a funny sentence!
              <br />
              <span style={{ color: "#0a3d57" }}>The fish swims in the pond.</span>
            </p>
            <button type="button" className="bigButton" onClick={startGame}>
              ▶ Play
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
