"use client";

// ---------------------------------------------------------------------------
// WORD MACHINE — spin the wheel to build the picture word.
// ---------------------------------------------------------------------------
// The PICTURE of the target word is shown (emoji). The last two letters are
// FIXED tiles (the rime, e.g. "a" "t"). A VISIBLE SPINNING WHEEL / SLOT REEL on
// the LEFT holds the first letter: the learner sees the letter ABOVE (faint),
// the CURRENT letter (big, centred, framed in a window) and the letter BELOW
// (faint), so they can see what is coming. They spin it with big ▲ / ▼ buttons
// (or a swipe up / down) and the reel visibly scrolls. When the wheel lands on
// the correct first letter the word matches the picture, glows, and says its
// name. Targets are sequenced in RIME BATCHES: at least 3 words that share the
// same last-two-letters play in a row before a fresh rime. Mobile-first.
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

// ---------------------------------------------------------------------------
// RIME GROUPS — each group has >=3 pictured words that share the same rime and
// are kept CONSECUTIVE. Every rotor is the correct first letter plus a handful
// of distractor consonants (shuffled at runtime). Because the whole list is
// built group-by-group, the learner always hears at least three words on the
// same rime in a row before the rime changes.
// ---------------------------------------------------------------------------
const RIME_GROUPS: Target[][] = [
  // -at
  [
    { word: "cat", emoji: "🐱", rime: "at", first: "c", rotor: ["c", "m", "r", "f", "n"] },
    { word: "hat", emoji: "🎩", rime: "at", first: "h", rotor: ["h", "p", "f", "d", "g"] },
    { word: "bat", emoji: "🦇", rime: "at", first: "b", rotor: ["b", "g", "d", "w", "s"] },
    { word: "rat", emoji: "🐀", rime: "at", first: "r", rotor: ["r", "n", "g", "w", "p"] },
  ],
  // -en
  [
    { word: "hen", emoji: "🐔", rime: "en", first: "h", rotor: ["h", "d", "m", "w", "b"] },
    { word: "pen", emoji: "🖊️", rime: "en", first: "p", rotor: ["p", "d", "m", "w", "b"] },
    { word: "ten", emoji: "🔟", rime: "en", first: "t", rotor: ["t", "d", "m", "w", "b"] },
  ],
  // -un
  [
    { word: "sun", emoji: "☀️", rime: "un", first: "s", rotor: ["s", "f", "g", "d", "n"] },
    { word: "bun", emoji: "🍞", rime: "un", first: "b", rotor: ["b", "f", "g", "d", "n"] },
    { word: "run", emoji: "🏃", rime: "un", first: "r", rotor: ["r", "f", "g", "d", "n"] },
  ],
  // -ug
  [
    { word: "bug", emoji: "🐛", rime: "ug", first: "b", rotor: ["b", "d", "h", "t", "n"] },
    { word: "mug", emoji: "☕", rime: "ug", first: "m", rotor: ["m", "d", "h", "t", "n"] },
    { word: "jug", emoji: "🥛", rime: "ug", first: "j", rotor: ["j", "d", "h", "t", "n"] },
    { word: "rug", emoji: "🧶", rime: "ug", first: "r", rotor: ["r", "d", "h", "t", "n"] },
  ],
];

// Flattened play order: every group presented fully before the next.
const TARGETS: Target[] = RIME_GROUPS.flat();

// ---- palette ---------------------------------------------------------------
const INK = "#123a4d";
const TEAL = "#1f8bbf";
const GREEN = "#1faa5a";

