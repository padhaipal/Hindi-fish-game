"use client";

// ---------------------------------------------------------------------------
// WORD MACHINE — rotate the first letter to build the picture word.
// ---------------------------------------------------------------------------
// The PICTURE of the target word is shown (emoji). The last two letters are
// FIXED tiles (the rime, e.g. "a" "t"). A ROTOR tile on the LEFT holds the
// first letter; the child spins it with big ▲ / ▼ buttons (or a swipe) to
// cycle through candidate consonants and BLEND the current word aloud with the
// ▶ Read button. When the rotor lands on the correct first letter the word
// matches the picture, glows, and says its name. Mobile-first, big tap targets.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState, type CSSProperties, type TouchEvent as ReactTouchEvent } from "react";
import SpeakerIcon from "@/components/shared/SpeakerIcon";
import { primeSpeech } from "@/lib/speech";
import { speakWord, stopAll } from "@/lib/sound";
import { dingCorrect, chimeWin, tick, unlockSfx } from "@/lib/sfx";

interface Target {
  word: string;
  emoji: string;
  rime: string; // the fixed last two letters
  first: string; // the correct first letter
  rotor: string[]; // correct first letter + distractor consonants
}

// ~12 CVC targets, grouped by rime, each with a clear emoji. Every rotor set is
// the correct first letter plus 3-4 distractor consonants (shuffled at runtime).
const TARGETS: Target[] = [
  { word: "cat", emoji: "🐱", rime: "at", first: "c", rotor: ["c", "m", "r", "s", "f"] },
  { word: "hat", emoji: "🎩", rime: "at", first: "h", rotor: ["h", "b", "r", "m", "p"] },
  { word: "bat", emoji: "🦇", rime: "at", first: "b", rotor: ["b", "h", "m", "s", "r"] },
  { word: "sun", emoji: "☀️", rime: "un", first: "s", rotor: ["s", "b", "f", "r", "n"] },
  { word: "dog", emoji: "🐕", rime: "og", first: "d", rotor: ["d", "l", "f", "j", "h"] },
  { word: "hen", emoji: "🐔", rime: "en", first: "h", rotor: ["h", "p", "t", "d", "m"] },
  { word: "pen", emoji: "🖊️", rime: "en", first: "p", rotor: ["p", "h", "t", "d", "n"] },
  { word: "box", emoji: "📦", rime: "ox", first: "b", rotor: ["b", "f", "s", "l", "r"] },
  { word: "fox", emoji: "🦊", rime: "ox", first: "f", rotor: ["f", "b", "s", "p", "r"] },
  { word: "cup", emoji: "☕", rime: "up", first: "c", rotor: ["c", "p", "s", "m", "t"] },
  { word: "jet", emoji: "✈️", rime: "et", first: "j", rotor: ["j", "n", "p", "s", "w"] },
  { word: "bug", emoji: "🐛", rime: "ug", first: "b", rotor: ["b", "m", "r", "h", "j"] },
];

// ---- palette ---------------------------------------------------------------
const INK = "#123a4d";
const TEAL = "#1f8bbf";
const GREEN = "#1faa5a";

// A cheerful workshop / machine sky, layered over the .app frame.
const rootStyle: CSSProperties = {
  background:
    "radial-gradient(circle at 18% 14%, #7fe0ff 0, transparent 52%)," +
    "radial-gradient(circle at 84% 18%, #ffd76b 0, transparent 42%)," +
    "linear-gradient(#1aa6d8 0%, #1487c0 55%, #0f6ea3 100%)",
};

