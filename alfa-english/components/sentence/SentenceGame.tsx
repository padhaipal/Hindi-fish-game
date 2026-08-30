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
import { speakWord, playLose, stopAll } from "@/lib/sound";
import { primeSpeech } from "@/lib/speech";
import { dingCorrect, buzzWrong, chimeWin, tick, unlockSfx } from "@/lib/sfx";
import SpeakerIcon from "@/components/shared/SpeakerIcon";

// ---- The sentences: short, decodable, each with a little SCENE -------------
// Each sentence carries one or two key emoji — a `subject` (shown large and
// centred) and an optional `object` (a place/thing placed in the scene). The
// generic <Scene/> composer below turns those into a pleasant little picture
// (sky gradient + ground band) so all ~50 read as scenes, not lone emoji.
// An optional `glow` is a soft accent colour behind the subject, used to stress
// a colour/heat word (e.g. "red", "hot").
interface Sentence {
  words: string[];
  subject: string;
  object?: string;
  glow?: string;
}

// A big bank so plays rarely repeat. Each game shuffles this pool and steps
// through a SUBSET (see PLAY_COUNT) — the child wins after that many, not all.
const SENTENCES: Sentence[] = [
  { words: ["The", "cat", "sat", "on", "the", "mat"], subject: "🐱" },
  { words: ["A", "fox", "is", "in", "the", "box"], subject: "🦊", object: "📦" },
  { words: ["The", "dog", "ran", "to", "the", "log"], subject: "🐕", object: "🪵" },
  { words: ["The", "hen", "is", "on", "the", "bed"], subject: "🐔", object: "🛏️" },
  { words: ["The", "sun", "is", "hot"], subject: "☀️", glow: "#ffd54a" },
  { words: ["The", "bug", "is", "on", "the", "rug"], subject: "🐛" },
  { words: ["The", "bee", "is", "on", "the", "tree"], subject: "🐝", object: "🌳" },
  { words: ["The", "cat", "is", "fat"], subject: "🐱" },
  { words: ["The", "man", "has", "a", "van"], subject: "🧍", object: "🚐" },
  { words: ["A", "rat", "sat", "on", "a", "mat"], subject: "🐀" },
  { words: ["The", "cup", "is", "red"], subject: "☕", glow: "#ee5048" },
  { words: ["The", "bus", "is", "big"], subject: "🚌" },
  { words: ["The", "net", "is", "wet"], subject: "🥅" },
  { words: ["The", "pot", "is", "hot"], subject: "🍲", glow: "#ffb84a" },
  { words: ["The", "frog", "is", "on", "a", "log"], subject: "🐸", object: "🪵" },
  { words: ["The", "duck", "is", "in", "the", "mud"], subject: "🦆" },
  { words: ["The", "king", "has", "a", "ring"], subject: "🤴", object: "💍" },
  { words: ["The", "owl", "is", "in", "the", "tree"], subject: "🦉", object: "🌳" },
  { words: ["The", "ant", "is", "red"], subject: "🐜", glow: "#ee5048" },
  { words: ["A", "hat", "is", "on", "the", "cat"], subject: "🐱", object: "🎩" },
  { words: ["The", "fish", "is", "in", "the", "net"], subject: "🐟", object: "🥅" },
  { words: ["The", "mug", "is", "on", "the", "rug"], subject: "☕" },
  { words: ["The", "star", "is", "up"], subject: "⭐" },
  { words: ["The", "dog", "has", "a", "bone"], subject: "🐕", object: "🦴" },
  { words: ["The", "cat", "has", "a", "hat"], subject: "🐱", object: "🎩" },
  { words: ["The", "bird", "is", "in", "the", "nest"], subject: "🐦", object: "🪺" },
  { words: ["The", "fish", "is", "big"], subject: "🐟" },
  { words: ["The", "bee", "can", "buzz"], subject: "🐝" },
  { words: ["The", "dog", "can", "run"], subject: "🐕" },
  { words: ["The", "cat", "can", "nap"], subject: "🐱" },
  { words: ["The", "sun", "is", "up"], subject: "☀️" },
  { words: ["The", "moon", "is", "up"], subject: "🌙" },
  { words: ["The", "bat", "is", "in", "the", "cave"], subject: "🦇" },
  { words: ["The", "crab", "is", "in", "the", "sand"], subject: "🦀", object: "🏖️" },
  { words: ["The", "bug", "is", "big"], subject: "🐛" },
  { words: ["The", "van", "is", "red"], subject: "🚐", glow: "#ee5048" },
  { words: ["The", "bed", "is", "soft"], subject: "🛏️" },
  { words: ["The", "hen", "has", "an", "egg"], subject: "🐔", object: "🥚" },
  { words: ["The", "cow", "is", "in", "the", "barn"], subject: "🐄", object: "🌾" },
  { words: ["The", "duck", "can", "swim"], subject: "🦆" },
  { words: ["The", "fox", "has", "a", "den"], subject: "🦊" },
  { words: ["A", "bug", "is", "on", "the", "bud"], subject: "🐛", object: "🌷" },
  { words: ["The", "cat", "sat", "in", "the", "sun"], subject: "🐱", object: "☀️" },
  { words: ["The", "dog", "sat", "on", "the", "rug"], subject: "🐕" },
  { words: ["The", "ant", "ran", "to", "the", "jam"], subject: "🐜", object: "🍯" },
  { words: ["The", "bee", "sat", "on", "the", "bud"], subject: "🐝", object: "🌷" },
  { words: ["The", "fish", "is", "wet"], subject: "🐟" },
  { words: ["The", "cat", "and", "the", "dog"], subject: "🐱", object: "🐕" },
  { words: ["The", "hen", "ran", "to", "the", "hut"], subject: "🐔", object: "🛖" },
  { words: ["The", "rat", "hid", "in", "the", "bin"], subject: "🐀", object: "🗑️" },
];

