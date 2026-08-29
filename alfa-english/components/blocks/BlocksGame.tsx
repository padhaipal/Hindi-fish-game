"use client";

// ---------------------------------------------------------------------------
// ALfA ENGLISH — BLOCKS GAME (spell the pictured word)
// ---------------------------------------------------------------------------
// A picture (a CVC word's emoji, e.g. cat 🐱) sits above a grid of letter blocks.
// The child taps the word's letters IN ORDER (anywhere on the board — order is
// enforced) to spell it:
//   - Each correct letter lifts with an order number and a soft tick.
//   - The final letter completes the word: the blocks pop with FIREWORKS, the
//     whole word is spoken, a "ding" plays, those blocks vanish (the rest slide
//     down under gravity), and the next picture appears.
//   - A wrong tap flashes red + buzzes and clears the current selection.
// Levels grow (1 word → 5 words per board). Finishing the last level shows the
// win overlay with applause. A first-word demo highlights the letters to tap.
//
// This adapts the Hindi Blocks mechanic but simplifies the adjacency rule to a
// plain "tap the letters in order" (see lib/blocks/*). Nothing is imported from
// the Hindi app.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import Block, { type BlockState } from "./Block";
import SpeakerIcon from "@/components/shared/SpeakerIcon";
import { LEVELS } from "@/lib/blocks/levels";
import { pickWords, buildBoardCols } from "@/lib/blocks/words";
import {
  type Board,
  makeBoard,
  findBlock,
  removeByIds,
  isEmpty,
  spellBlocks,
} from "@/lib/blocks/engine";
import { type CvcWord } from "@/lib/lessons";
import { say, primeSpeech, stopSpeech } from "@/lib/speech";
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

  const cfg = LEVELS[levelIdx];
  const target = words[targetIndex] ?? null;
  const isLastLevel = levelIdx >= LEVELS.length - 1;

  // Pixel centre (within the board) of a block at column c, level L.
  const center = useCallback(
    (c: number, L: number): { x: number; y: number } => ({
      x: c * CELL + INSET + SIZE / 2,
      y: (cfg.rows - 1 - L) * CELL + INSET + SIZE / 2,
    }),
    [cfg.rows]
  );

  const clearHint = useCallback(() => {
    setHintIds(new Set());
    setHintPointer(null);
  }, []);

  // Speak the picture's word (whole word only).
  const announce = useCallback((word: string) => {
    say(word);
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
    const spell = spellBlocks(board, words[0].word);
    if (!spell) return;
    setHintIds(new Set(spell.map((s) => s.id)));
    setHintPointer(center(spell[0].c, spell[0].L));
    const t = window.setTimeout(clearHint, 4500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, targetIndex, board]);

  // ---- the whole word is spelled: pop, speak, advance ----------------------
  const complete = (ids: number[]) => {
    const word = words[targetIndex];
    busyRef.current = true;
    setCorrectIds(new Set(ids));
    setSelectedIds([]);

    // fireworks at the average centre of the completed blocks
    const pts = ids
      .map((id) => findBlock(board, id))
      .filter((p): p is { c: number; L: number } => p !== null)
      .map((p) => center(p.c, p.L));
    if (pts.length) {
      const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      setFx({ id: fxSeq.current++, x: cx, y: cy });
    }
    say(word.word);
    dingCorrect();

    window.setTimeout(() => {
      const next = removeByIds(board, ids);
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

  // ---- a tap on a block ----------------------------------------------------
  const onTap = (id: number) => {
    if (phase !== "playing" || busyRef.current) return;
    if (!target) return;
    clearHint();
    if (selectedIds.includes(id)) return;
    const pos = findBlock(board, id);
    if (!pos) return;
    const ch = board[pos.c][pos.L].char;
    const expected = target.word[selectedIds.length];

    if (ch !== expected) {
      // wrong letter — flash it (and the current selection) red, then reset
      busyRef.current = true;
      setWrongIds(new Set([id, ...selectedIds]));
      setSelectedIds([]);
      buzzWrong();
      window.setTimeout(() => {
        setWrongIds(new Set());
        busyRef.current = false;
      }, 500);
      return;
    }

    const nextSel = [...selectedIds, id];
    setSelectedIds(nextSel);
    tick();
    if (nextSel.length === target.word.length) complete(nextSel);
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
            <span className="pictureEmoji">{target.emoji}</span>
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
          className="blocksBoard"
          style={{ width: boardWidth, height: boardHeight }}
        >
          {board.map((col, c) =>
            col.map((blk, L) => {
              const p = center(c, L);
              return (
                <Block
                  key={blk.id}
                  id={blk.id}
                  char={blk.char}
                  x={p.x - SIZE / 2}
                  y={p.y - SIZE / 2}
                  size={SIZE}
                  state={stateFor(blk.id)}
                  order={selectOrder(blk.id)}
                  hint={hintIds.has(blk.id)}
                  onTap={onTap}
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