// Fisher-Yates shuffle (returns a new array).
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function WordMachineGame() {
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);
  const [index, setIndex] = useState(0);

  // Per-round rotor state.
  const [options, setOptions] = useState<string[]>([]);
  const [optIndex, setOptIndex] = useState(0);
  const [solved, setSolved] = useState(false);
  const [spin, setSpin] = useState(0); // re-triggers the rotor flip animation

  const touchStartY = useRef<number | null>(null);

  const target = TARGETS[index];
  const currentFirst = options[optIndex] ?? target.first;
  const currentWord = currentFirst + target.rime;

  // Build a shuffled rotor for round `i`, starting on a NON-correct letter so
  // there's always something to spin.
  function loadRound(i: number) {
    const t = TARGETS[i];
    const opts = shuffle(t.rotor);
    const correctAt = opts.indexOf(t.first);
    // Start one step away from the answer.
    let start = correctAt === 0 ? 1 : correctAt - 1;
    if (start >= opts.length) start = 0;
    setOptions(opts);
    setOptIndex(start);
    setSolved(false);
    setSpin((s) => s + 1);
  }

  // Celebrate the moment the rotor lands on the correct first letter.
  function celebrate(i: number) {
    setSolved(true);
    dingCorrect();
    setTimeout(() => speakWord(TARGETS[i].word), 260);
  }

  function rotate(dir: 1 | -1) {
    if (solved || options.length === 0) return;
    const n = (optIndex + dir + options.length) % options.length;
    setOptIndex(n);
    setSpin((s) => s + 1);
    if (options[n] === target.first) {
      celebrate(index);
    } else {
      tick();
    }
  }

  // Read the CURRENT word aloud so the child can blend as they spin.
  function readWord() {
    tick();
    speakWord(currentWord);
  }

  function onTouchStart(e: ReactTouchEvent) {
    touchStartY.current = e.touches[0]?.clientY ?? null;
  }
  function onTouchEnd(e: ReactTouchEvent) {
    const y0 = touchStartY.current;
    touchStartY.current = null;
    if (y0 == null) return;
    const dy = (e.changedTouches[0]?.clientY ?? y0) - y0;
    if (Math.abs(dy) < 24) return;
    // Swipe up = next letter (▲), swipe down = previous (▼).
    rotate(dy < 0 ? 1 : -1);
  }

  function startGame() {
    unlockSfx();
    primeSpeech();
    setStarted(true);
    setWon(false);
    setIndex(0);
    loadRound(0);
  }

  function next() {
    tick();
    stopAll();
    if (index + 1 >= TARGETS.length) {
      setWon(true);
      chimeWin();
      return;
    }
    const n = index + 1;
    setIndex(n);
    loadRound(n);
  }

  function playAgain() {
    tick();
    stopAll();
    setWon(false);
    setIndex(0);
    loadRound(0);
  }

  // Stop any audio if the component unmounts mid-speak.
  useEffect(() => () => stopAll(), []);

  const isLast = index + 1 >= TARGETS.length;

  // ---- letter tiles ----------------------------------------------------
  const rimeTiles = target.rime.split("").map((ch, i) => (
    <div key={`r${i}`} style={fixedTileStyle}>
      {ch}
    </div>
  ));

  return (
    <div className="app" style={rootStyle}>
      <a className="cornerLink" href="/" aria-label="All games">
        🏠
      </a>
      {started && !won && (
        <div className="blocksLevelPill">
          ⚙️ Word {index + 1} / {TARGETS.length}
        </div>
      )}

      {/* ---------------- Play area ---------------- */}
      {started && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: "58px 14px 22px",
            minHeight: 0,
          }}
        >
          {/* The picture we're building towards */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 28,
              background: "#fff",
              border: `6px solid ${solved ? "#ffd23f" : "#bfe9ff"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 70,
              lineHeight: 1,
              boxShadow: solved
                ? "0 6px 0 #00000020, 0 0 26px 5px #ffd23f99"
                : "0 6px 0 #00000020",
              transition: "border-color .25s ease, box-shadow .25s ease, transform .25s ease",
              transform: solved ? "scale(1.06)" : "scale(1)",
              flex: "0 0 auto",
            }}
          >
            <span aria-hidden="true">{target.emoji}</span>
          </div>

          <div style={{ fontSize: 16, fontWeight: 800, color: "#eaf8ff", height: 20 }}>
            {solved ? "You built it! 🎉" : "Spin the wheel to build the word"}
          </div>

          {/* The machine: rotor + fixed rime tiles */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 18px",
              borderRadius: 26,
              background: "#0e5f8fcc",
              boxShadow: "inset 0 3px 10px #00000033, 0 6px 0 #093f61",
            }}
          >
            {/* rotor column: ▲ / tile / ▼ */}
            <div
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            >
              <button
                onClick={() => rotate(1)}
                disabled={solved}
                aria-label="Next letter"
                style={arrowStyle(solved)}
              >
                ▲
              </button>

              <div
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                style={{
                  position: "relative",
                  width: 74,
                  height: 88,
                  borderRadius: 18,
                  background: solved
                    ? "linear-gradient(#fff7d6, #ffe27a)"
                    : "linear-gradient(#ffffff, #eaf6ff)",
                  border: `4px solid ${solved ? "#ffbf34" : "#ffffff"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 52,
                  fontWeight: 800,
                  color: solved ? "#8a5b00" : TEAL,
                  boxShadow: solved
                    ? "0 6px 0 #00000026, 0 0 20px 4px #ffd23f88"
                    : "0 6px 0 #00000026",
                  touchAction: "none",
                  userSelect: "none",
                  transition: "color .2s ease, background .2s ease, border-color .2s ease, box-shadow .2s ease",
                }}
              >
                <span key={spin} style={{ display: "block", animation: "pop .28s ease" }}>
                  {currentFirst}
                </span>
              </div>

              <button
                onClick={() => rotate(-1)}
                disabled={solved}
                aria-label="Previous letter"
                style={arrowStyle(solved)}
              >
                ▼
              </button>
            </div>

            {/* fixed rime tiles */}
            <div style={{ display: "flex", gap: 8 }}>{rimeTiles}</div>
          </div>

          {/* the current word spelled out */}
          <div
            style={{
              fontSize: 40,
              fontWeight: 800,
              letterSpacing: 2,
              color: solved ? "#fff" : "#eaf8ff",
              textShadow: solved
                ? "0 0 16px #ffd23f, 0 2px 4px #00000033"
                : "0 2px 4px #00000033",
              minHeight: 48,
              transition: "text-shadow .25s ease, color .25s ease",
            }}
          >
            {currentWord}
          </div>

          {/* controls */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              width: "100%",
              maxWidth: 360,
            }}
          >
            {!solved ? (
              <button className="soundBtn" onClick={readWord} style={{ marginTop: 0 }}>
                <SpeakerIcon size={26} />
                ▶ Read
              </button>
            ) : (
              <button
                className="bigButton"
                onClick={next}
                style={{ maxWidth: 340, animation: "pop .4s ease" }}
              >
                {isLast ? "Finish 🎉" : "Next →"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ---------------- Start overlay ---------------- */}
      {!started && (
        <div className="overlay">
          <div className="overlayCard" style={{ textAlign: "center" }}>
            <div className="overlayEmoji">⚙️</div>
            <div className="overlayTitle">Word Machine</div>
            <p style={{ margin: "4px 0 18px", fontSize: 17, fontWeight: 700, color: TEAL }}>
              Spin the wheel to change the first letter and build the picture word!
              <br />
              <span style={{ color: INK }}>_at → cat 🐱</span>
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
            <div className="overlayTitle">You did it!</div>
            <p style={{ margin: "2px 0 18px", fontSize: 18, fontWeight: 700, color: TEAL }}>
              You built all {TARGETS.length} words! ⚙️✨
            </p>
            <button className="bigButton" onClick={playAgain} style={{ marginBottom: 12 }}>
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

// A fixed (rime) letter tile — clearly non-spinnable.
const fixedTileStyle: CSSProperties = {
  width: 60,
  height: 88,
  borderRadius: 16,
  background: "#dff1ff",
  border: "4px solid #bfe4fb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 46,
  fontWeight: 800,
  color: GREEN,
  boxShadow: "0 5px 0 #00000022",
};

function arrowStyle(solved: boolean): CSSProperties {
  return {
    width: 74,
    height: 44,
    borderRadius: 14,
    border: "none",
    background: solved ? "#7fb8d6" : "linear-gradient(#ffe27a, #ffc21f)",
    color: solved ? "#eaf8ff" : "#7a5200",
    fontSize: 26,
    fontWeight: 800,
    lineHeight: 1,
    cursor: solved ? "default" : "pointer",
    boxShadow: solved ? "none" : "0 4px 0 #b98700",
    WebkitTapHighlightColor: "transparent",
    touchAction: "manipulation",
  };
}
