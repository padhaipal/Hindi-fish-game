"use client";

// ---------------------------------------------------------------------------
// ALfA ENGLISH — RHYME TIME
// ---------------------------------------------------------------------------
// A board of face-up picture+word cards. The child taps two cards that RHYME
// (share the same rime = vowel + ending, e.g. cat & hat share "at").
//   - correct rhyme  -> both cards lock GREEN, each word is spoken, then fade.
//   - wrong          -> buzz, both briefly redden, then deselect.
// Clear every pair -> next level (more pairs). Final level -> win overlay.
// Mobile-first, big tap targets, works at 360px wide.
// ---------------------------------------------------------------------------

import { useCallback, useRef, useState, type CSSProperties } from "react";
import SpeakerIcon from "@/components/shared/SpeakerIcon";
import { primeSpeech } from "@/lib/speech";
import { speakWord, stopAll } from "@/lib/sound";
import { dingCorrect, buzzWrong, chimeWin, unlockSfx } from "@/lib/sfx";

// ---- rhyme data ------------------------------------------------------------
// Each group is a rime (the vowel + ending). Only words with a clear,
// child-friendly emoji are listed, and every group has at least two so it can
// always contribute a rhyming PAIR to a board.
interface RhymeWord {
  word: string;
  emoji: string;
}
interface RhymeGroup {
  rime: string;
  words: RhymeWord[];
}

const GROUPS: RhymeGroup[] = [
  { rime: "at", words: [
    { word: "cat", emoji: "🐱" },
    { word: "hat", emoji: "🎩" },
    { word: "bat", emoji: "🦇" },
    { word: "rat", emoji: "🐀" },
  ] },
  { rime: "un", words: [
    { word: "sun", emoji: "☀️" },
    { word: "bun", emoji: "🍞" },
    { word: "run", emoji: "🏃" },
  ] },
  { rime: "og", words: [
    { word: "dog", emoji: "🐕" },
    { word: "log", emoji: "🪵" },
    { word: "frog", emoji: "🐸" },
  ] },
  { rime: "en", words: [
    { word: "hen", emoji: "🐔" },
    { word: "pen", emoji: "🖊️" },
    { word: "ten", emoji: "🔟" },
  ] },
  { rime: "ug", words: [
    { word: "bug", emoji: "🐛" },
    { word: "mug", emoji: "☕" },
    { word: "jug", emoji: "🥛" },
  ] },
  { rime: "ox", words: [
    { word: "box", emoji: "📦" },
    { word: "fox", emoji: "🦊" },
  ] },
  { rime: "ee", words: [
    { word: "bee", emoji: "🐝" },
    { word: "tree", emoji: "🌳" },
  ] },
  { rime: "op", words: [
    { word: "mop", emoji: "🧹" },
    { word: "top", emoji: "🌀" },
  ] },
  { rime: "ish", words: [
    { word: "fish", emoji: "🐟" },
    { word: "dish", emoji: "🍽️" },
  ] },
];

// Number of rhyming PAIRS per level (each pair = 2 cards). Last level is the
// final one -> win overlay.
//   L1 = 3 pairs (6 cards), L2 = 4 pairs (8 cards),
//   L3 = 6 pairs (12 cards) laid out 3 columns x 4 rows.
const LEVEL_PAIRS = [3, 4, 6];


// ---- palette ---------------------------------------------------------------
const INK = "#0a3d57";
const CARD_BORDER = "#7fd0f0";
const GREEN = "#37c46b";
const GREEN_BG = "#e7ffef";
const RED = "#ff5a5a";
const RED_BG = "#ffe6e6";
const SEL_BORDER = "#ffb02e";
const SEL_BG = "#fff6e2";

// A cheerful sky-and-grass ground layered over the .app frame.
const rootStyle: CSSProperties = {
  background:
    "radial-gradient(circle at 18% 10%, #fff2a8 0, transparent 42%)," +
    "linear-gradient(#aef0ff 0%, #7fd8f5 46%, #8fe6a6 100%)",
};

type Phase = "start" | "playing" | "win";
type CardState = "idle" | "selected" | "correct" | "wrong";

