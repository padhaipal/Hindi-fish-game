"use client";

// ---------------------------------------------------------------------------
// FROG JUMP (POND HOP) — ALfA English
// ---------------------------------------------------------------------------
// A frog crosses a river by hopping ONLY on stones that show the TARGET letter.
// The far bank (top) shows the target's PICTURE (LetterPicture) + a Listen
// button that speaks the picture-word. Each hoppable row holds exactly one
// target-letter stone plus distractors from the same lesson set.
//
//   - correct tap -> the frog hops up a row and we play the letter's SOUND;
//     reaching the far bank finishes a crossing: we speak the word, pick a NEW
//     target letter and send the frog back to the near bank for the next crossing.
//   - wrong tap   -> the stone flashes red (buzzWrong) and the frog STAYS put.
//     There is no drowning and no restart — young children simply try again.
//
// After a handful of crossings the child wins (chimeWin). There is no hard
// timer, on purpose: this is a low-stress, keep-them-happy game.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { getLetter, Letter } from "@/lib/letters";
import { getReadingLesson, READING_LESSONS } from "@/lib/lessons";
import { say, stopSpeech, primeSpeech } from "@/lib/speech";
import { buzzWrong, chimeWin, unlockSfx } from "@/lib/sfx";
import { speakCombo, speakLetterSound } from "@/lib/sound";
import { buildHopBoard, HopStone, HopConfig } from "@/lib/pond/board";
import LetterPicture from "@/components/shared/LetterPicture";
import SpeakerIcon from "@/components/shared/SpeakerIcon";

// Where the frog stands before its first hop (% of the water area).
const START_POS = { x: 50, y: 96 };
// Hop glide length — keep this in step with the CSS .hopFrog transition (0.48s).
const HOP_MS = 480;
// Number of crossings to win (each crossing uses a fresh target letter).
const TOTAL_CROSSINGS = 5;
// Board shape for every crossing.
const CFG: HopConfig = { rows: 4, stonesPerRow: 3 };
const STONE_SIZE = 60;

type Phase = "start" | "playing" | "won";

