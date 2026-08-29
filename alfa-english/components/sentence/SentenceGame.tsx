"use client";

// ---------------------------------------------------------------------------
// ALfA ENGLISH — SENTENCE BUILDER
// ---------------------------------------------------------------------------
// A scene (one or two emojis) sits at the top above a row of empty word-SLOTS,
// one slot per word of the sentence. The sentence's words are jumbled into a
// tray of tappable tiles at the bottom. The child taps the words IN ORDER:
//   - the correct NEXT word flies into the next slot (green), it is spoken and
//     a soft tick plays.
//   - a wrong word buzzes and shakes in place; nothing is placed.
// When every slot is filled, the whole sentence is spoken, a "ding" plays and
// the scene celebrates, then a "Next →" button loads the next sentence.
// Finishing the last sentence shows the win overlay with a happy chime.
//
// Words may repeat (e.g. "the"): each tray tile is its OWN instance with a
// unique id, so duplicates are tracked and placed independently.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { speakWord, stopAll } from "@/lib/sound";
import { primeSpeech } from "@/lib/speech";
import { dingCorrect, buzzWrong, chimeWin, tick, unlockSfx } from "@/lib/sfx";
import SpeakerIcon from "@/components/shared/SpeakerIcon";

// ---- The sentences: short, decodable, with a scene emoji ------------------
interface Sentence {
  emoji: string;
  words: string[];
}
const SENTENCES: Sentence[] = [
  { emoji: "🐱", words: ["The", "cat", "sat", "on", "the", "mat"] },
  { emoji: "🐔🛏️", words: ["The", "hen", "sat", "on", "the", "bed"] },
  { emoji: "🐷", words: ["The", "pig", "is", "big"] },
  { emoji: "🐛", words: ["The", "bug", "is", "on", "the", "rug"] },
  { emoji: "☀️", words: ["The", "sun", "is", "hot"] },
  { emoji: "🦊📦", words: ["A", "fox", "is", "in", "the", "box"] },
];

// One tappable word: a unique instance so duplicate words (e.g. "the") are
// tracked independently.
interface Tile {
  id: number;
  word: string;
}

