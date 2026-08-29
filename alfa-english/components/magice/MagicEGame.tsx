"use client";

// ---------------------------------------------------------------------------
// MAGIC-e — the silent "e" that makes the middle vowel say its NAME.
// cap → cape, kit → kite, tub → tube ...  A tap of the wand slides a silent
// "e" onto a short CVC word; the middle vowel lights up blue and says its long
// name. Mobile-first, big tap targets, works at 360px wide.
// ---------------------------------------------------------------------------

import { useState, type CSSProperties } from "react";
import SpeakerIcon from "@/components/shared/SpeakerIcon";
import { say, stopSpeech, primeSpeech } from "@/lib/speech";
import { dingCorrect, chimeWin, tick, unlockSfx } from "@/lib/sfx";

interface WordInfo {
  word: string;
  emoji: string;
}
interface Pair {
  short: WordInfo;
  long: WordInfo;
}

// ~10 short-vowel → long-vowel pairs. The silent "e" is always the added final
// letter, and the middle vowel is the single vowel of the short word.
const PAIRS: Pair[] = [
  { short: { word: "cap", emoji: "🧢" }, long: { word: "cape", emoji: "🦸" } },
  { short: { word: "kit", emoji: "🧰" }, long: { word: "kite", emoji: "🪁" } },
  { short: { word: "tub", emoji: "🛁" }, long: { word: "tube", emoji: "🧪" } },
  { short: { word: "cub", emoji: "🐻" }, long: { word: "cube", emoji: "🧊" } },
  { short: { word: "pin", emoji: "📌" }, long: { word: "pine", emoji: "🌲" } },
  { short: { word: "tap", emoji: "🚰" }, long: { word: "tape", emoji: "📼" } },
  { short: { word: "man", emoji: "🧍" }, long: { word: "mane", emoji: "🦁" } },
  { short: { word: "cut", emoji: "✂️" }, long: { word: "cute", emoji: "🥰" } },
  { short: { word: "not", emoji: "🚫" }, long: { word: "note", emoji: "🎵" } },
  { short: { word: "plan", emoji: "📋" }, long: { word: "plane", emoji: "✈️" } },
  { short: { word: "hug", emoji: "🤗" }, long: { word: "huge", emoji: "🐘" } },
];

// Index of the single short-vowel in a CVC(C) word (a/e/i/o/u).
function vowelIndex(word: string): number {
  return word.split("").findIndex((c) => "aeiou".includes(c));
}

const VOWEL_NAME: Record<string, string> = {
  a: "AY",
  e: "EE",
  i: "EYE",
  o: "OH",
  u: "YOO",
};

// ---- palette ---------------------------------------------------------------
const INK = "#2a1a52";
const BLUE = "#1f8bbf";
const GREY = "#9aa3ad";
const GOLD = "#ffd23f";

// A magical night-sky purple, layered over the .app frame.
const rootStyle: CSSProperties = {
  background:
    "radial-gradient(circle at 20% 12%, #7b53c9 0, transparent 55%)," +
    "radial-gradient(circle at 82% 20%, #b06fe0 0, transparent 45%)," +
    "linear-gradient(#2a1560 0%, #5230a3 55%, #7d47c4 100%)",
};

