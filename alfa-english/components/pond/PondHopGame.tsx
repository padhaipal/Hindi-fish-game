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
//     reaching the far bank finishes a crossing and (unless it was the last)
//     picks a NEW target letter and sends the frog back for the next crossing.
//   - wrong tap   -> the level is LOST: a sad "wah-wah-wah" plays and a lose
//     overlay offers a fresh try from the very first crossing.
//
// A 20-second countdown runs while the frog is crossing (never during the
// intro speak). Running out of time also loses the level. Each crossing needs
// one more hop than the last (3 → 8), and stones shrink as the rows grow.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { getLetter, Letter } from "@/lib/letters";
import { getReadingLesson, READING_LESSONS } from "@/lib/lessons";
import { primeSpeech } from "@/lib/speech";
import { buzzWrong, unlockSfx } from "@/lib/sfx";
import { speakCombo, speakLetterSound, playApplause, playLose, stopAll } from "@/lib/sound";
import { buildHopBoard, HopStone, HopConfig } from "@/lib/pond/board";
import LetterPicture from "@/components/shared/LetterPicture";
import SpeakerIcon from "@/components/shared/SpeakerIcon";

// Where the frog stands before its first hop (% of the water area).
const START_POS = { x: 50, y: 96 };
// Hop glide length — keep this in step with the CSS .hopFrog transition (0.48s).
const HOP_MS = 480;
// Number of crossings to win (each crossing uses a fresh target letter).
const TOTAL_CROSSINGS = 6;
// Seconds allowed to complete a single crossing.
const TIME_MS = 20000;
// Stones per row (1 target + distractors).
const STONES_PER_ROW = 3;

// Hops needed for a crossing: 3, 4, 5, 6, 7, 8 …
const rowsForCrossing = (idx: number) => 3 + idx;
// Stones shrink as the rows grow so the taller boards still fit the screen.
const stoneSizeForRows = (rows: number) => Math.max(34, 64 - (rows - 3) * 5);

type Phase = "start" | "intro" | "playing" | "lost" | "won";

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
  const [roundId, setRoundId] = useState(0); // bumps at each crossing / restart

  const orderRef = useRef<string[]>([]);
  const busyRef = useRef(false); // true while a hop / transition is animating
  const roundOverRef = useRef(false); // true once the crossing has ended (win/lose)
  const remainingRef = useRef(TIME_MS);
  const timerRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => clearTimers(), []);

  // ---- start a crossing (idx = which crossing we're heading into) ----------
  const startCrossing = useCallback(
    (idx: number) => {
      clearTimers();
      const order = orderRef.current;
      const targetId = order[idx % order.length];
      const tgt = getLetter(targetId);
      const rows = rowsForCrossing(idx);
      const cfg: HopConfig = { rows, stonesPerRow: STONES_PER_ROW };

      busyRef.current = false;
      roundOverRef.current = false;
      remainingRef.current = TIME_MS;

      setTarget(tgt);
      setBoard(buildHopBoard(targetId, pool, cfg));
      setPos(-1);
      setFrog(START_POS);
      setHopCount(0);
      setRedStoneId(null);
      setCrossing(idx);
      setRoundId((r) => r + 1);
      setPhase("intro");

      // Speak the ALfA combo (picture-word then its sound) at the START of the
      // crossing, then unfreeze into "playing" so the timer begins.
      later(() => speakCombo(targetId), 260);
      later(() => setPhase((p) => (p === "intro" ? "playing" : p)), 2000);
    },
    [pool]
  );

  const newGame = useCallback(() => {
    orderRef.current = shuffleIds(pool);
    startCrossing(0);
  }, [pool, startCrossing]);

  // ---- keep the timer bar full while the intro is speaking ----------------
  useEffect(() => {
    if (phase !== "intro") return;
    if (timerRef.current) {
      timerRef.current.style.width = "100%";
      timerRef.current.classList.remove("low");
    }
  }, [phase, roundId]);

  // ---- the 20s countdown bar (runs ONLY while the frog is crossing) -------
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      if (!last) last = t;
      let dt = (t - last) / 1000;
      last = t;
      if (dt > 0.05) dt = 0.05; // clamp long frames (tab was backgrounded)

      if (!roundOverRef.current) remainingRef.current -= dt * 1000;
      const pct = Math.max(0, remainingRef.current / TIME_MS);
      if (timerRef.current) {
        timerRef.current.style.width = `${pct * 100}%`;
        timerRef.current.classList.toggle("low", pct < 0.25);
      }
      if (remainingRef.current <= 0) {
        if (!roundOverRef.current) {
          roundOverRef.current = true;
          clearTimers();
          playLose(); // sad "wah-wah-wah"
          setPhase("lost");
        }
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roundId]);

  // ---- tap a stone --------------------------------------------------------
  const handleStone = useCallback(
    (rowIndex: number, stone: HopStone) => {
      if (phase !== "playing" || busyRef.current || roundOverRef.current) return;
      const activeRow = pos + 1;
      if (rowIndex !== activeRow) return; // only the reachable (next) row is hoppable

      if (!stone.isTarget) {
        // WRONG: the level is lost — flash the stone red, then the lose overlay.
        roundOverRef.current = true;
        busyRef.current = true;
        buzzWrong();
        setRedStoneId(stone.id);
        later(() => {
          playLose();
          setPhase("lost");
        }, 550);
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
        // Reached the far bank -> this crossing is done. (No word re-speak.)
        roundOverRef.current = true;
        const completed = crossing + 1;
        if (completed >= TOTAL_CROSSINGS) {
          later(() => {
            playApplause(); // clapping
            setPhase("won");
          }, HOP_MS + 500);
        } else {
          // Pick a NEW target and send the frog back to the near bank.
          later(() => startCrossing(completed), HOP_MS + 900);
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
  const stoneSize = stoneSizeForRows(board.length || 3);

  // Next reading lesson (1,3,5,7,9) after this one, if any.
  const nextLesson = READING_LESSONS.map((l) => l.n).find((n) => n > lesson);

  return (
    <div className="hopApp" style={{ background: readingLesson.bg }}>
      {phase !== "start" && (
        <div className="blocksLevelPill">
          🐸 {Math.min(crossing + 1, TOTAL_CROSSINGS)}/{TOTAL_CROSSINGS}
        </div>
      )}

      {/* Countdown timer bar */}
      {phase !== "start" && (
        <div className="timerWrap hopTimer">
          <div className="timerFill" ref={timerRef} style={{ width: "100%" }} />
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
                      width: stoneSize,
                      height: stoneSize,
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
              key={`frog-${roundId}`}
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

      {phase === "lost" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">😅</div>
            <div className="overlayTitle">Oops!</div>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                stopAll();
                unlockSfx();
                primeSpeech();
                newGame();
              }}
            >
              Try again
            </button>
            <a className="bigButton blue" href="/" style={{ marginTop: 12 }}>
              🏠 All games
            </a>
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
                stopAll();
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
