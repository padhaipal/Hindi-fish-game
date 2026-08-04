"use client";

// ---------------------------------------------------------------------------
// HINDI BLOCKS GAME (with levels)
// ---------------------------------------------------------------------------
// Five levels of growing grids (3x2 → 5x4), each with its own background colour
// (see lib/blocks/levels.ts). On each level a picture appears above a FULL grid;
// the child taps the two adjacent blocks (side-by-side OR stacked) that spell
// the word:
//   - Correct -> the pair flashes green, FIREWORKS pop, the word says its name
//     again, and the blocks vanish (those above slide down). After a short pause
//     the next picture appears, then its word is spoken.
//   - Wrong -> the two tapped blocks flash red and stay.
// Tapping a block plays that letter's sound; tapping the picture replays the
// word. Clearing a level moves to the next; applause plays once, after the LAST
// level (the whole game).
//
// A quick auto-demo highlights the correct pair on the very first word (level 1).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import Block, { BlockState } from "./Block";
import { LEVELS } from "@/lib/blocks/levels";
import { getWord } from "@/lib/blocks/words";
import WordPicture from "@/components/shared/WordPicture";
import EndVideo from "@/components/shared/EndVideo";
import SpeakerIcon from "@/components/shared/SpeakerIcon";
import {
  Board,
  Occ,
  runFromIds,
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
  stopWinLoseSounds,
  unlockAudio,
} from "@/lib/audio";
import { trackLevelReached } from "@/lib/analytics";

// Layout (keep in sync with .block sizing in globals.css).
const CELL = 64; // block cell incl. gap
const SIZE = 58; // visible block size
const INSET = (CELL - SIZE) / 2;

type Phase = "start" | "playing" | "levelComplete" | "won";

interface Fireworks {
  id: number;
  x: number;
  y: number;
}