// How many sentences are played per game (a shuffled subset of the pool).
const PLAY_COUNT = 9;

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
// SCENE — a single GENERIC composer used by every sentence. It paints a soft
// sky gradient with a grassy ground band, places the SUBJECT emoji large and
// centred (sitting on the ground), and — when the sentence has one — an OBJECT
// emoji beside it. An optional `glow` adds a soft coloured halo behind the
// subject to stress a colour/heat word. So all ~50 sentences read as little
// scenes, not lone emoji, from one small piece of code.
// ---------------------------------------------------------------------------

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

function Scene({
  subject,
  object,
  glow,
  celebrate,
}: {
  subject: string;
  object?: string;
  glow?: string;
  celebrate: boolean;
}) {
  const wrap: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    borderRadius: 20,
  };
  // subject bobs a little when the sentence is celebrated
  const bob: React.CSSProperties = celebrate ? { animation: "sentBob 0.6s ease" } : {};
  const hasObj = Boolean(object);

  return (
    <div style={wrap}>
      {/* sky */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(#bfe6ff 0%, #dbf1ff 44%, #eaf7e6 62%)",
        }}
      />
      {/* a soft cloud puff up in the sky */}
      <div
        style={{
          position: "absolute",
          left: 12,
          top: 14,
          width: 30,
          height: 11,
          borderRadius: 8,
          background: "#ffffffcc",
          boxShadow: "12px 5px 0 -2px #ffffffcc",
        }}
      />
      {/* grassy ground band */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "38%",
          background: "linear-gradient(#8fd98a, #5cc06f)",
        }}
      />
      {/* soft coloured halo to stress a colour/heat word */}
      {glow && (
        <div
          style={{
            position: "absolute",
            left: hasObj ? "40%" : "50%",
            bottom: 26,
            width: 88,
            height: 88,
            transform: "translate(-50%, 50%)",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${glow}cc, ${glow}00 70%)`,
          }}
        />
      )}
      {/* subject — large, centred, sitting on the ground (shifts left if paired) */}
      <span style={emo(52, { left: hasObj ? "40%" : "50%", bottom: 20, transform: "translateX(-50%)", ...bob })}>
        {subject}
      </span>
      {/* object/place — smaller, set beside the subject */}
      {hasObj && (
        <span style={emo(34, { left: "70%", bottom: 15, transform: "translateX(-50%)" })}>{object}</span>
      )}
    </div>
  );
}

export default function SentenceGame() {
  const [phase, setPhase] = useState<Phase>("start");
  // The order the sentences are played in — shuffled at the start of each game
  // so a second play differs from the first.
  const [order, setOrder] = useState<Sentence[]>(SENTENCES);
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [tray, setTray] = useState<Tile[]>([]);
  const [placedIds, setPlacedIds] = useState<number[]>([]); // tile ids, in order
  const [wrongId, setWrongId] = useState<number | null>(null); // tile to shake
  const [complete, setComplete] = useState(false); // sentence finished + celebrating
  const [lost, setLost] = useState(false); // 3 wrong taps → game lost

  const busyRef = useRef(false); // lock taps while resolving
  const wrongRef = useRef(0); // total wrong taps across the whole game
  const timers = useRef<number[]>([]);

  const sentence = order[sentenceIdx];
  const isLast = sentenceIdx >= order.length - 1;

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
    (idx: number, ord: Sentence[]) => {
      const s = ord[idx];
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
    // Shuffle the whole pool and take a SUBSET for this game (so repeats are
    // rare across plays), reset the wrong-tap counter and the lose state, then
    // play from the (new) first sentence.
    const newOrder = shuffle(SENTENCES).slice(0, PLAY_COUNT);
    setOrder(newOrder);
    wrongRef.current = 0;
    setLost(false);
    setPhase("playing");
    loadSentence(0, newOrder);
  }, [loadSentence]);

  // ---- replay the whole sentence when the scene / Listen is tapped ---------
  const replay = useCallback(() => {
    if (!sentence) return;
    speakWord(sentence.words.join(" "));
  }, [sentence]);

  // ---- a tray tile was tapped ---------------------------------------------
  const onTileTap = useCallback(
    (tile: Tile) => {
      if (phase !== "playing" || busyRef.current || complete || lost) return;
      if (placedIds.includes(tile.id)) return; // already placed
      const nextSlot = placedIds.length;
      const expected = sentence.words[nextSlot];

      if (tile.word !== expected) {
        // Wrong word. Count it against the whole-game total; the 3rd wrong tap
        // loses the game. Earlier wrong taps just buzz + shake in place.
        wrongRef.current += 1;
        if (wrongRef.current >= 3) {
          stopAll();
          playLose();
          setLost(true);
          return;
        }
        buzzWrong();
        setWrongId(tile.id);
        later(() => setWrongId((w) => (w === tile.id ? null : w)), 480);
        return;
      }

      // Correct next word: it flies into the slot.
      const placed = [...placedIds, tile.id];
      setPlacedIds(placed);
      // Speak EVERY word on tap — content words and function words (the, a,
      // on, in, is…) alike — so each tap that lands a word plays that word's
      // audio. The whole sentence is still read aloud on completion below.
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
    [phase, complete, lost, placedIds, sentence, later]
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
    loadSentence(sentenceIdx + 1, order);
  }, [isLast, sentenceIdx, order, loadSentence]);

  // Map placed tile ids back to their words for rendering the slots.
  const wordById = (id: number): string => tray.find((t) => t.id === id)?.word ?? "";

  return (
    <div style={S.app as React.CSSProperties}>
      <a className="cornerLink" href="/" aria-label="Home">
        ←
      </a>

      {phase !== "start" && (
        <div className="blocksLevelPill">
          Sentence {Math.min(sentenceIdx + 1, order.length)}/{order.length}
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
              <Scene
                subject={sentence.subject}
                object={sentence.object}
                glow={sentence.glow}
                celebrate={complete}
              />
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
                stopAll();
                unlockSfx();
                primeSpeech();
                startGame();
              }}
            >
              ▶ Play again
            </button>
            <a
              className="bigButton"
              href="/"
              style={{ marginTop: 12 }}
              onClick={() => stopAll()}
            >
              🏠 All games
            </a>
          </div>
        </div>
      )}

      {/* ---- Lose overlay (3 wrong taps) ---- */}
      {lost && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">😅</div>
            <div className="overlayTitle">Try again</div>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                stopAll();
                unlockSfx();
                primeSpeech();
                startGame();
              }}
            >
              ▶ Try again
            </button>
            <a
              className="bigButton"
              href="/"
              style={{ marginTop: 12 }}
              onClick={() => stopAll()}
            >
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