interface BoardCard {
  id: number;
  word: string;
  emoji: string;
  rime: string;
  state: CardState;
  gone: boolean; // faded out after a correct match
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build a level: pick `pairs` distinct rime groups, take exactly 2 words from
// each (so every card has exactly one partner on the board), then shuffle.
function buildBoard(pairs: number): BoardCard[] {
  const groups = shuffle(GROUPS).slice(0, pairs);
  let nextId = 0;
  const cards: BoardCard[] = [];
  for (const g of groups) {
    const two = shuffle(g.words).slice(0, 2);
    for (const w of two) {
      cards.push({
        id: nextId++,
        word: w.word,
        emoji: w.emoji,
        rime: g.rime,
        state: "idle",
        gone: false,
      });
    }
  }
  return shuffle(cards);
}

export default function RhymeGame() {
  const [phase, setPhase] = useState<Phase>("start");
  const [levelIdx, setLevelIdx] = useState(0);
  const [cards, setCards] = useState<BoardCard[]>([]);
  // ids of the currently selected (up to 2) cards being compared.
  const [selected, setSelected] = useState<number[]>([]);
  // The INPUT LOCK. True while a word (or a matched pair's two-word sequence) is
  // still speaking. While true, taps on other cards are ignored so a second word
  // can never start over the first one. Released only by the audio's onEnd.
  const speakingRef = useRef(false);
  // Generation counter. Every new speech action bumps this; the onEnd callback
  // captures the generation it was started with and does nothing if it no longer
  // matches (i.e. it was superseded/cancelled — e.g. the stale onEnd that a
  // browser fires when speechSynthesis.cancel() interrupts an old utterance).
  const seqRef = useRef(0);
  // Any pending speech timers (e.g. the delayed 2nd word of a matched pair).
  // Kept so we can CANCEL leftover/queued speech before starting a new one.
  const speechTimers = useRef<number[]>([]);

  const totalLevels = LEVEL_PAIRS.length;
  const isLastLevel = levelIdx >= totalLevels - 1;

  // Cancel every queued speech timer (does not touch audio already playing).
  const clearSpeechTimers = useCallback(() => {
    speechTimers.current.forEach((t) => window.clearTimeout(t));
    speechTimers.current = [];
  }, []);

  // Open a fresh speech action: bump the generation FIRST (so any stale onEnd a
  // cancel might fire is rejected), drop pending timers, then hard-stop audio.
  // Returns the generation to hand to the onEnd guard.
  const beginSpeech = useCallback(() => {
    seqRef.current += 1;
    const my = seqRef.current;
    clearSpeechTimers();
    stopAll();
    return my;
  }, [clearSpeechTimers]);

  const setCardStates = useCallback(
    (ids: number[], patch: Partial<BoardCard>) => {
      setCards((prev) =>
        prev.map((c) => (ids.includes(c.id) ? { ...c, ...patch } : c)),
      );
    },
    [],
  );

  const startLevel = useCallback(
    (idx: number) => {
      // Invalidate any in-flight speech callbacks and release the lock.
      clearSpeechTimers();
      seqRef.current += 1;
      speakingRef.current = false;
      setLevelIdx(idx);
      setCards(buildBoard(LEVEL_PAIRS[idx]));
      setSelected([]);
      setPhase("playing");
    },
    [clearSpeechTimers],
  );

  const beginGame = useCallback(() => {
    unlockSfx();
    primeSpeech();
    startLevel(0);
  }, [startLevel]);

  const handleTap = useCallback(
    (id: number) => {
      if (phase !== "playing") return;
      // LOCK: ignore every tap while a word / pair sequence is still speaking.
      if (speakingRef.current) return;
      const card = cards.find((c) => c.id === id);
      if (!card || card.gone || card.state === "correct") return;
      if (selected.includes(id)) return;

      // ---- First selection: speak the one word, unlock when it finishes -----
      if (selected.length === 0) {
        setSelected([id]);
        setCardStates([id], { state: "selected" });
        speakingRef.current = true;
        const my = beginSpeech();
        speakWord(card.word, () => {
          if (seqRef.current !== my) return; // superseded -> ignore
          speakingRef.current = false;
        });
        return;
      }

      // ---- Second selection -> compare (locked for the whole outcome) -------
      const firstId = selected[0];
      const first = cards.find((c) => c.id === firstId)!;
      const pair = [firstId, id];
      setSelected(pair);
      setCardStates([id], { state: "selected" });
      speakingRef.current = true; // stays locked until the sequence's last onEnd

      const isRhyme = first.rime === card.rime;

      if (isRhyme) {
        setCardStates(pair, { state: "correct" });
        dingCorrect();
        // Speak ONLY the just-tapped word (the first card already spoke its own
        // word when it was tapped), then finalise the match & unlock. This is
        // why the first word is never replayed on the second tap.
        const my = beginSpeech();
        speakWord(card.word, () => {
          if (seqRef.current !== my) return;
          setCardStates(pair, { gone: true });
          setSelected([]);
          speakingRef.current = false;
          // Level complete?
          setCards((prev) => {
            const remaining = prev.filter((c) => !c.gone).length;
            if (remaining === 0) {
              const done = window.setTimeout(() => {
                if (isLastLevel) {
                  chimeWin();
                  setPhase("win");
                } else {
                  startLevel(levelIdx + 1);
                }
              }, 500);
              speechTimers.current.push(done);
            }
            return prev;
          });
        });
      } else {
        // Wrong: show both red + buzz, still let the second word play, unlock.
        setCardStates(pair, { state: "wrong" });
        buzzWrong();
        const my = beginSpeech();
        speakWord(card.word, () => {
          if (seqRef.current !== my) return;
          setCardStates(pair, { state: "idle" });
          setSelected([]);
          speakingRef.current = false;
        });
      }
    },
    [phase, cards, selected, setCardStates, isLastLevel, levelIdx, startLevel, beginSpeech],
  );

  // Card grid layout:
  //   6 cards  (L1) -> 3 cols x 2 rows
  //   8 cards  (L2) -> 4 cols x 2 rows
  //  12 cards  (L3) -> 3 cols x 4 rows
  const cols = cards.length === 8 ? 4 : 3;
  // Shrink cards a touch on the tall 12-card board so all 4 rows fit.
  const cardW = cols === 4 ? 78 : cards.length >= 12 ? 84 : 100;
  const cardH = Math.round(cardW * 1.28);

  return (
    <div className="app" style={rootStyle}>
      <a className="cornerLink" href="/" aria-label="All games">
        🏠
      </a>
      {phase !== "start" && (
        <div className="blocksLevelPill">
          🎵 Level {levelIdx + 1}/{totalLevels}
        </div>
      )}

      {/* ---------------- Play area ---------------- */}
      {phase !== "start" && (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            padding: "64px 14px 22px",
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 20,
              fontWeight: 800,
              color: INK,
              textAlign: "center",
              textShadow: "0 1px 0 #ffffff88",
            }}
          >
            <SpeakerIcon size={22} />
            Tap two words that rhyme! 🎵
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, ${cardW}px)`,
              gap: 12,
              justifyContent: "center",
            }}
          >
            {cards.map((c) => (
              <RhymeCardBtn
                key={c.id}
                card={c}
                w={cardW}
                h={cardH}
                onTap={handleTap}
              />
            ))}
          </div>
        </div>
      )}

      {/* ---------------- Start overlay ---------------- */}
      {phase === "start" && (
        <div className="overlay">
          <div className="overlayCard" style={{ textAlign: "center" }}>
            <div className="overlayEmoji">🎵</div>
            <div className="overlayTitle">Rhyme Time</div>
            <p
              style={{
                margin: "4px 0 18px",
                fontSize: 17,
                fontWeight: 700,
                color: "#1f8bbf",
              }}
            >
              Tap two words that <b>rhyme</b>!
              <br />
              <span style={{ color: INK }}>cat 🐱 &nbsp;+&nbsp; hat 🎩</span>
            </p>
            <button type="button" className="bigButton" onClick={beginGame}>
              ▶ Play
            </button>
          </div>
        </div>
      )}

      {/* ---------------- Win overlay ---------------- */}
      {phase === "win" && (
        <div className="overlay">
          <div className="overlayCard" style={{ textAlign: "center" }}>
            <div className="overlayEmoji">🏆</div>
            <div className="overlayTitle">Well done!</div>
            <p
              style={{
                margin: "2px 0 18px",
                fontSize: 18,
                fontWeight: 700,
                color: "#1f8bbf",
              }}
            >
              You matched all the rhymes! 🎵✨
            </p>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                unlockSfx();
                stopAll();
                startLevel(0);
              }}
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

// ---- a single face-up card -------------------------------------------------
function RhymeCardBtn({
  card,
  w,
  h,
  onTap,
}: {
  card: BoardCard;
  w: number;
  h: number;
  onTap: (id: number) => void;
}) {
  const { state, gone } = card;
  const isCorrect = state === "correct";
  const isWrong = state === "wrong";
  const isSelected = state === "selected";

  const border = isCorrect
    ? GREEN
    : isWrong
      ? RED
      : isSelected
        ? SEL_BORDER
        : CARD_BORDER;
  const bg = isCorrect
    ? GREEN_BG
    : isWrong
      ? RED_BG
      : isSelected
        ? SEL_BG
        : "#ffffff";

  const style: CSSProperties = {
    width: w,
    height: h,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: "8px 6px",
    borderRadius: 20,
    background: bg,
    border: `5px solid ${border}`,
    boxShadow: isCorrect
      ? "0 5px 0 #00000018, 0 0 18px 3px #37c46b66"
      : isSelected
        ? "0 5px 0 #00000018, 0 0 14px 2px #ffb02e77"
        : "0 5px 0 #00000018",
    cursor: gone || isCorrect ? "default" : "pointer",
    transition:
      "background .2s ease, border-color .2s ease, box-shadow .2s ease, opacity .5s ease, transform .5s ease",
    opacity: gone ? 0 : 1,
    transform: gone
      ? "scale(0.55)"
      : isSelected
        ? "translateY(-3px) scale(1.04)"
        : "scale(1)",
    pointerEvents: gone ? "none" : undefined,
    animation: isWrong ? "shake .5s ease" : undefined,
    WebkitTapHighlightColor: "transparent",
    boxSizing: "border-box",
  };

  return (
    <button
      type="button"
      onClick={() => onTap(card.id)}
      disabled={gone || isCorrect}
      style={style}
      aria-label={card.word}
    >
      <span aria-hidden="true" style={{ fontSize: Math.round(w * 0.5), lineHeight: 1 }}>
        {card.emoji}
      </span>
      <span
        style={{
          fontSize: Math.round(w * 0.26),
          fontWeight: 800,
          color: isCorrect ? "#1f7a3f" : INK,
          lineHeight: 1,
        }}
      >
        {card.word}
      </span>
      <span aria-hidden="true" style={{ height: 16, fontSize: 14, lineHeight: 1 }}>
        {isCorrect ? "✅" : ""}
      </span>
    </button>
  );
}