export default function MagicEGame() {
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false); // magic-e added?
  const [eShown, setEShown] = useState(false); // drives the slide-in transition
  const [pulse, setPulse] = useState(false); // vowel pop while it says its name

  const pair = PAIRS[index];
  const shortWord = pair.short.word;
  const longWord = pair.long.word;
  const vi = vowelIndex(shortWord);
  const vowelChar = shortWord[vi];

  function resetRound() {
    setRevealed(false);
    setEShown(false);
    setPulse(false);
  }

  function startGame() {
    unlockSfx();
    primeSpeech();
    setStarted(true);
    setWon(false);
    setIndex(0);
    resetRound();
    setTimeout(() => say(PAIRS[0].short.word), 220);
  }

  function listen() {
    tick();
    say(revealed ? longWord : shortWord);
  }

  function addMagicE() {
    if (revealed) return;
    tick();
    setRevealed(true);
    dingCorrect();
    // Next frame: slide the "e" home and pop the middle vowel.
    requestAnimationFrame(() => {
      setEShown(true);
      setPulse(true);
    });
    setTimeout(() => say(longWord), 640);
    setTimeout(() => setPulse(false), 1300);
  }

  function next() {
    tick();
    stopSpeech();
    if (index + 1 >= PAIRS.length) {
      setWon(true);
      chimeWin();
      return;
    }
    const n = index + 1;
    setIndex(n);
    resetRound();
    setTimeout(() => say(PAIRS[n].short.word), 220);
  }

  function playAgain() {
    tick();
    stopSpeech();
    setWon(false);
    setIndex(0);
    resetRound();
    setTimeout(() => say(PAIRS[0].short.word), 220);
  }

  // ---- letter tile -----------------------------------------------------
  function tile(ch: string, kind: "normal" | "vowel" | "silent", key: string) {
    const isVowel = kind === "vowel";
    const isSilent = kind === "silent";
    const base: CSSProperties = {
      width: 54,
      height: 66,
      borderRadius: 16,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 40,
      fontWeight: 800,
      lineHeight: 1,
      background: "#ffffff",
      color: INK,
      boxShadow: "0 5px 0 #00000026",
      transition: "transform .25s ease, color .25s ease, box-shadow .25s ease, background .25s ease",
    };
    if (isVowel && revealed) {
      base.color = BLUE;
      base.background = "#e8f6ff";
      base.boxShadow = "0 5px 0 #00000026, 0 0 0 3px #7fd3ff, 0 0 16px 3px #7fd3ffcc";
      base.transform = pulse ? "translateY(-6px) scale(1.16)" : "scale(1.06)";
    }
    if (isSilent) {
      base.color = GREY;
      base.background = "#eef0f2";
      base.boxShadow = eShown ? "0 5px 0 #00000018" : "0 5px 0 #00000018";
      base.opacity = eShown ? 1 : 0;
      base.transform = eShown ? "translateX(0)" : "translateX(34px)";
    }
    return (
      <div key={key} style={{ position: "relative" }}>
        <div style={base}>{ch}</div>
        {isSilent && (
          <div
            style={{
              position: "absolute",
              top: -22,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 13,
              fontWeight: 800,
              color: "#fff",
              whiteSpace: "nowrap",
              opacity: eShown ? 0.95 : 0,
              transition: "opacity .3s ease .1s",
            }}
          >
            shh 🤫
          </div>
        )}
      </div>
    );
  }

  const tiles = shortWord.split("").map((ch, i) =>
    tile(ch, i === vi ? "vowel" : "normal", `l${i}`),
  );
  if (revealed) tiles.push(tile("e", "silent", "e"));

  return (
    <div className="app" style={rootStyle}>
      <a className="cornerLink" href="/" aria-label="All games">
        🏠
      </a>
      {started && !won && (
        <div className="blocksLevelPill">
          🪄 {index + 1} / {PAIRS.length}
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
            gap: 18,
            padding: "64px 14px 20px",
            minHeight: 0,
          }}
        >
          {/* picture: short emoji swaps to long emoji on reveal */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              minHeight: 118,
            }}
          >
            <PictureCard emoji={pair.short.emoji} dim={revealed} />
            {revealed && (
              <>
                <div style={{ fontSize: 34, color: "#ffffffcc", fontWeight: 800 }}>→</div>
                <PictureCard emoji={pair.long.emoji} dim={false} glow />
              </>
            )}
          </div>

          {/* the word, built from letter tiles */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              marginTop: 8,
            }}
          >
            {tiles}
          </div>

          {/* transformation caption + sparkles */}
          <div style={{ height: 30, display: "flex", alignItems: "center" }}>
            {revealed ? (
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>
                <span style={{ opacity: 0.75 }}>{shortWord}</span>
                <span style={{ margin: "0 8px", color: GOLD }}>✨→✨</span>
                <span style={{ color: "#fff" }}>
                  {longWord}
                  <span style={{ color: "#ffe9a8", fontSize: 15, marginLeft: 6 }}>
                    ({vowelChar} says {VOWEL_NAME[vowelChar] ?? vowelChar.toUpperCase()})
                  </span>
                </span>
              </div>
            ) : (
              <div style={{ fontSize: 18, fontWeight: 700, color: "#ffffffcc" }}>
                A short word… add the magic e!
              </div>
            )}
          </div>

          {/* controls */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%", maxWidth: 340 }}>
            <button className="soundBtn" onClick={listen} style={{ marginTop: 0 }}>
              <SpeakerIcon size={26} />
              Listen
            </button>

            {!revealed ? (
              <button
                onClick={addMagicE}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  border: "none",
                  borderRadius: 999,
                  padding: "16px 26px",
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#5a3b00",
                  background: "linear-gradient(#ffe27a, #ffc21f)",
                  boxShadow: "0 6px 0 #b98700, 0 0 22px 3px #ffd23f88",
                  cursor: "pointer",
                  animation: "pop .5s ease",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: "#fff",
                    color: "#7c3fe0",
                    fontSize: 24,
                    fontWeight: 800,
                    boxShadow: "0 0 12px 2px #ffffffcc",
                  }}
                >
                  e
                </span>
                Add magic e! 🪄
              </button>
            ) : (
              <button
                className="bigButton blue"
                onClick={next}
                style={{ maxWidth: 320 }}
              >
                {index + 1 >= PAIRS.length ? "Finish 🎉" : "Next →"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ---------------- Start overlay ---------------- */}
      {!started && (
        <div className="overlay">
          <div className="overlayCard" style={{ textAlign: "center" }}>
            <div className="overlayEmoji">🪄</div>
            <div className="overlayTitle">Magic e</div>
            <p style={{ margin: "4px 0 18px", fontSize: 17, fontWeight: 700, color: BLUE }}>
              Add a silent <b>e</b> and the middle vowel says its name!
              <br />
              <span style={{ color: INK }}>cap → cape</span>
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
            <div className="overlayEmoji">🎉</div>
            <div className="overlayTitle">Well done!</div>
            <p style={{ margin: "2px 0 18px", fontSize: 18, fontWeight: 700, color: BLUE }}>
              You made {PAIRS.length} magic words! 🪄✨
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

// A white rounded picture tile holding one big emoji.
function PictureCard({ emoji, dim, glow }: { emoji: string; dim?: boolean; glow?: boolean }) {
  return (
    <div
      style={{
        width: 108,
        height: 108,
        borderRadius: 26,
        background: "#fff",
        border: `5px solid ${glow ? GOLD : "#c9a6f0"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 64,
        lineHeight: 1,
        boxShadow: glow ? "0 6px 0 #00000020, 0 0 22px 4px #ffd23f88" : "0 6px 0 #00000020",
        opacity: dim ? 0.55 : 1,
        transform: dim ? "scale(0.9)" : "scale(1)",
        transition: "opacity .3s ease, transform .3s ease",
        flex: "0 0 auto",
      }}
    >
      <span aria-hidden="true">{emoji}</span>
    </div>
  );
}
