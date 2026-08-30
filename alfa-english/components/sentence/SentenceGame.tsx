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

// ---- The sentences: short, decodable, each with a little SCENE -------------
// `scene` names a small composed picture (see <Scene/> below) — a coloured
// background with ground/sky, the subject shown large and the object placed in
// the scene — rather than a lone emoji.
interface Sentence {
  scene: SceneKey;
  words: string[];
}
const SENTENCES: Sentence[] = [
  { scene: "cat_mat", words: ["The", "cat", "sat", "on", "the", "mat"] },
  { scene: "hen_bed", words: ["The", "hen", "sat", "on", "the", "bed"] },
  { scene: "ant_red", words: ["The", "ant", "is", "red"] },
  { scene: "bug_rug", words: ["The", "bug", "is", "on", "the", "rug"] },
  { scene: "sun_hot", words: ["The", "sun", "is", "hot"] },
  { scene: "fox_box", words: ["A", "fox", "is", "in", "the", "box"] },
];

// Small function words are never spoken in ISOLATION on tap — saying "The" or
// "on" alone sounds wrong. They place silently (tick only); the natural
// pronunciation comes from reading the WHOLE sentence when it is complete.
const FUNCTION_WORDS = new Set(["the", "a", "an", "on", "in", "is", "at"]);
const isFunctionWord = (w: string): boolean => FUNCTION_WORDS.has(w.toLowerCase());

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

// ---------------------------------------------------------------------------
// SCENES — each sentence gets a little composed picture instead of a lone
// emoji: a coloured sky/room background with a ground line, the subject shown
// large, and the object/place placed in the scene. Built from positioned
// emojis + simple shapes (all inline styles), so it reads as a real scene.
// ---------------------------------------------------------------------------
type SceneKey = "cat_mat" | "hen_bed" | "ant_red" | "bug_rug" | "sun_hot" | "fox_box";

// absolutely-positioned emoji with a soft drop shadow for depth
function emo(size: number, extra: React.CSSProperties): React.CSSProperties {
  return {
    position: "absolute",
    fontSize: size,
    lineHeight: 1,
    filter: "drop-shadow(0 3px 2px rgba(0,0,0,0.28))",
    userSelect: "none",
    ...extra,
  };
}