function shuffleIds(ids: string[]): string[] {
  const a = [...ids];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PondHopGame({ lesson }: { lesson: number }) {
  const readingLesson = getReadingLesson(lesson) ?? READING_LESSONS[0];
  const pool = readingLesson.letters;

  const [phase, setPhase] = useState<Phase>("start");
  const [target, setTarget] = useState<Letter | null>(null);
  const [board, setBoard] = useState<HopStone[][]>([]);
  const [pos, setPos] = useState(-1); // last row hopped onto (-1 = near bank)
  const [frog, setFrog] = useState(START_POS); // frog position (% of water)
  const [hopCount, setHopCount] = useState(0); // bumps each hop to retrigger the arc
  const [redStoneId, setRedStoneId] = useState<number | null>(null);
  const [crossing, setCrossing] = useState(0); // completed crossings so far

  const orderRef = useRef<string[]>([]);
  const busyRef = useRef(false); // true while a hop / transition is animating
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => clearTimers(), []);

  // ---- start a crossing (idx = which completed-crossing we're heading into) --
  const startCrossing = useCallback(
    (idx: number) => {
      const order = orderRef.current;
      const targetId = order[idx % order.length];
      const tgt = getLetter(targetId);
      const rows = buildHopBoard(targetId, pool, CFG);

      busyRef.current = false;
      setTarget(tgt);
      setBoard(rows);
      setPos(-1);
      setFrog(START_POS);
      setRedStoneId(null);
      setCrossing(idx);
      setPhase("playing");

      // Speak the ALfA combo (picture-word then its sound) at the start of each crossing.
      later(() => speakCombo(targetId), 260);
    },
    [pool]
  );

  const newGame = useCallback(() => {
    clearTimers();
    orderRef.current = shuffleIds(pool);
    setHopCount(0);
    startCrossing(0);
  }, [pool, startCrossing]);

  // ---- tap a stone --------------------------------------------------------
  const handleStone = useCallback(
    (rowIndex: number, stone: HopStone) => {
      if (phase !== "playing" || busyRef.current) return;
      const activeRow = pos + 1;
      if (rowIndex !== activeRow) return; // only the reachable (next) row is hoppable

      if (!stone.isTarget) {
        // WRONG: flash the stone red, buzz, and leave the frog where it is.
        buzzWrong();
        setRedStoneId(stone.id);
        later(() => setRedStoneId(null), 450);
        return;
      }

      // CORRECT: the frog hops up onto the tapped stone.
      busyRef.current = true;
      if (target) speakLetterSound(target.id); // the target letter's SOUND
      setFrog({ x: stone.x, y: stone.y });
      setHopCount((h) => h + 1);
      const newPos = pos + 1;
      setPos(newPos);

      if (newPos >= board.length - 1) {
        // Reached the far bank -> this crossing is done.
        const completed = crossing + 1;
        later(() => {
          if (target) say(target.word); // celebrate the finished target word
        }, HOP_MS + 150);
        if (completed >= TOTAL_CROSSINGS) {
          later(() => {
            chimeWin();
            setPhase("won");
          }, HOP_MS + 700);
        } else {
          // Pick a NEW target and send the frog back to the near bank.
          later(() => startCrossing(completed), HOP_MS + 1200);
        }
      } else {
        // More rows to go — free up for the next tap once the hop lands.
        later(() => {
          busyRef.current = false;
        }, HOP_MS);
      }
    },
    [phase, pos, board, crossing, target, startCrossing]
  );

  const activeRow = pos + 1;
  const playing = phase === "playing";

  // Next reading lesson (1,3,5,7,9) after this one, if any.
  const nextLesson = READING_LESSONS.map((l) => l.n).find((n) => n > lesson);

  return (
    <div className="hopApp" style={{ background: readingLesson.bg }}>
      {phase !== "start" && (
        <div className="blocksLevelPill">
          🐸 {Math.min(crossing + 1, TOTAL_CROSSINGS)}/{TOTAL_CROSSINGS}
        </div>
      )}

      {/* The river: far bank (target) at top, scattered stones, near bank below */}
      {phase !== "start" && target && (
        <div className="hopRiver">
          {/* Far bank — the side we're crossing TO — shows the target picture. */}
          <div className="hopBank hopFar">
            <div className="hopTargetCard">
              <LetterPicture letter={target} size={46} className="hopTargetEmoji" />
              <span className="hopTargetChar">{target.char}</span>
            </div>
            <button
              type="button"
              className="soundBtn soundBtn--compact"
              onClick={() => {
                unlockSfx();
                speakCombo(target.id);
              }}
              aria-label={`Listen: ${target.word}`}
            >
              <SpeakerIcon size={22} /> Listen
            </button>
          </div>

          {/* Water — stones + frog are positioned by % within here. */}
          <div className="hopWater">
            {board.map((row, rowIndex) =>
              row.map((stone) => {
                const reachable = rowIndex === activeRow && playing;
                const hopped = stone.isTarget && rowIndex <= pos;
                const isRed = stone.id === redStoneId;
                const cls = [
                  "hopStone",
                  reachable ? "reachable" : rowIndex <= pos ? "past" : "ahead",
                  hopped ? "hopped" : "",
                  isRed ? "wrong" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <button
                    key={stone.id}
                    type="button"
                    className={cls}
                    style={{
                      left: `${stone.x}%`,
                      top: `${stone.y}%`,
                      width: STONE_SIZE,
                      height: STONE_SIZE,
                    }}
                    disabled={!reachable}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      handleStone(rowIndex, stone);
                    }}
                    aria-label={`stone ${getLetter(stone.letterId).char}`}
                  >
                    <span className="hopStoneChar">{getLetter(stone.letterId).char}</span>
                  </button>
                );
              })
            )}

            {/* The frog — a single element that hops along an arc between stones. */}
            <div
              className="hopFrog"
              key={`frog-${crossing}`}
              style={{ left: `${frog.x}%`, top: `${frog.y}%` }}
            >
              <span className="hopFrogBody" key={hopCount}>
                🐸
              </span>
            </div>
          </div>

          {/* Near bank — the grassy start. */}
          <div className="hopBank hopNear" />
        </div>
      )}

      {/* ---- Overlays ---- */}
      {phase === "start" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🐸</div>
            <div className="overlayTitle">Frog Jump</div>
            <p style={{ fontSize: 18, color: "#0a3d57", margin: "4px 0 18px" }}>
              Hop across the river on the stones with the right letter
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
                stopSpeech();
                unlockSfx();
                primeSpeech();
                newGame();
              }}
            >
              ▶ Play again
            </button>
            {nextLesson !== undefined && (
              <a className="overlayLink" href={`/pond/lesson-${nextLesson}`}>
                Next lesson →
              </a>
            )}
            <a className="bigButton blue" href="/" style={{ marginTop: 12 }}>
              🏠 All games
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
