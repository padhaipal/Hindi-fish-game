"use client";

// ---------------------------------------------------------------------------
// POND HOP GAME
// ---------------------------------------------------------------------------
// A frog crosses a river by hopping ONLY on stones showing the target letter.
// The far bank (top) shows the target picture. Stones are scattered across the
// water; the child taps one of the highlighted "reachable" stones (the next row
// up) to make the frog HOP to it along an arc:
//   - correct -> the frog jumps across, its sound is spoken, the stone turns
//     green. Reaching the far bank wins the level.
//   - wrong   -> the frog leaps at the stone, it turns red, and the frog falls
//     in with a splash, so the level restarts.
// A timer bar (as in the fish game) must not run out, or the level restarts.
// Levels use more & smaller stones; finishing links to PadhaiPal.
// ---------------------------------------------------------------------------

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { HOP_LEVELS, TOTAL_HOP_LEVELS } from "@/lib/pondhop/levels";
import { buildHopBoard, HopStone } from "@/lib/pondhop/board";
import { LETTERS, getLetter, letterWordAudio, Letter } from "@/lib/letters";
import LattuIcon from "@/components/shared/LattuIcon";
import {
  playLetterSound,
  playWrongSound,
  playWinSound,
  playLoseSound,
  stopWinLoseSounds,
  unlockAudio,
} from "@/lib/audio";

const PADHAIPAL_URL = "https://wa.me/918528097842";

// Where the frog stands before its first hop (% of the water area).
const START_POS = { x: 50, y: 95 };
// Hop animation length — keep the win/lose timing in step with this.
const HOP_MS = 480;

type Phase = "start" | "intro" | "playing" | "levelComplete" | "lost" | "allDone";

