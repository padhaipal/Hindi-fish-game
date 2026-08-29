"use client";

// ---------------------------------------------------------------------------
// ALfA ENGLISH — BLOCKS GAME (spell the pictured word)
// ---------------------------------------------------------------------------
// A picture (a CVC word's emoji, e.g. cat 🐱) sits above a grid of letter blocks.
// The child taps (or swipes) the word's letters IN ORDER, and they must form an
// ADJACENT straight run — left→right or top→bottom — to spell it:
//   - Each correct, adjacent letter lifts with an order number and a soft tick.
//   - The final letter completes the run: the blocks pop with FIREWORKS, the
//     whole word is spoken, a "ding" plays, those blocks vanish (the rest slide
//     down under gravity), and the next picture appears.
//   - A tap that isn't the next adjacent block of a valid run flashes red +
//     buzzes and clears the current selection.
// The board generator guarantees every word is present as a contiguous run (see
// lib/blocks/words.ts). Levels grow (1 word → 5 words per board). Finishing the
// last level shows the win overlay with applause. A first-word demo highlights
// the run to tap.
//
// This restores the Hindi Blocks adjacency mechanic (see lib/blocks/*). Nothing
// is imported from the Hindi app.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import Block, { type BlockState } from "./Block";
import SpeakerIcon from "@/components/shared/SpeakerIcon";
import JamIcon from "@/components/shared/JamIcon";
import { LEVELS } from "@/lib/blocks/levels";
import { pickWords, buildBoardCols } from "@/lib/blocks/words";
import {
  type Board,
  type Occ,
  makeBoard,
  findBlock,
  removeByIds,
  isEmpty,
  occurrences,
  occBlocks,
  runFromIds,
} from "@/lib/blocks/engine";
import { type CvcWord } from "@/lib/lessons";
import { primeSpeech, stopSpeech } from "@/lib/speech";
import { speakWord } from "@/lib/sound";
import { dingCorrect, buzzWrong, chimeWin, tick, unlockSfx } from "@/lib/sfx";

// Layout — keep in sync with .block sizing in globals.css.
const CELL = 64; // block cell incl. gap
const SIZE = 58; // visible block size
const INSET = (CELL - SIZE) / 2;

type Phase = "start" | "playing" | "won";

interface Fx {
  id: number;
  x: number;
  y: number;
}

