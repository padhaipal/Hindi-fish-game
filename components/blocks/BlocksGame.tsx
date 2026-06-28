"use client";

// ---------------------------------------------------------------------------
// HINDI BLOCKS GAME
// ---------------------------------------------------------------------------
// A picture (+ spoken word) appears at the top. The child taps the TWO adjacent
// blocks that spell the word. Correct -> they flash green, a clap plays, and
// they vanish (blocks above slide straight down). Wrong -> the two flash red and
// stay. Clear all 14 blocks (7 words) to win.
//
// Boards are pre-generated and verified winnable (lib/blocks/boards.ts), and the
// word for each step has a single adjacent occurrence, so the correct move is
// always unambiguous.
// ---------------------------------------------------------------------------

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import Block, { BlockState } from "./Block";
import { BOARDS } from "@/lib/blocks/boards";
import { getWord } from "@/lib/blocks/words";
import {
  Board,
  adjacentPair,
  findBlock,
  isEmpty,
  makeBoard,
  removeAt,
} from "@/lib/blocks/engine";
import { getLetter } from "@/lib/letters";
import {
  playWordSound,
  playLetterSound,
  playWinSound,
  unlockAudio,
} from "@/lib/audio";

// Layout (keep in sync with .block sizing in globals.css).
const CELL = 64; // block cell incl. gap
const SIZE = 58; // visible block size
const INSET = (CELL - SIZE) / 2;
const MAX_ROWS = 4; // tallest column

type Phase = "start" | "playing" | "won";

export default function BlocksGame() {
  const [phase, setPhase] = useState<Phase>("start");
  const [order, setOrder] = useState<string[]>([]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [board, setBoard] = useState<Board>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [correctIds, setCorrectIds] = useState<Set<number>>(new Set());
  const [wrongIds, setWrongIds] = useState<Set<number>>(new Set());
  const busyRef = useRef(false); // locks taps during a flash/slide

  const target = order.length ? getWord(order[targetIndex]) : null;

  // ---- start a new game with a random board ------------------------------
  const newGame = useCallback(() => {
    const data = BOARDS[Math.floor(Math.random() * BOARDS.length)];
    setBoard(makeBoard(data.cols));
    setOrder(data.order);
    setTargetIndex(0);
    setSelectedId(null);
    setCorrectIds(new Set());
    setWrongIds(new Set());
    busyRef.current = false;
    setPhase("playing");
    // play the first word
    playWordSound(getWord(data.order[0]).audio);
  }, []);

  // ---- tap handling ------------------------------------------------------
  const handleTap = useCallback(
    (id: number) => {
      if (phase !== "playing" || busyRef.current) return;
      const current = order[targetIndex];
      const word = getWord(current);

      // Play the tapped letter's sound FIRST — before any green/red flash, so on
      // the second tap the child still hears the letter before the result.
      const pos = findBlock(board, id);
      if (pos) playLetterSound(getLetter(board[pos.c][pos.L].letterId).audio);

      // first tap -> select; tapping the same block -> deselect
      if (selectedId === null) {
        setSelectedId(id);
        return;
      }
      if (selectedId === id) {
        setSelectedId(null);
        return;
      }

      const pair = adjacentPair(board, selectedId, id);
      const isCorrect =
        !!pair &&
        pair.left.letterId === word.letters[0] &&
        pair.right.letterId === word.letters[1];

      if (isCorrect && pair) {
        // CORRECT: green flash + clap, then remove and slide everything down.
        busyRef.current = true;
        setCorrectIds(new Set([selectedId, id]));
        setSelectedId(null);
        playWinSound(); // clapping (same 3s clip as the fish game)
        const { c, L } = pair;
        window.setTimeout(() => {
          const next = removeAt(board, c, L);
          setBoard(next);
          setCorrectIds(new Set());
          if (isEmpty(next)) {
            setPhase("won");
          } else {
            const nextIndex = targetIndex + 1;
            setTargetIndex(nextIndex);
            playWordSound(getWord(order[nextIndex]).audio); // next picture's word
          }
          busyRef.current = false;
        }, 480);
      } else {
        // WRONG: red flash for ~0.7s, blocks stay.
        busyRef.current = true;
        setWrongIds(new Set([selectedId, id]));
        setSelectedId(null);
        window.setTimeout(() => {
          setWrongIds(new Set());
          busyRef.current = false;
        }, 700);
      }
    },
    [phase, order, targetIndex, selectedId, board]
  );

  const stateFor = (id: number): BlockState => {
    if (correctIds.has(id)) return "correct";
    if (wrongIds.has(id)) return "wrong";
    if (selectedId === id) return "selected";
    return "idle";
  };

  const numCols = board.length;
  const boardWidth = numCols * CELL;
  const solved = targetIndex; // words cleared so far

  return (
    <div className="blocksApp">
      <Link href="/" className="cornerLink" aria-label="games home">
        🏠
      </Link>

      {/* Picture + spoken word (tap to hear it again) */}
      {target && phase !== "start" && (
        <div className="blocksTop">
          <button
            type="button"
            className="pictureCard"
            onClick={() => {
              unlockAudio();
              playWordSound(target.audio);
            }}
            aria-label={`hear the word ${target.word}`}
          >
            <span className="pictureEmoji">{target.emoji}</span>
            <span className="pictureHint">🔊</span>
          </button>
          {/* progress: one dot per word */}
          <div className="progressDots">
            {order.map((_, i) => (
              <span
                key={i}
                className={`dot ${i < solved ? "done" : ""}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* The block grid, anchored to the bottom */}
      <div className="blocksArea">
        <div
          className="blocksBoard"
          style={{ width: boardWidth, height: MAX_ROWS * CELL }}
        >
          {board.map((col, c) =>
            col.map((blk, L) => (
              <Block
                key={blk.id}
                id={blk.id}
                letterId={blk.letterId}
                x={c * CELL + INSET}
                y={(MAX_ROWS - 1 - L) * CELL + INSET}
                size={SIZE}
                state={stateFor(blk.id)}
                onTap={handleTap}
              />
            ))
          )}
        </div>
      </div>

      {/* ---- Overlays ---- */}
      {phase === "start" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🧩</div>
            <div className="overlayTitle">शब्द बनाओ</div>
            <p style={{ fontSize: 18, color: "#0a3d57", margin: "4px 0 18px" }}>
              सही दो अक्षर वाले ब्लॉक चुनो
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

      {phase === "won" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🎉</div>
            <div className="overlayTitle">शाबाश!</div>
            <div style={{ fontSize: 18, color: "#0a3d57", margin: "2px 0 16px" }}>
              सारे ब्लॉक हट गए!
            </div>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                unlockAudio();
                newGame();
              }}
            >
              🔁 फिर से
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