export default function PondHopGame() {
  const [phase, setPhase] = useState<Phase>("start");
  const [level, setLevel] = useState(1);
  const [target, setTarget] = useState<Letter | null>(null);
  const [board, setBoard] = useState<HopStone[][]>([]);
  const [pos, setPos] = useState(-1); // index of the last row hopped onto (-1 = near bank)
  const [frog, setFrog] = useState(START_POS); // frog position (% of water)
  const [hopCount, setHopCount] = useState(0); // bumps each hop to retrigger the arc
  const [frogFell, setFrogFell] = useState(false);
  const [redStoneId, setRedStoneId] = useState<number | null>(null);
  const [splashId, setSplashId] = useState<number | null>(null);
  const [roundId, setRoundId] = useState(0);

  const timerRef = useRef<HTMLDivElement>(null);
  const remainingRef = useRef(0);
  const totalRef = useRef(1);
  const roundOverRef = useRef(false);
  const busyRef = useRef(false);
  const introRef = useRef(-1);
  const letterOrderRef = useRef<string[]>([]);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  useEffect(() => () => clearTimers(), []);

  const isLastLevel = level >= TOTAL_HOP_LEVELS;

  // ---- start (or restart) a level ----------------------------------------
  const startLevel = useCallback((levelNumber: number) => {
    clearTimers();
    const cfg = HOP_LEVELS[levelNumber - 1];
    const targetId = letterOrderRef.current[(levelNumber - 1) % letterOrderRef.current.length];
    const tgt = getLetter(targetId);
    const rows = buildHopBoard(targetId, cfg);

    roundOverRef.current = false;
    busyRef.current = false;
    remainingRef.current = cfg.timeSeconds * 1000;
    totalRef.current = cfg.timeSeconds * 1000;

    setLevel(levelNumber);
    setTarget(tgt);
    setBoard(rows);
    setPos(-1);
    setFrog(START_POS);
    setHopCount(0);
    setFrogFell(false);
    setRedStoneId(null);
    setSplashId(null);
    setPhase("intro"); // frozen; the intro sound unfreezes into "playing"
    setRoundId((r) => r + 1);
  }, []);

  const newGame = useCallback(() => {
    const ids = LETTERS.map((l) => l.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    letterOrderRef.current = ids;
    startLevel(1);
  }, [startLevel]);

  // ---- intro: play the picture+letter prompt, then start the timer -------
  useEffect(() => {
    if (phase !== "intro" || !target) return;
    if (timerRef.current) {
      timerRef.current.style.width = "100%";
      timerRef.current.classList.remove("low");
    }
    if (introRef.current !== roundId) {
      introRef.current = roundId;
      const rid = roundId;
      playLetterSound(letterWordAudio(target.id), () => {
        setPhase((p) => (p === "intro" && rid === roundId ? "playing" : p));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roundId]);

  // ---- the countdown timer bar (runs only while "playing") ---------------
  useEffect(() => {
    if (phase !== "playing") return;
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      if (!last) last = t;
      let dt = (t - last) / 1000;
      last = t;
      if (dt > 0.05) dt = 0.05;

      remainingRef.current -= dt * 1000;
      const pct = Math.max(0, remainingRef.current / totalRef.current);
      if (timerRef.current) {
        timerRef.current.style.width = `${pct * 100}%`;
        timerRef.current.classList.toggle("low", pct < 0.25);
      }
      if (remainingRef.current <= 0) {
        if (!roundOverRef.current) {
          roundOverRef.current = true;
          playLoseSound(); // sad "wa wa wa"
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
      unlockAudio();

      // The frog hops to whichever stone was tapped (right or wrong).
      setFrog({ x: stone.x, y: stone.y });
      setHopCount((h) => h + 1);

      if (stone.isTarget) {
        // CORRECT: speak the letter, the stone turns green, advance.
        playLetterSound(getLetter(stone.letterId).audio);
        const newPos = pos + 1;
        setPos(newPos);

        if (newPos >= board.length - 1) {
          // Reached the far bank -> the level is won (after the hop lands).
          roundOverRef.current = true;
          busyRef.current = true;
          later(() => {
            playWinSound(); // applause
            setPhase(isLastLevel ? "allDone" : "levelComplete");
          }, HOP_MS + 250);
        }
      } else {
        // WRONG: the frog leaps at the stone, it turns red, the frog falls in.
        roundOverRef.current = true;
        busyRef.current = true;
        setRedStoneId(stone.id);
        later(() => {
          setSplashId(stone.id);
          setFrogFell(true);
          playWrongSound(); // the "splash"
        }, HOP_MS - 40);
        later(() => {
          playLoseSound(); // sad "wa wa wa"
          setPhase("lost");
        }, HOP_MS + 450);
      }
    },
    [phase, pos, board, isLastLevel]
  );

  const cfg = HOP_LEVELS[level - 1];
  const activeRow = pos + 1;
  const playing = phase === "playing";

  return (
    <div className="hopApp" style={{ background: cfg.bg }}>
      <Link href="/" className="cornerLink" aria-label="games home">
        🏠
      </Link>
      {phase !== "start" && (
        <div className="blocksLevelPill">
          स्तर {level}/{TOTAL_HOP_LEVELS}
        </div>
      )}

      {/* Timer bar (same as the fish game) */}
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
              {target.id === "la" ? (
                <LattuIcon size={46} />
              ) : (
                <span className="hopTargetEmoji">{target.emoji}</span>
              )}
              <span className="hopTargetChar">{target.char}</span>
            </div>
            <button
              type="button"
              className="soundBtn soundBtn--compact"
              onClick={() => {
                unlockAudio();
                playLetterSound(letterWordAudio(target.id));
              }}
              aria-label="सुनो"
            >
              🔊 सुनो
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
                      width: cfg.stoneSize,
                      height: cfg.stoneSize,
                    }}
                    disabled={!reachable}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      handleStone(rowIndex, stone);
                    }}
                    aria-label={`stone ${getLetter(stone.letterId).char}`}
                  >
                    <span className="hopStoneChar">{getLetter(stone.letterId).char}</span>
                    {stone.id === splashId && <span className="hopSplash">💦</span>}
                  </button>
                );
              })
            )}

            {/* The frog — a single element that hops along an arc between stones. */}
            {!frogFell && (
              <div
                className="hopFrog"
                key={`frog-${roundId}`}
                style={{ left: `${frog.x}%`, top: `${frog.y}%` }}
              >
                <span className="hopFrogBody" key={hopCount}>
                  🐸
                </span>
              </div>
            )}
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
            <div className="overlayTitle">मेंढक की छलांग</div>
            <p style={{ fontSize: 18, color: "#0a3d57", margin: "4px 0 18px" }}>
              सही अक्षर वाले पत्थरों पर कूदकर नदी पार करो
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
            <Link href="/" className="overlayLink">
              🏠 घर
            </Link>
          </div>
        </div>
      )}

      {phase === "levelComplete" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🎉</div>
            <div className="overlayTitle">शाबाश!</div>
            <div style={{ fontSize: 18, color: "#0a3d57", margin: "2px 0 16px" }}>
              स्तर {level} पूरा!
            </div>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                unlockAudio();
                stopWinLoseSounds();
                startLevel(level + 1);
              }}
            >
              ▶ अगला स्तर
            </button>
          </div>
        </div>
      )}

      {phase === "lost" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">💦</div>
            <div className="overlayTitle">फिर कोशिश करो</div>
            <button
              type="button"
              className="bigButton blue"
              onClick={() => {
                unlockAudio();
                stopWinLoseSounds();
                startLevel(level); // restart the SAME level
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
