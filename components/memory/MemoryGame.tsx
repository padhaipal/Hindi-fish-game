"use client";

// ---------------------------------------------------------------------------
// HINDI MEMORY GAME
// ---------------------------------------------------------------------------
// Match each PICTURE card to its LETTER card. Tap a card -> it flips and its
// sound plays (picture = the word "batakh", letter = "ba"). Two cards a turn:
//   - match  -> flash green, a "bing!" plays, the pair disappears.
//   - no match -> flash red, both flip back.
// A moves bar at the top (coloured like the fish timer) gives cols*rows moves.
// Clear the board in time -> applause + next level. Run out of moves -> "wa wa
// wa" and you retry the same level. Levels grow + change background colour.
// ---------------------------------------------------------------------------

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import Card, { MemCard } from "./Card";
import { MEMORY_LEVELS } from "@/lib/memory/levels";
import { LETTERS, getLetter } from "@/lib/letters";
import {
  playPictureSound,
  playLetterSound,
  playBingSound,
  playWinSound,
  playLoseSound,
  stopWinLoseSounds,
  unlockAudio,
} from "@/lib/audio";

const PADHAIPAL_URL = "https://wa.me/918528097842";
const CARD_W = 78;
const CARD_H = 96;
const GAP = 10;

type Phase = "start" | "playing" | "levelComplete" | "levelFail" | "allDone";

interface Flash {
  ids: number[];
  color: "green" | "red";
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
    // pick `pairs` distinct letters
    const ids = LETTERS.map((l) => l.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    const chosen = ids.slice(0, pairs);
    // two cards per letter (picture + letter), then shuffle
    let nextId = 0;
    const deck: MemCard[] = [];
    for (const letterId of chosen) {
      deck.push({ id: nextId++, letterId, kind: "picture" });
      deck.push({ id: nextId++, letterId, kind: "letter" });
    }
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    setLevelIdx(idx);
    setCards(deck);
    setFlippedIds([]);
    setMatchedIds(new Set());
    setFlash(null);
    setMovesUsed(0);
    busyRef.current = false;
    setPhase("playing");
  }, []);

  const newGame = useCallback(() => startLevel(0), [startLevel]);

  // ---- after a turn resolves, see if the level is won or lost ------------
  const resolve = useCallback(
    (matched: Set<number>, moves: number, total: number, lastLevel: boolean) => {
      if (matched.size === total) {
        playWinSound(); // applause
        setPhase(lastLevel ? "allDone" : "levelComplete");
      } else if (moves >= movesAllowed) {
        playLoseSound(); // wa wa wa
        setPhase("levelFail");
      }
    },
    [movesAllowed]
  );

  // ---- tap a card --------------------------------------------------------
  const handleTap = useCallback(
    (id: number) => {
      if (phase !== "playing" || busyRef.current) return;
      if (matchedIds.has(id) || flippedIds.includes(id)) return;

      const card = cards.find((c) => c.id === id);
      if (!card) return;
      unlockAudio();
      // flip + play this card's sound
      if (card.kind === "picture") playPictureSound(card.letterId);
      else playLetterSound(getLetter(card.letterId).audio);

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
          playBingSound();
          window.setTimeout(() => {
            const nm = new Set(matchedIds);
            nm.add(a.id);
            nm.add(b.id);
            setMatchedIds(nm);
            setFlash(null);
            setFlippedIds([]);
            busyRef.current = false;
            resolve(nm, moves, cards.length, isLastLevel);
          }, 550);
        }, 500);
      } else {
        window.setTimeout(() => {
          setFlash({ ids: next, color: "red" });
          window.setTimeout(() => {
            setFlash(null);
            setFlippedIds([]);
            busyRef.current = false;
            resolve(matchedIds, moves, cards.length, isLastLevel);
          }, 750);
        }, 450);
      }
    },
    [phase, cards, flippedIds, matchedIds, movesUsed, isLastLevel, resolve]
  );

  const movesPct = Math.max(0, (movesAllowed - movesUsed) / movesAllowed);

  return (
    <div className="memoryApp" style={{ background: cfg.bg }}>
      <Link href="/" className="cornerLink" aria-label="games home">
        🏠
      </Link>
      {phase !== "start" && (
        <div className="blocksLevelPill">
          स्तर {levelIdx + 1}/{MEMORY_LEVELS.length}
        </div>
      )}

      {/* Moves bar (coloured like the fish timer, but counts moves not time). */}
      {phase !== "start" && (
        <div className="memMovesTop">
          <span className="memMovesLabel">चालें</span>
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
            <div className="overlayTitle">जोड़ी मिलाओ</div>
            <p style={{ fontSize: 18, color: "#0a3d57", margin: "4px 0 18px" }}>
              तस्वीर और अक्षर की जोड़ी बनाओ
            </p>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                unlockAudio();
                newGame();
              }}
            >
              ▶ खेलो
            </button>
          </div>
        </div>
      )}

      {phase === "levelComplete" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🎉</div>
            <div className="overlayTitle">शाबाश!</div>
            <div style={{ fontSize: 18, color: "#0a3d57", margin: "2px 0 16px" }}>
              स्तर {levelIdx + 1} पूरा!
            </div>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                unlockAudio();
                stopWinLoseSounds();
                startLevel(levelIdx + 1);
              }}
            >
              ▶ अगला स्तर
            </button>
          </div>
        </div>
      )}

      {phase === "levelFail" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">⏳</div>
            <div className="overlayTitle">फिर कोशिश करो</div>
            <button
              type="button"
              className="bigButton blue"
              onClick={() => {
                unlockAudio();
                stopWinLoseSounds();
                startLevel(levelIdx); // retry same level
              }}
            >
              🔁 दोबारा
            </button>
          </div>
        </div>
      )}

      {phase === "allDone" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🏆</div>
            <div className="overlayTitle">शाबाश!</div>
            <div style={{ fontSize: 18, color: "#0a3d57", margin: "2px 0 16px" }}>
              सभी स्तर पूरे!
            </div>
            <a className="bigButton" href={PADHAIPAL_URL}>
              पाठ पर जाएं
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