export default function BlocksGame() {
  const [phase, setPhase] = useState<Phase>("start");
  const [levelIdx, setLevelIdx] = useState(0);
  const [words, setWords] = useState<CvcWord[]>([]);
  const [targetIndex, setTargetIndex] = useState(0);
  const [board, setBoard] = useState<Board>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [correctIds, setCorrectIds] = useState<Set<number>>(new Set());
  const [wrongIds, setWrongIds] = useState<Set<number>>(new Set());
  const [hintIds, setHintIds] = useState<Set<number>>(new Set());
  const [hintPointer, setHintPointer] = useState<{ x: number; y: number } | null>(null);
  const [fx, setFx] = useState<Fx | null>(null);

  const busyRef = useRef(false); // locks taps during a flash / pop
  const demoShownRef = useRef(false); // the demo plays only once
  const wantDemoRef = useRef(false);
  const fxSeq = useRef(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<number[]>([]); // live selection (for the pointer handlers)
  const draggingRef = useRef(false);

  const cfg = LEVELS[levelIdx];
  const target = words[targetIndex] ?? null;
  const isLastLevel = levelIdx >= LEVELS.length - 1;

  // Pixel centre (within the board) of a run.
  const center = useCallback(
    (occ: Occ): { x: number; y: number } => {
      const bx = occ.c * CELL + INSET + SIZE / 2;
      const by = (cfg.rows - 1 - occ.L) * CELL + INSET + SIZE / 2;
      if (occ.o === "h") return { x: bx + ((occ.len - 1) * CELL) / 2, y: by };
      return { x: bx, y: by - ((occ.len - 1) * CELL) / 2 }; // vertical: run goes up
    },
    [cfg.rows]
  );

  const clearHint = useCallback(() => {
    setHintIds(new Set());
    setHintPointer(null);
  }, []);

  const setSel = useCallback((ids: number[]) => {
    selRef.current = ids;
    setSelectedIds(ids);
  }, []);

  // Speak the picture's word (whole word only).
  const announce = useCallback((word: string) => {
    speakWord(word);
  }, []);

  // ---- start a given level (0-based) with a fresh random board -------------
  const startLevel = useCallback(
    (idx: number) => {
      const lvl = LEVELS[idx];
      const picked = pickWords(lvl.words);
      const cols = buildBoardCols(picked.map((w) => w.word), lvl.cols, lvl.rows);
      setLevelIdx(idx);
      setBoard(makeBoard(cols));
      setWords(picked);
      setTargetIndex(0);
      setSelectedIds([]);
      selRef.current = [];
      draggingRef.current = false;
      setCorrectIds(new Set());
      setWrongIds(new Set());
      clearHint();
      setFx(null);
      wantDemoRef.current = idx === 0 && !demoShownRef.current;
      busyRef.current = false;
      setPhase("playing");
      announce(picked[0].word);
    },
    [clearHint, announce]
  );

  const newGame = useCallback(() => startLevel(0), [startLevel]);

  useEffect(() => stopSpeech, []); // stop any speech when unmounting

  // ---- first-word demo: highlight the letters to tap, with a pointing hand --
  useEffect(() => {
    if (phase !== "playing" || !wantDemoRef.current || targetIndex !== 0) return;
    if (board.length === 0 || words.length === 0) return;
    demoShownRef.current = true;
    wantDemoRef.current = false;
    const occ = occurrences(board, words[0].word.split(""))[0];
    if (!occ) return;
    setHintIds(new Set(occBlocks(board, occ)));
    setHintPointer(center(occ));
    const t = window.setTimeout(clearHint, 4500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, targetIndex, board]);

  // ---- a wrong (non-adjacent / out-of-order) tap: flash red, clear ---------
  const wrongReset = (ids: number[]) => {
    busyRef.current = true;
    setWrongIds(new Set(ids));
    setSel([]);
    buzzWrong();
    window.setTimeout(() => {
      setWrongIds(new Set());
      busyRef.current = false;
    }, 500);
  };

  // ---- the whole word is spelled as an adjacent run: pop, speak, advance ---
  const complete = (run: { occ: Occ }, curBoard: Board) => {
    const word = words[targetIndex];
    const ids = selRef.current.slice();
    busyRef.current = true;
    setCorrectIds(new Set(ids));
    setSel([]);
    setFx({ id: fxSeq.current++, ...center(run.occ) });
    speakWord(word.word);
    dingCorrect();

    window.setTimeout(() => {
      const next = removeByIds(curBoard, ids);
      setBoard(next);
      setCorrectIds(new Set());
      setFx(null);
      if (isEmpty(next)) {
        if (isLastLevel) {
          setPhase("won");
          chimeWin();
          busyRef.current = false;
        } else {
          startLevel(levelIdx + 1);
        }
      } else {
        const ni = targetIndex + 1;
        setTargetIndex(ni);
        busyRef.current = false;
        window.setTimeout(() => announce(words[ni].word), 250);
      }
    }, 850);
  };

  // ---- extend the selection with block `id` --------------------------------
  // Valid only if it keeps the taps an adjacent straight run (h or v) spelling
  // the target word in order. `deliberate` = a real press (flash red on a wrong
  // block); a finger merely passing over a wrong block while swiping is ignored.
  const extend = (id: number, deliberate: boolean) => {
    if (phase !== "playing" || busyRef.current) return;
    if (!target) return;
    clearHint();
    const pos = findBlock(board, id);
    if (!pos) return;
    const ch = board[pos.c][pos.L].char;
    const sel = selRef.current;
    if (sel.includes(id)) return;

    // Tapping the word's FIRST letter (re)starts the selection from there.
    if (ch === target.word[0]) {
      setSel([id]);
      tick();
      return;
    }
    if (sel.length === 0) {
      if (deliberate) wrongReset([id]);
      return;
    }
    const tentative = [...sel, id];
    const run = runFromIds(board, tentative);
    const ok =
      !!run &&
      target.word
        .slice(0, tentative.length)
        .split("")
        .every((c, i) => run.chars[i] === c);
    if (!ok || !run) {
      if (deliberate) wrongReset([id, ...sel]);
      return;
    }
    setSel(tentative);
    tick();
    if (tentative.length === target.word.length) complete(run, board);
  };

  // ---- board-level pointer handling (tap OR swipe the run) -----------------
  // A pointer position → the block under it (null if that cell is empty).
  const blockAt = (clientX: number, clientY: number): number | null => {
    const el = boardRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const c = Math.floor((clientX - r.left) / CELL);
    const rowTop = Math.floor((clientY - r.top) / CELL);
    const L = cfg.rows - 1 - rowTop;
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
  const selectOrder = (id: number): number => selectedIds.indexOf(id) + 1;

  const boardWidth = cfg.cols * CELL;
  const boardHeight = cfg.rows * CELL;

  return (
    <div className="blocksApp" style={{ background: cfg.bg }}>
      <a className="cornerLink" href="/" aria-label="home">
        ←
      </a>

      {phase !== "start" && (
        <div className="blocksLevelPill">
          Level {levelIdx + 1}/{LEVELS.length}
        </div>
      )}

      {/* Picture + spoken word (tap either to hear it again) */}
      {target && phase === "playing" && (
        <div className="blocksTop">
          <button
            type="button"
            className="pictureCard"
            onClick={() => announce(target.word)}
            aria-label={`hear the word ${target.word}`}
          >
            {target.word === "jam" ? (
              <JamIcon size={110} />
            ) : (
              <span className="pictureEmoji">{target.emoji}</span>
            )}
          </button>
          <button
            type="button"
            className="soundBtn"
            onClick={() => announce(target.word)}
            aria-label="listen"
          >
            <SpeakerIcon /> Listen
          </button>
          <div className="progressDots">
            {words.map((_, i) => (
              <span key={i} className={`dot ${i < targetIndex ? "done" : ""}`} />
            ))}
          </div>
        </div>
      )}

      {/* The block grid, anchored to the bottom */}
      <div className="blocksArea">
        <div
          ref={boardRef}
          className="blocksBoard"
          style={{ width: boardWidth, height: boardHeight, touchAction: "none" }}
          onPointerDown={onBoardDown}
          onPointerMove={onBoardMove}
          onPointerUp={onBoardUp}
          onPointerCancel={onBoardUp}
        >
          {board.map((col, c) =>
            col.map((blk, L) => {
              return (
                <Block
                  key={blk.id}
                  char={blk.char}
                  x={c * CELL + INSET}
                  y={(cfg.rows - 1 - L) * CELL + INSET}
                  size={SIZE}
                  state={stateFor(blk.id)}
                  order={selectOrder(blk.id)}
                  hint={hintIds.has(blk.id)}
                />
              );
            })
          )}

          {hintPointer && (
            <span className="hintHand" style={{ left: hintPointer.x, top: hintPointer.y }}>
              👆
            </span>
          )}

          {fx && (
            <span key={fx.id} className="fireworks" style={{ left: fx.x, top: fx.y }}>
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
            <div className="overlayTitle">Spell the word</div>
            <p style={{ fontSize: 18, color: "#0a3d57", margin: "4px 0 18px" }}>
              Tap the letters in order to spell the picture
            </p>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                unlockSfx();
                primeSpeech();
                newGame();
              }}
            >
              ▶ Play
            </button>
          </div>
        </div>
      )}

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
                newGame();
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
    </div>
  );
}
