"use client";

// ---------------------------------------------------------------------------
// HINDI BLOCKS GAME
// ---------------------------------------------------------------------------
// A picture (+ spoken word) appears at the top of a FULL 5x4 grid of 20 blocks.
// The child taps the TWO adjacent blocks (side-by-side OR stacked) that spell
// the word:
//   - Correct -> the pair flashes green, FIREWORKS pop, the word says its name
//     again, and the blocks vanish (those above slide straight down). After a
//     short pause the next picture appears, then its word is spoken.
//   - Wrong -> the two tapped blocks flash red and stay.
// Tapping a block plays that letter's sound; tapping the picture replays the
// word. Applause plays only once, at the END (all 10 words cleared = win).
//
// A quick auto-demo highlights the correct pair on the very first word.
//
// Boards are pre-generated + verified winnable (lib/blocks/boards.ts): the word
// for each step has a single adjacent occurrence, so the correct move is always
// unambiguous.
// ---------------------------------------------------------------------------

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Block, { BlockState } from "./Block";
import { BOARDS } from "@/lib/blocks/boards";
import { getWord } from "@/lib/blocks/words";
import {
  Board,
  Occ,
  adjacentPair,
  findBlock,
  isEmpty,
  makeBoard,
  occBlocks,
  occurrences,
  removeOcc,
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
const ROWS = 4; // full grid height

type Phase = "start" | "playing" | "won";

interface Fireworks {
  id: number;
  x: number;
  y: number;
}

// Pixel centre (within the board area) of an occurrence's pair.
function occCenter(occ: Occ): { x: number; y: number } {
  const bx = occ.c * CELL + INSET + SIZE / 2;
  const by = (ROWS - 1 - occ.L) * CELL + INSET + SIZE / 2;
  if (occ.o === "h") return { x: bx + CELL / 2, y: by };
  return { x: bx, y: by - CELL / 2 }; // vertical: midpoint up half a cell
}

export default function BlocksGame() {
  const [phase, setPhase] = useState<Phase>("start");
  const [order, setOrder] = useState<string[]>([]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [board, setBoard] = useState<Board>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [correctIds, setCorrectIds] = useState<Set<number>>(new Set());
  const [wrongIds, setWrongIds] = useState<Set<number>>(new Set());
  const [hintIds, setHintIds] = useState<Set<number>>(new Set());
  const [hintPointer, setHintPointer] = useState<{ x: number; y: number } | null>(null);
  const [fireworks, setFireworks] = useState<Fireworks | null>(null);

  const busyRef = useRef(false); // locks taps during a flash/slide
  const demoShownRef = useRef(false); // demo plays only on first open
  const wantDemoRef = useRef(false);
  const fxSeq = useRef(0);

  const target = order.length ? getWord(order[targetIndex]) : null;

  const clearHint = useCallback(() => {
    setHintIds(new Set());
    setHintPointer(null);
  }, []);

  // ---- start a new game with a random board ------------------------------
  const newGame = useCallback(() => {
    const data = BOARDS[Math.floor(Math.random() * BOARDS.length)];
    setBoard(makeBoard(data.cols));
    setOrder(data.order);
    setTargetIndex(0);
    setSelectedId(null);
    setCorrectIds(new Set());
    setWrongIds(new Set());
    clearHint();
    setFireworks(null);
    busyRef.current = false;
    // show the demo only the very first time the game is opened
    wantDemoRef.current = !demoShownRef.current;
    setPhase("playing");
    playWordSound(getWord(data.order[0]).audio); // speak the first word
  }, [clearHint]);

  // ---- auto-demo: highlight the correct pair on the first word -----------
  useEffect(() => {
    if (phase !== "playing" || !wantDemoRef.current || targetIndex !== 0) return;
    if (board.length === 0) return;
    demoShownRef.current = true;
    wantDemoRef.current = false;
    const occ = occurrences(board, getWord(order[0]).letters)[0];
    if (!occ) return;
    setHintIds(new Set(occBlocks(board, occ)));
    setHintPointer(occCenter(occ));
    const t = window.setTimeout(clearHint, 4500); // fades on its own if untouched
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, targetIndex, board]);

  // ---- tap handling ------------------------------------------------------
  const handleTap = useCallback(
    (id: number) => {
      if (phase !== "playing" || busyRef.current) return;
      clearHint(); // any tap dismisses the demo highlight
      const word = getWord(order[targetIndex]);

      // Play the tapped letter's sound FIRST — before any green/red flash.
      const pos = findBlock(board, id);
      if (pos) playLetterSound(getLetter(board[pos.c][pos.L].letterId).audio);

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
        pair.letters[0] === word.letters[0] &&
        pair.letters[1] === word.letters[1];

      if (isCorrect && pair) {
        // CORRECT: green + fireworks + the word says its name again.
        busyRef.current = true;
        setCorrectIds(new Set([selectedId, id]));
        setSelectedId(null);
        setFireworks({ id: fxSeq.current++, ...occCenter(pair.occ) });
        playWordSound(word.audio); // say the word again (no clap mid-game)

        const occ = pair.occ;
        window.setTimeout(() => {
          const next = removeOcc(board, occ);
          setBoard(next);
          setCorrectIds(new Set());
          setFireworks(null);
          if (isEmpty(next)) {
            setPhase("won");
            playWinSound(); // applause — only at the very end
            busyRef.current = false;
          } else {
            // 0.5s pause, then the new picture appears...
            window.setTimeout(() => {
              const nextIndex = targetIndex + 1;
              setTargetIndex(nextIndex);
              // ...then another 0.5s pause before speaking the new word.
              window.setTimeout(() => {
                playWordSound(getWord(order[nextIndex]).audio);
                busyRef.current = false;
              }, 500);
            }, 500);
          }
        }, 700);
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
    [phase, order, targetIndex, selectedId, board, clearHint]
  );

  const stateFor = (id: number): BlockState => {
    if (correctIds.has(id)) return "correct";
    if (wrongIds.has(id)) return "wrong";
    if (selectedId === id) return "selected";
    return "idle";
  };

  const boardWidth = board.length * CELL;
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
          <div className="progressDots">
            {order.map((_, i) => (
              <span key={i} className={`dot ${i < solved ? "done" : ""}`} />
            ))}
          </div>
        </div>
      )}

      {/* The block grid, anchored to the bottom */}
      <div className="blocksArea">
        <div
          className="blocksBoard"
          style={{ width: boardWidth, height: ROWS * CELL }}
        >
          {board.map((col, c) =>
            col.map((blk, L) => (
              <Block
                key={blk.id}
                id={blk.id}
                letterId={blk.letterId}
                x={c * CELL + INSET}
                y={(ROWS - 1 - L) * CELL + INSET}
                size={SIZE}
                state={stateFor(blk.id)}
                hint={hintIds.has(blk.id)}
                onTap={handleTap}
              />
            ))
          )}

          {/* demo pointer */}
          {hintPointer && (
            <span
              className="hintHand"
              style={{ left: hintPointer.x, top: hintPointer.y }}
            >
              👆
            </span>
          )}

          {/* fireworks on a correct answer */}
          {fireworks && (
            <span
              key={fireworks.id}
              className="fireworks"
              style={{ left: fireworks.x, top: fireworks.y }}
            >
              🎆
              <span className="spark s1" />
              <span className="spark s2" />
              <span className="spark s3" />
              <span className="spark s4" />
              <span className="spark s5" />
              <span className="spark s6" />
            </span>
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