// Reel geometry.
const CELL_H = 60; // height of one letter cell in the wheel
const REEL_W = 86;

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

  // Per-round wheel state.
  const [options, setOptions] = useState<string[]>([]);
  // `pos` is a CONTINUOUS position into a tripled strip of the options so the
  // reel can scroll seamlessly and always show a letter above and below the
  // centred one. The logical (mod) index is derived from it.
  const [pos, setPos] = useState(0);
  const [animate, setAnimate] = useState(false);
  const [solved, setSolved] = useState(false);

  const touchStartY = useRef<number | null>(null);

  const target = TARGETS[index];
  const N = options.length;
  const logical = N ? ((pos % N) + N) % N : 0;
  const currentFirst = N ? options[logical] : target.first;
  const currentWord = currentFirst + target.rime;

  // Build a shuffled wheel for round `i`, starting on a NON-correct letter so
  // there's always something to spin.
  function loadRound(i: number) {
    const t = TARGETS[i];
    const opts = shuffle(t.rotor);
    const correctAt = opts.indexOf(t.first);
    // Start one step away from the answer.
    let start = correctAt === 0 ? 1 : correctAt - 1;
    if (start >= opts.length) start = 0;
    setOptions(opts);
    setAnimate(false); // snap into place, no scroll on load
    setPos(opts.length + start); // sit in the MIDDLE copy of the tripled strip
    setSolved(false);
  }

  // Celebrate the moment the wheel lands on the correct first letter.
  function celebrate(i: number) {
    setSolved(true);
    dingCorrect();
    setTimeout(() => speakWord(TARGETS[i].word), 260);
  }

  function rotate(dir: 1 | -1) {
    if (solved || options.length === 0) return;
    setAnimate(true);
    const newPos = pos + dir;
    setPos(newPos);
    const nl = ((newPos % options.length) + options.length) % options.length;
    if (options[nl] === target.first) {
      celebrate(index);
    } else {
      tick();
    }
  }

  // After a spin settles, silently hop back into the middle copy so the reel
  // can keep scrolling forever without running off the ends (seamless because
  // all three copies are identical).
  function onReelSettle() {
    const n = options.length;
    if (!n) return;
    if (pos < n) {
      setAnimate(false);
      setPos(pos + n);
    } else if (pos >= 2 * n) {
      setAnimate(false);
      setPos(pos - n);
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
    // Swipe up = spin to next letter (▲), swipe down = previous (▼).
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

  // Tripled strip of option letters so neighbours are always present and the
  // reel scrolls seamlessly across the seam.
  const reelCells = N ? [...options, ...options, ...options] : [];
  // translateY that places cell `pos` in the MIDDLE row of the 3-row window.
  const stripY = CELL_H * (1 - pos);

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

          {/* The machine: spinning wheel + fixed rime tiles */}
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
            {/* wheel column: ▲ / reel window / ▼ */}
            <div
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            >
              <button
                onClick={() => rotate(1)}
                disabled={solved}
                aria-label="Spin up"
                style={arrowStyle(solved)}
              >
                ▲
              </button>

              {/* The VISIBLE spinning reel window (3 letters tall) */}
              <div
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                aria-label={`First letter wheel, showing ${currentFirst}`}
                style={{
                  position: "relative",
                  width: REEL_W,
                  height: CELL_H * 3,
                  borderRadius: 18,
                  overflow: "hidden",
                  background: solved
                    ? "linear-gradient(#fff7d6, #ffe27a)"
                    : "linear-gradient(#ffffff, #eaf6ff)",
                  border: `4px solid ${solved ? "#ffbf34" : "#ffffff"}`,
                  boxShadow: solved
                    ? "0 6px 0 #00000026, 0 0 20px 4px #ffd23f88"
                    : "0 6px 0 #00000026, inset 0 2px 6px #00000018",
                  touchAction: "none",
                  userSelect: "none",
                }}
              >
                {/* scrolling strip of letters */}
                <div
                  onTransitionEnd={onReelSettle}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    transform: `translateY(${stripY}px)`,
                    transition: animate
                      ? "transform .34s cubic-bezier(.2,.85,.25,1)"
                      : "none",
                    willChange: "transform",
                  }}
                >
                  {reelCells.map((ch, k) => {
                    const d = k - pos; // 0 = centre, -1 above, +1 below
                    const centre = d === 0;
                    return (
                      <div
                        key={k}
                        style={{
                          height: CELL_H,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: centre ? 50 : 30,
                          fontWeight: 800,
                          lineHeight: 1,
                          color: centre ? (solved ? "#8a5b00" : TEAL) : "#2a6f95",
                          opacity: centre ? 1 : Math.abs(d) === 1 ? 0.42 : 0.12,
                        }}
                      >
                        {ch}
                      </div>
                    );
                  })}
                </div>

                {/* top & bottom edge fades — that "curved wheel" feel */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: CELL_H,
                    pointerEvents: "none",
                    background: solved
                      ? "linear-gradient(#fff7d6, rgba(255,247,214,0))"
                      : "linear-gradient(#f4fbff, rgba(244,251,255,0))",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: CELL_H,
                    pointerEvents: "none",
                    background: solved
                      ? "linear-gradient(rgba(255,226,122,0), #ffe27a)"
                      : "linear-gradient(rgba(234,246,255,0), #eaf6ff)",
                  }}
                />

                {/* the centre window frame that marks the chosen letter */}
                <div
                  style={{
                    position: "absolute",
                    top: CELL_H,
                    left: 4,
                    right: 4,
                    height: CELL_H,
                    borderRadius: 12,
                    border: `3px solid ${solved ? "#ffbf34" : "#ffd23f"}`,
                    boxShadow: solved
                      ? "0 0 16px 3px #ffd23faa, inset 0 0 10px #ffd23f55"
                      : "0 0 8px 1px #ffd23f66",
                    pointerEvents: "none",
                  }}
                />
              </div>

              <button
                onClick={() => rotate(-1)}
                disabled={solved}
                aria-label="Spin down"
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
    width: REEL_W,
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