export default function BlocksGame() {
  const [phase, setPhase] = useState<Phase>("start");
  const [levelIdx, setLevelIdx] = useState(0);
  const [order, setOrder] = useState<string[]>([]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [board, setBoard] = useState<Board>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]); // tapped-so-far, in order
  const [correctIds, setCorrectIds] = useState<Set<number>>(new Set());
  const [wrongIds, setWrongIds] = useState<Set<number>>(new Set());
  const [hintIds, setHintIds] = useState<Set<number>>(new Set());
  const [hintPointer, setHintPointer] = useState<{ x: number; y: number } | null>(null);
  const [fireworks, setFireworks] = useState<Fireworks | null>(null);

  const busyRef = useRef(false); // locks taps during a flash/slide
  const demoShownRef = useRef(false); // demo plays only on first open
  const wantDemoRef = useRef(false);
  const rowsRef = useRef(LEVELS[0].rows); // current level's row count
  const fxSeq = useRef(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<number[]>([]); // live selection (for the pointer handlers)
  const draggingRef = useRef(false);

  const cfg = LEVELS[levelIdx];
  const target = order.length ? getWord(order[targetIndex]) : null;
  const isLastLevel = levelIdx >= LEVELS.length - 1;

  // Pixel centre (within the board area) of a run.
  const center = useCallback((occ: Occ): { x: number; y: number } => {
    const rows = rowsRef.current;
    const bx = occ.c * CELL + INSET + SIZE / 2;
    const by = (rows - 1 - occ.L) * CELL + INSET + SIZE / 2;
    if (occ.o === "h") return { x: bx + ((occ.len - 1) * CELL) / 2, y: by };
    return { x: bx, y: by - ((occ.len - 1) * CELL) / 2 }; // vertical: run goes up
  }, []);

  const clearHint = useCallback(() => {
    setHintIds(new Set());
    setHintPointer(null);
  }, []);

  const setSel = useCallback((ids: number[]) => {
    selRef.current = ids;
    setSelectedIds(ids);
  }, []);

  // Speak the picture's word and keep the board LOCKED (un-clickable) until it
  // finishes playing.
  const announce = useCallback((src: string) => {
    busyRef.current = true;
    playWordSound(src, () => {
      busyRef.current = false;
    });
  }, []);

  // ---- start a given level (0-based) with a random board -----------------
  const startLevel = useCallback(
    (idx: number) => {
      const lvl = LEVELS[idx];
      const data = lvl.boards[Math.floor(Math.random() * lvl.boards.length)];
      rowsRef.current = lvl.rows;
      setLevelIdx(idx);
      setBoard(makeBoard(data.cols));
      setOrder(data.order);
      setTargetIndex(0);
      setSelectedIds([]);
      selRef.current = [];
      draggingRef.current = false;
      setCorrectIds(new Set());
      setWrongIds(new Set());
      clearHint();
      setFireworks(null);
      // demo only on the very first word of level 1, on first open
      wantDemoRef.current = idx === 0 && !demoShownRef.current;
      setPhase("playing");
      announce(getWord(data.order[0]).audio); // locks the board while it speaks
      trackLevelReached(idx + 1);
    },
    [clearHint, announce]
  );

  const newGame = useCallback(() => startLevel(0), [startLevel]);

  // ---- auto-demo: highlight the correct pair on the first word -----------
  useEffect(() => {
    if (phase !== "playing" || !wantDemoRef.current || targetIndex !== 0) return;
    if (board.length === 0) return;
    demoShownRef.current = true;
    wantDemoRef.current = false;
    const occ = occurrences(board, getWord(order[0]).letters)[0];
    if (!occ) return;
    setHintIds(new Set(occBlocks(board, occ)));
    setHintPointer(center(occ));
    const t = window.setTimeout(clearHint, 4500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, targetIndex, board]);

  // ---- selection (swipe OR tap the letters in order) ---------------------
  const wrongReset = (ids: number[]) => {
    busyRef.current = true;
    setWrongIds(new Set(ids));
    setSel([]);
    window.setTimeout(() => {
      setWrongIds(new Set());
      busyRef.current = false;
    }, 600);
  };

  // The whole word is spelled: pop the run, speak the word, advance.
  const complete = (run: { occ: Occ }, curBoard: Board) => {
    const word = getWord(order[targetIndex]);
    busyRef.current = true;
    setCorrectIds(new Set(selRef.current));
    setSel([]);
    setFireworks({ id: fxSeq.current++, ...center(run.occ) });
    window.setTimeout(() => playWordSound(word.audio.replace("/words/", "/words/whole/")), 450);
    window.setTimeout(() => {
      const next = removeOcc(curBoard, run.occ);
      setBoard(next);
      setCorrectIds(new Set());
      setFireworks(null);
      if (isEmpty(next)) {
        setPhase(isLastLevel ? "won" : "levelComplete");
        playWinSound();
        busyRef.current = false;
      } else {
        window.setTimeout(() => {
          const ni = targetIndex + 1;
          setTargetIndex(ni);
          announce(getWord(order[ni]).audio); // locks the board while it speaks
        }, 400);
      }
    }, 1000);
  };

  // Add block `id` to the selection. `deliberate` = a real press (flash red on a
  // wrong letter); a finger merely passing over a wrong block is ignored.
  const extend = (id: number, deliberate: boolean) => {
    if (phase !== "playing" || busyRef.current) return;
    clearHint();
    const word = getWord(order[targetIndex]);
    const pos = findBlock(board, id);
    if (!pos) return;
    const lid = board[pos.c][pos.L].letterId;
    const sel = selRef.current;
    if (sel.includes(id)) return;

    // Pressing the word's FIRST letter (re)starts the selection from there.
    if (lid === word.letters[0]) {
      setSel([id]);
      playLetterSound(getLetter(lid).audio);
      return;
    }
    if (sel.length === 0) {
      if (deliberate) wrongReset([id]);
      return;
    }
    const tentative = [...sel, id];
    const run = runFromIds(board, tentative);
    const ok = !!run && word.letters.slice(0, tentative.length).every((l, i) => run.letters[i] === l);
    if (!ok || !run) {
      if (deliberate) wrongReset([id, ...sel]);
      return;
    }
    setSel(tentative);
    playLetterSound(getLetter(lid).audio);
    if (tentative.length === word.letters.length) complete(run, board);
  };

  // pointer position -> the block under it (null if empty)
  const blockAt = (clientX: number, clientY: number): number | null => {
    const el = boardRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = Math.floor((clientX - r.left) / CELL);
    const rowTop = Math.floor((clientY - r.top) / CELL);
    const L = rowsRef.current - 1 - rowTop;
    if (c < 0 || c >= board.length || L < 0) return null;
    const col = board[c];
    if (!col || L >= col.length) return null;
    return col[L].id;
  };

  const onBoardDown = (e: React.PointerEvent) => {
    if (phase !== "playing" || busyRef.current) return;
    const id = blockAt(e.clientX, e.clientY);
    if (id == null) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    draggingRef.current = true;
    extend(id, true);
  };
  const onBoardMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || busyRef.current) return;
    const id = blockAt(e.clientX, e.clientY);
    if (id == null) return;
    const sel = selRef.current;
    if (sel.length && id === sel[sel.length - 1]) return; // still on the last gem
    if (sel.length >= 2 && id === sel[sel.length - 2]) {
      setSel(sel.slice(0, -1)); // dragged back — undo the last
      return;
    }
    extend(id, false);
  };
  const onBoardUp = () => {
    draggingRef.current = false;
  };

  const stateFor = (id: number): BlockState => {
    if (correctIds.has(id)) return "correct";
    if (wrongIds.has(id)) return "wrong";
    if (selectedIds.includes(id)) return "selected";
    return "idle";
  };
  const selectOrder = (id: number): number => selectedIds.indexOf(id) + 1; // 0 if not selected

  const boardWidth = board.length * CELL;
  const solved = targetIndex;

  return (
    <div className="blocksApp" style={{ background: cfg.bg }}>
      {phase !== "start" && (
        <div className="blocksLevelPill">
          स्तर {levelIdx + 1}/{LEVELS.length}
        </div>
      )}

      {/* Picture + spoken word (tap to hear it again) */}
      {target && phase === "playing" && (
        <div className="blocksTop">
          <button
            type="button"
            className="pictureCard"
            onClick={() => {
              if (busyRef.current) return;
              unlockAudio();
              announce(target.audio);
            }}
            aria-label={`hear the word ${target.word}`}
          >
            <WordPicture id={target.id} emoji={target.emoji} size={130} className="pictureEmoji" />
          </button>
          <button
            type="button"
            className="soundBtn"
            onClick={() => {
              if (busyRef.current) return;
              unlockAudio();
              announce(target.audio);
            }}
            aria-label="सुनो"
          >
            <SpeakerIcon /> सुनो
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
          ref={boardRef}
          className="blocksBoard"
          style={{ width: boardWidth, height: cfg.rows * CELL, touchAction: "none" }}
          onPointerDown={onBoardDown}
          onPointerMove={onBoardMove}
          onPointerUp={onBoardUp}
          onPointerCancel={onBoardUp}
        >
          {board.map((col, c) =>
            col.map((blk, L) => (
              <Block
                key={blk.id}
                id={blk.id}
                letterId={blk.letterId}
                x={c * CELL + INSET}
                y={(cfg.rows - 1 - L) * CELL + INSET}
                size={SIZE}
                state={stateFor(blk.id)}
                order={selectOrder(blk.id)}
                hint={hintIds.has(blk.id)}
              />
            ))
          )}

          {hintPointer && (
            <span
              className="hintHand"
              style={{ left: hintPointer.x, top: hintPointer.y }}
            >
              👆
            </span>
          )}

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
              चित्र वाले शब्द के अक्षर क्रम से छुओ
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
                stopWinLoseSounds(); // cut the applause as soon as they move on
                startLevel(levelIdx + 1);
              }}
            >
              ▶ अगला स्तर
            </button>
          </div>
        </div>
      )}

      {phase === "won" && <EndVideo />}
    </div>
  );
}