function Scene({ scene, celebrate }: { scene: SceneKey; celebrate: boolean }) {
  const wrap: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    borderRadius: 20,
  };
  // subject bobs a little when the sentence is celebrated
  const bob: React.CSSProperties = celebrate ? { animation: "sentBob 0.6s ease" } : {};
  const fill = (bg: string): React.CSSProperties => ({ position: "absolute", inset: 0, background: bg });

  switch (scene) {
    // The cat sat on the mat → a cat sitting on a striped mat on a wooden floor.
    case "cat_mat":
      return (
        <div style={wrap}>
          <div style={fill("linear-gradient(#fde7d0 0%, #fde7d0 60%, #e6bd86 60%, #d6a566 100%)")} />
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 7,
              transform: "translateX(-50%)",
              width: 98,
              height: 22,
              borderRadius: 12,
              background: "repeating-linear-gradient(90deg,#e8615f 0 10px,#f6a63f 10px 20px)",
              boxShadow: "0 3px 4px rgba(0,0,0,0.22)",
            }}
          />
          <span style={emo(50, { left: "50%", bottom: 18, transform: "translateX(-50%)", ...bob })}>🐱</span>
        </div>
      );

    // The hen sat on the bed → a hen sitting on a little bed with a pillow.
    case "hen_bed":
      return (
        <div style={wrap}>
          <div style={fill("linear-gradient(#eaf3ff 0%, #eaf3ff 58%, #d7c19a 58%, #c6ac7f 100%)")} />
          {/* headboard */}
          <div style={{ position: "absolute", left: "calc(50% - 58px)", bottom: 8, width: 11, height: 46, borderRadius: 4, background: "#a9704a" }} />
          {/* mattress */}
          <div style={{ position: "absolute", left: "50%", bottom: 8, transform: "translateX(-50%)", width: 112, height: 28, borderRadius: "8px 8px 6px 6px", background: "#fff", boxShadow: "0 3px 4px rgba(0,0,0,0.2)" }} />
          {/* blanket (right half) */}
          <div style={{ position: "absolute", left: "50%", bottom: 8, transform: "translateX(-50%)", width: 112, height: 28, borderRadius: "8px", background: "linear-gradient(#7cc4f0,#4a97d6)", clipPath: "inset(0 0 0 48%)" }} />
          {/* pillow */}
          <div style={{ position: "absolute", left: "calc(50% - 46px)", bottom: 30, width: 30, height: 13, borderRadius: 7, background: "#ffe6a0", boxShadow: "0 2px 2px rgba(0,0,0,0.15)" }} />
          <span style={emo(40, { left: "calc(50% + 6px)", bottom: 26, transform: "translateX(-50%)", ...bob })}>🐔</span>
        </div>
      );

    // The ant is red → a big ant on grass, glowing red to stress the colour.
    case "ant_red":
      return (
        <div style={wrap}>
          <div style={fill("linear-gradient(#eafcef 0%, #d5f4d8 55%, #8fd98a 100%)")} />
          {/* grass blades */}
          <div style={{ position: "absolute", left: 12, bottom: 0, width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: "20px solid #57b85f" }} />
          <div style={{ position: "absolute", right: 16, bottom: 0, width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: "26px solid #57b85f" }} />
          {/* red glow */}
          <div style={{ position: "absolute", left: "50%", top: "48%", width: 82, height: 82, transform: "translate(-50%,-50%)", borderRadius: "50%", background: "radial-gradient(circle, rgba(238,80,72,0.6), rgba(238,80,72,0) 70%)" }} />
          <span style={emo(54, { left: "50%", top: "48%", transform: "translate(-50%,-52%)", ...bob })}>🐜</span>
        </div>
      );

    // The bug is on the rug → a bug on a patterned rug on the floor.
    case "bug_rug":
      return (
        <div style={wrap}>
          <div style={fill("linear-gradient(#f3ecff 0%, #f3ecff 58%, #d9c4a0 58%, #c8ad82 100%)")} />
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 9,
              transform: "translateX(-50%)",
              width: 108,
              height: 30,
              borderRadius: 16,
              background: "repeating-linear-gradient(45deg,#f2c14e 0 8px,#e07a5f 8px 16px)",
              border: "3px solid #b23a48",
              boxShadow: "0 3px 4px rgba(0,0,0,0.2)",
            }}
          />
          <span style={emo(42, { left: "50%", bottom: 18, transform: "translateX(-50%)", ...bob })}>🐛</span>
        </div>
      );

    // The sun is hot → a bright sun high in a blue sky with clouds.
    case "sun_hot":
      return (
        <div style={wrap}>
          <div style={fill("linear-gradient(#3fa3e0 0%, #7bc5ee 60%, #bfe6ff 100%)")} />
          {/* clouds */}
          <div style={{ position: "absolute", left: 8, bottom: 16, width: 40, height: 15, borderRadius: 10, background: "#ffffffdd", boxShadow: "14px -6px 0 -2px #ffffffdd" }} />
          <div style={{ position: "absolute", right: 6, top: 14, width: 34, height: 13, borderRadius: 9, background: "#ffffffcc" }} />
          {/* heat shimmer */}
          <div style={{ position: "absolute", left: "50%", top: 8, transform: "translateX(-50%)", width: 74, height: 74, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,224,120,0.85), rgba(255,224,120,0) 70%)" }} />
          <span style={emo(52, { left: "50%", top: 12, transform: "translateX(-50%)", ...bob })}>☀️</span>
        </div>
      );

    // A fox is in the box → a fox peeking out of an open cardboard box.
    case "fox_box":
      return (
        <div style={wrap}>
          <div style={fill("linear-gradient(#eef2f7 0%, #eef2f7 60%, #cbb189 60%, #bb9d6f 100%)")} />
          {/* open flaps behind */}
          <div style={{ position: "absolute", left: "calc(50% - 40px)", bottom: 47, width: 40, height: 13, background: "#caa06a", borderRadius: 3, transform: "rotate(-20deg)", transformOrigin: "bottom right", zIndex: 0 }} />
          <div style={{ position: "absolute", left: "calc(50% + 0px)", bottom: 47, width: 40, height: 13, background: "#d9b485", borderRadius: 3, transform: "rotate(20deg)", transformOrigin: "bottom left", zIndex: 0 }} />
          {/* fox peeking (its lower half hidden behind the front panel) */}
          <span style={emo(42, { left: "50%", bottom: 26, transform: "translateX(-50%)", zIndex: 1, ...bob })}>🦊</span>
          {/* box front panel */}
          <div style={{ position: "absolute", left: "50%", bottom: 7, transform: "translateX(-50%)", width: 86, height: 44, background: "linear-gradient(#d69a5c,#b9793d)", borderRadius: "4px 4px 5px 5px", boxShadow: "0 3px 4px rgba(0,0,0,0.25)", zIndex: 2 }} />
          {/* packing tape */}
          <div style={{ position: "absolute", left: "50%", bottom: 7, transform: "translateX(-50%)", width: 16, height: 44, background: "#eccfa4cc", zIndex: 3 }} />
        </div>
      );
  }
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
      // Speak only CONTENT words (cat, sat, mat…) on tap. Function words
      // (the, a, on, in, is…) place silently — spoken alone they sound wrong;
      // they get their correct pronunciation from the whole-sentence read below.
      if (!isFunctionWord(tile.word)) speakWord(tile.word);
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
                position: "relative",
                overflow: "hidden",
                padding: 0,
                fontSize: 0,
                animation: complete ? "pop 0.5s ease" : undefined,
              }}
              onClick={replay}
              aria-label="Listen to the sentence"
            >
              <Scene scene={sentence.scene} celebrate={complete} />
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
        /* the scene's subject gives a happy hop when the sentence is finished.
           Note: transforms here compose only relative to each subject's own
           inline translate baseline, which each keyframe step restates. */
        @keyframes sentBob {
          0%,100% { translate: 0 0; }
          30% { translate: 0 -10px; }
          55% { translate: 0 0; }
          75% { translate: 0 -4px; }
        }
      `}</style>
    </div>
  );
}
