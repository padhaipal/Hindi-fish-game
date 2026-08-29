"use client";

// ---------------------------------------------------------------------------
// ALfA ENGLISH — MEMORY GAME
// ---------------------------------------------------------------------------
// Match each PICTURE card to its LETTER card. Tap a card -> it flips and the
// picture-word is spoken (both the picture AND the letter card say the WORD,
// e.g. "apple" — never a bare letter, since text-to-speech mangles phonemes).
// Two cards a turn:
//   - match  -> ding + flash green, the pair fades away.
//   - no match -> buzz + both flip back after a beat.
// A moves bar at the top gives cols*rows moves. Clear every level -> win.
// Levels grow (3x2 -> 4x3 -> 4x4) and change background colour.
// ---------------------------------------------------------------------------

import { useCallback, useRef, useState } from "react";
import Card, { MemCard } from "./Card";
import { getLetter } from "@/lib/letters";
import { say, stopSpeech, primeSpeech } from "@/lib/speech";
import { dingCorrect, buzzWrong, chimeWin, unlockSfx } from "@/lib/sfx";

// Only letters with a CLEAR, child-friendly emoji picture are used, so tapping
// a picture card is never ambiguous. Ten of them — enough for the 4x4 board
// (8 pairs) with a couple to spare so each round is freshly shuffled.
const MEMORY_LETTER_IDS = ["a", "b", "c", "d", "g", "l", "o", "r", "s", "z"];

interface MemoryLevel {
  cols: number;
  rows: number;
  bg: string;
}

const MEMORY_LEVELS: MemoryLevel[] = [
  { cols: 3, rows: 2, bg: "linear-gradient(#e8ffe9 0%, #b8f0c0 55%, #8fe0a0 100%)" },
  { cols: 4, rows: 3, bg: "linear-gradient(#f1e9ff 0%, #d6c2ff 55%, #b79bf0 100%)" },
  { cols: 4, rows: 4, bg: "linear-gradient(#fff0db 0%, #ffd9a8 55%, #ffc078 100%)" },
];

const CARD_W = 78;
const CARD_H = 96;
const GAP = 10;

type Phase = "start" | "playing" | "win";

interface Flash {
  ids: number[];
  color: "green" | "red";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MemoryGame() {
  const [phase, setPhase] = useState<Phase>("start");
  const [levelIdx, setLevelIdx] = useState(0);
  const [cards, setCards] = useState<MemCard[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matchedIds, setMatchedIds] = useState<Set<number>>(new Set());
  const [flash, setFlash] = useState<Flash | null>(null);
  const [movesUsed, setMovesUsed] = useState(0);
  const busyRef = useRef(false);

  const cfg = MEMORY_LEVELS[levelIdx];
  const movesAllowed = cfg.cols * cfg.rows;
  const isLastLevel = levelIdx >= MEMORY_LEVELS.length - 1;

  // ---- build a level -----------------------------------------------------
  const startLevel = useCallback((idx: number) => {
    const lvl = MEMORY_LEVELS[idx];
    const pairs = (lvl.cols * lvl.rows) / 2;
    const chosen = shuffle(MEMORY_LETTER_IDS).slice(0, pairs);

    let nextId = 0;
    const deck: MemCard[] = [];
    for (const letterId of chosen) {
      deck.push({ id: nextId++, letterId, kind: "picture" });
      deck.push({ id: nextId++, letterId, kind: "letter" });
    }

    setLevelIdx(idx);
    setCards(shuffle(deck));
    setFlippedIds([]);
    setMatchedIds(new Set());
    setFlash(null);
    setMovesUsed(0);
    busyRef.current = false;
    setPhase("playing");
  }, []);

  // ---- tap a card --------------------------------------------------------
  const handleTap = useCallback(
    (id: number) => {
      if (phase !== "playing" || busyRef.current) return;
      if (matchedIds.has(id) || flippedIds.includes(id)) return;

      const card = cards.find((c) => c.id === id);
      if (!card) return;

      // Always speak the picture-WORD, for both the picture and the letter card.
      say(getLetter(card.letterId).word);

      const next = [...flippedIds, id];
      setFlippedIds(next);
      if (next.length < 2) return;

      // second card -> a complete move
      busyRef.current = true;
      const moves = movesUsed + 1;
      setMovesUsed(moves);
      const a = cards.find((c) => c.id === next[0])!;
      const b = cards.find((c) => c.id === next[1])!;
      const isMatch = a.letterId === b.letterId;

      if (isMatch) {
        window.setTimeout(() => {
          setFlash({ ids: next, color: "green" });
          dingCorrect();
          window.setTimeout(() => {
            const nm = new Set(matchedIds);
            nm.add(a.id);
            nm.add(b.id);
            setMatchedIds(nm);
            setFlash(null);
            setFlippedIds([]);
            busyRef.current = false;
            if (nm.size === cards.length) {
              if (isLastLevel) {
                chimeWin();
                setPhase("win");
              } else {
                startLevel(levelIdx + 1);
              }
            }
          }, 550);
        }, 450);
      } else {
        window.setTimeout(() => {
          setFlash({ ids: next, color: "red" });
          buzzWrong();
          window.setTimeout(() => {
            setFlash(null);
            setFlippedIds([]);
            busyRef.current = false;
          }, 750);
        }, 450);
      }
    },
    [phase, cards, flippedIds, matchedIds, movesUsed, isLastLevel, levelIdx, startLevel]
  );

  const movesPct = Math.max(0, (movesAllowed - movesUsed) / movesAllowed);

  return (
    <div className="memoryApp" style={{ background: cfg.bg }}>
      {phase !== "start" && (
        <div className="blocksLevelPill">
          Level {levelIdx + 1}/{MEMORY_LEVELS.length}
        </div>
      )}

      {/* Moves bar (counts moves, not time). */}
      {phase !== "start" && (
        <div className="memMovesTop">
          <span className="memMovesLabel">Moves</span>
          <div className="timerWrap memMovesWrap">
            <div
              className={`timerFill ${movesPct < 0.25 ? "low" : ""}`}
              style={{ width: `${movesPct * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Card grid */}
      <div className="memArea">
        <div
          className="memBoard"
          style={{ gridTemplateColumns: `repeat(${cfg.cols}, ${CARD_W}px)`, gap: GAP }}
        >
          {cards.map((c) => (
            <Card
              key={c.id}
              card={c}
              flipped={flippedIds.includes(c.id)}
              matched={matchedIds.has(c.id)}
              flash={flash && flash.ids.includes(c.id) ? flash.color : null}
              w={CARD_W}
              h={CARD_H}
              onTap={handleTap}
            />
          ))}
        </div>
      </div>

      {/* ---- Overlays ---- */}
      {phase === "start" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🧠</div>
            <div className="overlayTitle">Memory Match</div>
            <p style={{ fontSize: 18, color: "#0a3d57", margin: "4px 0 18px" }}>
              Match each picture to its letter
            </p>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                unlockSfx();
                primeSpeech();
                startLevel(0);
              }}
            >
              ▶ Play
            </button>
          </div>
        </div>
      )}

      {phase === "win" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🏆</div>
            <div className="overlayTitle">Well done!</div>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                unlockSfx();
                stopSpeech();
                startLevel(0);
              }}
            >
              ▶ Play again
            </button>
            <a className="bigButton" href="/">
              🏠 All games
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