// Fisher–Yates shuffle (returns a new array).
function shuffle<T>(input: T[]): T[] {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// A jumbled tray of tiles for a sentence. Each word becomes its own instance,
// then the tiles are shuffled (retry so the tray rarely starts fully solved).
function buildTray(words: string[]): Tile[] {
  const tiles = words.map((word, i) => ({ id: i, word }));
  let out = shuffle(tiles);
  if (words.length > 1) {
    let guard = 0;
    while (out.every((t, i) => t.word === words[i]) && guard++ < 8) {
      out = shuffle(tiles);
    }
  }
  return out;
}

type Phase = "start" | "playing" | "won";

// ---- inline style helpers (this game owns its own layout) -----------------
const S = {
  app: {
    position: "relative",
    height: "100dvh",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(#c6f6d5 0%, #8be6a8 45%, #46c97e 100%)",
    overflow: "hidden",
  },
  top: {
    flex: "0 0 auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: "58px 16px 8px",
  },
  scene: {
    width: 150,
    height: 118,
    border: "5px solid #ffd23f",
    borderRadius: 26,
    background: "#fff",
    boxShadow: "0 6px 0 #00000020",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "0 10px",
    cursor: "pointer",
    fontSize: 72,
    lineHeight: 1,
  },
  slotsWrap: {
    flex: "1 1 auto",
    display: "flex",
    flexWrap: "wrap",
    alignContent: "center",
    justifyContent: "center",
    gap: 8,
    padding: "8px 14px",
    minHeight: 0,
    overflowY: "auto",
  },
  trayWrap: {
    flex: "0 0 auto",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    padding: "12px 14px 26px",
    background: "#ffffff33",
    borderTop: "3px solid #ffffff66",
  },
} as const;

// A word chip (slot or tray tile) — shared sizing.
function chipBase(): React.CSSProperties {
  return {
    minWidth: 54,
    height: 52,
    padding: "0 16px",
    borderRadius: 14,
    fontSize: 24,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1,
    boxSizing: "border-box",
  };
}

export default function SentenceGame() {
  const [phase, setPhase] = useState<Phase>("start");
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [tray, setTray] = useState<Tile[]>([]);
  const [placedIds, setPlacedIds] = useState<number[]>([]); // tile ids, in order
  const [wrongId, setWrongId] = useState<number | null>(null); // tile to shake
  const [complete, setComplete] = useState(false); // sentence finished + celebrating

  const busyRef = useRef(false); // lock taps while resolving
  const timers = useRef<number[]>([]);

  const sentence = SENTENCES[sentenceIdx];
  const isLast = sentenceIdx >= SENTENCES.length - 1;

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const later = useCallback((fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
  }, []);
  useEffect(() => () => clearTimers(), []);
  useEffect(() => stopAll, []); // stop speech/audio on unmount

  // ---- load a sentence -----------------------------------------------------
  const loadSentence = useCallback(
    (idx: number) => {
      const s = SENTENCES[idx];
      setSentenceIdx(idx);
      setTray(buildTray(s.words));
      setPlacedIds([]);
      setWrongId(null);
      setComplete(false);
      busyRef.current = false;
      later(() => speakWord(s.words.join(" ")), 400);
    },
    [later]
  );

  const startGame = useCallback(() => {
    clearTimers();
    setPhase("playing");
    loadSentence(0);
  }, [loadSentence]);

  // ---- replay the whole sentence when the scene / Listen is tapped ---------
  const replay = useCallback(() => {
    if (!sentence) return;
    speakWord(sentence.words.join(" "));
  }, [sentence]);

  // ---- a tray tile was tapped ---------------------------------------------
  const onTileTap = useCallback(
    (tile: Tile) => {
      if (phase !== "playing" || busyRef.current || complete) return;
      if (placedIds.includes(tile.id)) return; // already placed
      const nextSlot = placedIds.length;
      const expected = sentence.words[nextSlot];

      if (tile.word !== expected) {
        // Wrong word: buzz + shake this tile, nothing is placed.
        buzzWrong();
        setWrongId(tile.id);
        later(() => setWrongId((w) => (w === tile.id ? null : w)), 480);
        return;
      }

      // Correct next word: it flies into the slot.
      const placed = [...placedIds, tile.id];
      setPlacedIds(placed);
      speakWord(tile.word);
      tick();

      if (placed.length < sentence.words.length) return;

      // Sentence complete → speak the whole thing, ding, celebrate.
      busyRef.current = true;
      later(() => {
        speakWord(sentence.words.join(" "));
        dingCorrect();
        setComplete(true);
        busyRef.current = false;
      }, 320);
    },
    [phase, complete, placedIds, sentence, later]
  );

  // ---- advance to the next sentence (or the win overlay) -------------------
  const onNext = useCallback(() => {
    if (isLast) {
      stopAll();
      setPhase("won");
      chimeWin();
      return;
    }
    stopAll();
    loadSentence(sentenceIdx + 1);
  }, [isLast, sentenceIdx, loadSentence]);

  // Map placed tile ids back to their words for rendering the slots.
  const wordById = (id: number): string => tray.find((t) => t.id === id)?.word ?? "";

  return (
    <div style={S.app as React.CSSProperties}>
      <a className="cornerLink" href="/" aria-label="Home">
        ←
      </a>

      {phase !== "start" && (
        <div className="blocksLevelPill">
          Sentence {Math.min(sentenceIdx + 1, SENTENCES.length)}/{SENTENCES.length}
        </div>
      )}

      {phase === "playing" && sentence && (
        <>
          {/* ---- Scene + Listen (tap to hear the whole sentence) ---- */}
          <div style={S.top as React.CSSProperties}>
            <button
              type="button"
              style={{
                ...(S.scene as React.CSSProperties),
                animation: complete ? "pop 0.5s ease" : undefined,
              }}
              onClick={replay}
              aria-label="Listen to the sentence"
            >
              {sentence.emoji}
            </button>
            <button
              type="button"
              className="soundBtn soundBtn--compact"
              onClick={replay}
              aria-label="Listen"
            >
              <SpeakerIcon size={22} /> Listen
            </button>
          </div>

          {/* ---- The sentence slots (fill left→right) ---- */}
          <div style={S.slotsWrap as React.CSSProperties}>
            {sentence.words.map((w, i) => {
              const filledId = placedIds[i];
              const isFilled = filledId !== undefined;
              const isNext = i === placedIds.length && !complete;
              const showStop = i === sentence.words.length - 1;
              return (
                <span
                  key={i}
                  style={{
                    ...chipBase(),
                    background: isFilled ? "linear-gradient(#37d67a,#1faa5a)" : "#ffffff55",
                    color: isFilled ? "#fff" : "transparent",
                    border: isFilled
                      ? "none"
                      : isNext
                        ? "3px dashed #1faa5a"
                        : "3px dashed #ffffffaa",
                    boxShadow: isFilled ? "0 4px 0 #14773f" : "none",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {isFilled ? (
                    <>
                      {wordById(filledId)}
                      {showStop ? "." : ""}
                    </>
                  ) : (
                    "•"
                  )}
                </span>
              );
            })}
          </div>

          {/* ---- The word tray (tap in order) ---- */}
          <div style={S.trayWrap as React.CSSProperties}>
            {tray.map((tile) => {
              const used = placedIds.includes(tile.id);
              const shaking = wrongId === tile.id;
              return (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => onTileTap(tile)}
                  disabled={used || complete}
                  aria-label={`word ${tile.word}`}
                  style={{
                    ...chipBase(),
                    cursor: used ? "default" : "pointer",
                    color: "#0a3d57",
                    background: used ? "#ffffff2e" : "#fff",
                    border: "none",
                    boxShadow: used ? "none" : "0 5px 0 #00000022",
                    opacity: used ? 0 : 1,
                    pointerEvents: used ? "none" : "auto",
                    transform: used ? "scale(0.6)" : undefined,
                    transition: "opacity 0.2s, transform 0.2s",
                    animation: shaking ? "sentShake 0.42s ease" : undefined,
                  }}
                >
                  {tile.word}
                </button>
              );
            })}
          </div>

          {/* ---- Celebration banner + Next ---- */}
          {complete && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                padding: "18px 16px 26px",
                background: "linear-gradient(#ffffff00, #14773f22 40%, #14773f55)",
              }}
            >
              <div style={{ fontSize: 40, animation: "pop 0.5s ease" }}>🎉 ⭐ 🎉</div>
              <button
                type="button"
                className="bigButton"
                style={{ maxWidth: 320 }}
                onClick={onNext}
              >
                {isLast ? "🏆 Finish" : "Next →"}
              </button>
            </div>
          )}
        </>
      )}

      {/* ---- Start overlay ---- */}
      {phase === "start" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">📖</div>
            <div className="overlayTitle">Build a Sentence</div>
            <p style={{ fontSize: 18, color: "#0a3d57", margin: "4px 0 18px" }}>
              Tap the words in order to make the sentence!
            </p>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                unlockSfx();
                primeSpeech();
                startGame();
              }}
            >
              ▶ Play
            </button>
          </div>
        </div>
      )}

      {/* ---- Win overlay ---- */}
      {phase === "won" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🏆</div>
            <div className="overlayTitle">Well done!</div>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                unlockSfx();
                primeSpeech();
                startGame();
              }}
            >
              ▶ Play again
            </button>
            <a className="bigButton" href="/" style={{ marginTop: 12 }}>
              🏠 All games
            </a>
          </div>
        </div>
      )}

      {/* This game's own keyframes (scoped; no shared CSS touched). */}
      <style>{`
        @keyframes sentShake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-7px) rotate(-4deg); }
          40% { transform: translateX(7px) rotate(4deg); }
          60% { transform: translateX(-5px) rotate(-3deg); }
          80% { transform: translateX(5px) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}
