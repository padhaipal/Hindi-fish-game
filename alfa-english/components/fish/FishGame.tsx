"use client";

// ---------------------------------------------------------------------------
// FISH GAME (ALfA English) — catch ALL the fish with the right letter.
// ---------------------------------------------------------------------------
// Pedagogy: the child is shown a PICTURE they know (an apple) and hears the
// word then its sound ("apple … /a/"). They must catch the fish showing the
// letter that word starts with (a) — i.e. they map the SOUND to the letter,
// never the letter's name.
//
// Game flow:
//   1. "start"   — big Play button (unlocks audio + speech on the first tap).
//   2. "playing" — the game runs one ROUND per letter in the lesson. Each round
//                  targets a different letter (the lesson's letters, shuffled).
//                  Several fish swim; some carry the target letter and the rest
//                  carry other lesson letters. The child must catch EVERY target
//                  fish to finish the round and move on to the next target. The
//                  pond grows (3 fish up to 7) as the rounds progress.
//   3. "won"     — trophy overlay after the last round: Play again / All games /
//                  Next lesson.
//
// Speech (see lib/sound):
//   - round start        -> speakCombo(targetId)  (picture-word then its sound)
//   - catch a TARGET fish -> speakLetterSound(targetId)  (the letter's sound)
//   - catch a WRONG fish  -> buzzWrong() + a shake; play continues.
//
// Fish motion (position + swivel + bounce) is animated with requestAnimationFrame
// writing transforms straight to the DOM, so we never re-render per frame.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Fish from "./Fish";
import { buildFish, FishSpec, shuffle } from "@/lib/fish/round";
import { getLetter, Letter } from "@/lib/letters";
import { getReadingLesson, READING_LESSONS } from "@/lib/lessons";
import LetterPicture from "@/components/shared/LetterPicture";
import SpeakerIcon from "@/components/shared/SpeakerIcon";
import { buzzWrong, unlockSfx } from "@/lib/sfx";
import {
  speakCombo,
  speakLetterSound,
  playApplause,
  playLose,
  stopAll,
} from "@/lib/sound";
import { primeSpeech } from "@/lib/speech";

// Must match the .fish width/height in globals.css.
const FISH = 88;
// How close two fish centres may get before they bounce off each other.
const COLLIDE_DIST = 60;
// Base swim speed (pixels per second).
const SPEED = 46;
// Pond starts at this many fish and grows one per round, capped so it never
// gets crowded (the target-fish table only goes up to 7).
const MIN_FISH = 3;
const MAX_FISH = 7;

// Per-round countdown length (seconds). The timer bar drains over this time and
// the round is LOST when it reaches 0.
const ROUND_SECONDS = 20;
// Lose the round after this many wrong (non-target) taps.
const MAX_WRONG = 3;

// Phases:
//   start   — big Play button.
//   intro   — fish placed but FROZEN, timer not running, while the target
//             word+sound plays. Unfreezes to "playing" when it finishes.
//   playing — fish swim, the countdown timer runs.
//   lost    — timer ran out or 3 wrong taps: Try again (this round) / All games.
//   won     — the last round was cleared: applause + trophy overlay.
type Phase = "start" | "intro" | "playing" | "lost" | "won";

// Why a round was lost — changes the lose overlay's emoji.
type LoseReason = "time" | "wrong";

interface Motion {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bob: number;
  facing: string;
}

interface Burst {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

// CSS transform that swivels a fish to face its heading. The graphic points
// right by default; swimming left we mirror it so it stays upright.
function facingTransform(vx: number, vy: number): string {
  const deg = (Math.atan2(vy, vx) * 180) / Math.PI;
  if (vx >= 0) return `rotate(${deg}deg)`;
  return `scaleX(-1) rotate(${180 - deg}deg)`;
}

export default function FishGame({
  lesson,
  onFinish,
}: {
  lesson: number;
  onFinish?: () => void;
}) {
  // The lesson's letter pool (fall back to the first reading lesson).
  const pool = (getReadingLesson(lesson) ?? READING_LESSONS[0]).letters;
  // One round per letter in the lesson.
  const totalRounds = pool.length;

  // The next reading lesson (for the "Next lesson" link), if any.
  const lessonIdx = READING_LESSONS.findIndex((l) => l.n === lesson);
  const nextLessonN =
    lessonIdx >= 0 && lessonIdx < READING_LESSONS.length - 1
      ? READING_LESSONS[lessonIdx + 1].n
      : null;

  const [phase, setPhase] = useState<Phase>("start");
  const [fish, setFish] = useState<FishSpec[]>([]);
  const [target, setTarget] = useState<Letter | null>(null);
  const [roundNum, setRoundNum] = useState(1);
  const [caughtTargets, setCaughtTargets] = useState(0);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [roundId, setRoundId] = useState(0);
  const [loseReason, setLoseReason] = useState<LoseReason>("time");

  // ---- refs used by the animation loop / tap handling --------------------
  const pondRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLDivElement>(null); // the .timerFill countdown bar
  const fishEls = useRef<Map<number, HTMLButtonElement>>(new Map());
  const fishGraphics = useRef<Map<number, HTMLSpanElement>>(new Map());
  const motion = useRef<Map<number, Motion>>(new Map());
  const caughtRef = useRef<Set<number>>(new Set());
  const targetRef = useRef<Letter | null>(null);
  const caughtTargetsRef = useRef(0);
  const targetsNeededRef = useRef(1);
  const roundIndexRef = useRef(0); // 0-based index into letterOrderRef
  const letterOrderRef = useRef<string[]>([]); // lesson letters, shuffled per game
  const fishIdSeq = useRef(0); // fresh ids each round (fish count changes)
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const burstSeq = useRef(0);
  const remainingRef = useRef(ROUND_SECONDS * 1000); // ms left on the timer
  const totalTimeRef = useRef(ROUND_SECONDS * 1000); // ms the timer started at
  const wrongTapsRef = useRef(0); // wrong taps this round (for the loss)
  const roundOverRef = useRef(false); // true once the round is won or lost
  const currentRoundRef = useRef(0); // roundId the intro effect is running for
  const introDoneForRound = useRef(-1); // ensures the intro speaks once per round
  const introTimerRef = useRef<number>(0); // the intro-freeze -> playing timeout
  const introComboTimerRef = useRef<number>(0); // delayed speakCombo at round start
  const nextComboDelayRef = useRef(0); // ms to wait before the next round's combo

  const registerRoot = useCallback((id: number, el: HTMLButtonElement | null) => {
    if (el) fishEls.current.set(id, el);
    else fishEls.current.delete(id);
  }, []);
  const registerGraphic = useCallback(
    (id: number, el: HTMLSpanElement | null) => {
      if (el) fishGraphics.current.set(id, el);
      else fishGraphics.current.delete(id);
    },
    []
  );

  // ---- start a round (by 0-based index into the shuffled letter order) ----
  const startRound = useCallback(
    (index: number) => {
      const order = letterOrderRef.current;
      const targetId = order[index % order.length];
      const t = getLetter(targetId);
      // Pond grows one fish per round, capped so it stays solvable.
      const count = Math.min(MIN_FISH + index, MAX_FISH);
      const specs = buildFish(pool, targetId, count, fishIdSeq.current);
      fishIdSeq.current += specs.length;

      targetRef.current = t;
      roundIndexRef.current = index;
      caughtRef.current = new Set();
      caughtTargetsRef.current = 0;
      targetsNeededRef.current = specs.filter((f) => f.isTarget).length;
      wrongTapsRef.current = 0;
      roundOverRef.current = false;
      remainingRef.current = ROUND_SECONDS * 1000;
      totalTimeRef.current = ROUND_SECONDS * 1000;
      lastRef.current = 0;
      fishEls.current = new Map();
      fishGraphics.current = new Map();
      motion.current = new Map();

      setTarget(t);
      setFish(specs);
      setRoundNum(index + 1);
      setCaughtTargets(0);
      setPhase("intro"); // start FROZEN; the intro word+sound will unfreeze it
      setRoundId((r) => r + 1);
    },
    [pool]
  );

  // ---- start a brand-new game --------------------------------------------
  // Reshuffle the lesson's letters (so each round's target is random per
  // player), then begin at the first round.
  const newGame = useCallback(() => {
    letterOrderRef.current = shuffle([...pool]);
    fishIdSeq.current = 0;
    startRound(0);
  }, [pool, startRound]);

  // ---- place fish (FROZEN) + speak the target combo, each new round -------
  // Runs once per round while the board is in the "intro" phase: the fish are
  // positioned but not yet moving and the timer is not running. The target
  // word+sound plays, and when it finishes we switch to "playing" so the fish
  // start swimming and the countdown begins.
  useLayoutEffect(() => {
    const pond = pondRef.current;
    if (!pond) return;
    currentRoundRef.current = roundId;

    const rect = pond.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;

    const placed: { cx: number; cy: number }[] = [];
    const m = new Map<number, Motion>();
    for (const f of fish) {
      let x = 0;
      let y = 0;
      for (let tries = 0; tries < 30; tries++) {
        x = Math.random() * Math.max(1, W - FISH);
        y = Math.random() * Math.max(1, H - FISH);
        const cx = x + FISH / 2;
        const cy = y + FISH / 2;
        const clash = placed.some(
          (p) => Math.hypot(p.cx - cx, p.cy - cy) < COLLIDE_DIST
        );
        if (!clash) break;
      }
      placed.push({ cx: x + FISH / 2, cy: y + FISH / 2 });
      const angle = Math.random() * Math.PI * 2;
      m.set(f.id, {
        x,
        y,
        vx: Math.cos(angle) * SPEED,
        vy: Math.sin(angle) * SPEED,
        bob: Math.random() * Math.PI * 2,
        facing: "",
      });
    }
    motion.current = m;

    // Apply initial position + facing.
    motion.current.forEach((fm, id) => {
      const el = fishEls.current.get(id);
      if (el) el.style.transform = `translate3d(${fm.x}px, ${fm.y}px, 0)`;
      const g = fishGraphics.current.get(id);
      if (g) {
        fm.facing = facingTransform(fm.vx, fm.vy);
        g.style.transform = fm.facing;
      }
    });

    // Reset the timer bar to full for the frozen intro.
    if (timerRef.current) {
      timerRef.current.style.width = "100%";
      timerRef.current.classList.remove("low");
    }

    // Speak the target combo (picture-word then its sound) once as the round
    // begins, then unfreeze into "playing". speakCombo has no onEnd hook here,
    // so we unfreeze after a fixed delay that covers the word+sound.
    //
    // When advancing from a previous round, nextComboDelayRef holds a ~1s pause
    // so the just-caught letter's sound doesn't clash with this round's combo.
    if (introDoneForRound.current !== roundId) {
      introDoneForRound.current = roundId;
      const comboDelay = nextComboDelayRef.current;
      nextComboDelayRef.current = 0;
      window.clearTimeout(introComboTimerRef.current);
      introComboTimerRef.current = window.setTimeout(() => {
        if (currentRoundRef.current === roundId && targetRef.current) {
          speakCombo(targetRef.current.id);
        }
      }, comboDelay);
      window.clearTimeout(introTimerRef.current);
      introTimerRef.current = window.setTimeout(() => {
        if (currentRoundRef.current === roundId) setPhase("playing");
      }, 1800 + comboDelay);
    }

    return () => {
      window.clearTimeout(introTimerRef.current);
      window.clearTimeout(introComboTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId]);

  // ---- spawn a coin/star reward burst ------------------------------------
  const spawnBurst = useCallback((x: number, y: number) => {
    const id = burstSeq.current++;
    const emoji = id % 2 === 0 ? "🪙" : "⭐";
    setBursts((b) => [...b, { id, x, y, emoji }]);
    window.setTimeout(() => {
      setBursts((b) => b.filter((item) => item.id !== id));
    }, 800);
  }, []);

  // ---- handle a tap on a fish --------------------------------------------
  const handleTap = useCallback(
    (spec: FishSpec, el: HTMLButtonElement) => {
      // Only respond while actually playing (ignore taps during the frozen
      // intro, overlays, or once the round is already won/lost).
      if (phase !== "playing" || roundOverRef.current) return;
      const t = targetRef.current;
      if (!t) return;
      if (caughtRef.current.has(spec.id)) return;

      if (spec.isTarget) {
        // CORRECT: splash the fish, play the letter's SOUND, reward.
        caughtRef.current.add(spec.id);
        el.classList.add("caught");
        speakLetterSound(t.id);

        const m = motion.current.get(spec.id);
        if (m) spawnBurst(m.x + FISH / 2, m.y);

        caughtTargetsRef.current += 1;
        setCaughtTargets(caughtTargetsRef.current);

        // All target fish caught -> round complete (you win this round).
        if (caughtTargetsRef.current >= targetsNeededRef.current) {
          roundOverRef.current = true; // stops the timer from flipping to a loss
          const isLast = roundIndexRef.current >= totalRounds - 1;
          window.setTimeout(() => {
            if (isLast) {
              // Finished the last round -> big applause + trophy.
              playApplause();
              setPhase("won");
            } else {
              // Advance to the next round (no applause between rounds).
              // Pause ~1s so this catch's sound doesn't clash with the next
              // round's picture-word combo.
              nextComboDelayRef.current = 1000;
              startRound(roundIndexRef.current + 1);
            }
          }, 550);
        }
      } else {
        // WRONG: the fish stays and shakes.
        el.classList.add("shake");
        window.setTimeout(() => el.classList.remove("shake"), 450);

        wrongTapsRef.current += 1;
        if (wrongTapsRef.current >= MAX_WRONG) {
          // Too many wrong taps -> the round is LOST.
          roundOverRef.current = true;
          setLoseReason("wrong");
          playLose();
          window.setTimeout(() => setPhase("lost"), 400);
        } else {
          buzzWrong();
        }
      }
    },
    [phase, spawnBurst, startRound, totalRounds]
  );

  // ---- the animation loop (runs only while "playing") --------------------
  useEffect(() => {
    if (phase !== "playing") return;
    lastRef.current = 0;

    const loop = (t: number) => {
      if (lastRef.current === 0) lastRef.current = t;
      let dt = (t - lastRef.current) / 1000;
      lastRef.current = t;
      if (dt > 0.05) dt = 0.05;

      const pond = pondRef.current;
      if (pond) {
        const w = pond.clientWidth;
        const h = pond.clientHeight;

        const ids: number[] = [];
        motion.current.forEach((_, id) => {
          if (!caughtRef.current.has(id)) ids.push(id);
        });

        // 1) Move + bounce off the walls.
        for (const id of ids) {
          const m = motion.current.get(id)!;
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          if (m.x <= 0) {
            m.x = 0;
            m.vx = Math.abs(m.vx);
          } else if (m.x >= w - FISH) {
            m.x = w - FISH;
            m.vx = -Math.abs(m.vx);
          }
          if (m.y <= 0) {
            m.y = 0;
            m.vy = Math.abs(m.vy);
          } else if (m.y >= h - FISH) {
            m.y = h - FISH;
            m.vy = -Math.abs(m.vy);
          }
        }

        // 2) Bounce fish off each other (equal-mass elastic).
        for (let i = 0; i < ids.length; i++) {
          for (let j = i + 1; j < ids.length; j++) {
            const a = motion.current.get(ids[i])!;
            const b = motion.current.get(ids[j])!;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0 && dist < COLLIDE_DIST) {
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = (COLLIDE_DIST - dist) / 2;
              a.x -= nx * overlap;
              a.y -= ny * overlap;
              b.x += nx * overlap;
              b.y += ny * overlap;
              const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
              if (rel < 0) {
                a.vx += rel * nx;
                a.vy += rel * ny;
                b.vx -= rel * nx;
                b.vy -= rel * ny;
              }
            }
          }
        }

        // 3) Clamp inside walls, then write transforms.
        for (const id of ids) {
          const m = motion.current.get(id)!;
          if (m.x < 0) m.x = 0;
          else if (m.x > w - FISH) m.x = w - FISH;
          if (m.y < 0) m.y = 0;
          else if (m.y > h - FISH) m.y = h - FISH;

          m.bob += dt * 3;
          const el = fishEls.current.get(id);
          if (el) {
            el.style.transform = `translate3d(${m.x}px, ${
              m.y + Math.sin(m.bob) * 3
            }px, 0)`;
          }
          const g = fishGraphics.current.get(id);
          if (g) {
            const f = facingTransform(m.vx, m.vy);
            if (f !== m.facing) {
              m.facing = f;
              g.style.transform = f;
            }
          }
        }
      }

      // Countdown timer bar (drains from 100% to 0 over ROUND_SECONDS).
      remainingRef.current -= dt * 1000;
      const pct = Math.max(0, remainingRef.current / totalTimeRef.current);
      if (timerRef.current) {
        timerRef.current.style.width = `${pct * 100}%`;
        if (pct < 0.25) timerRef.current.classList.add("low");
        else timerRef.current.classList.remove("low");
      }

      // Time ran out -> the round is LOST.
      if (remainingRef.current <= 0 && !roundOverRef.current) {
        roundOverRef.current = true;
        setLoseReason("time");
        playLose(); // wah-wah-wah
        setPhase("lost");
        return; // stop the loop; the overlay takes over
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId, phase]);

  // Stop any speech/audio if we leave the game.
  useEffect(() => () => stopAll(), []);

  const targetsNeeded = fish.filter((f) => f.isTarget).length;

  return (
    <div className="app">
      {/* Top bar: target fish caught + which round */}
      <div className="topbar">
        <div className="scorePill">
          <span>🐟</span>
          <span>
            {caughtTargets}/{targetsNeeded}
          </span>
        </div>
        <div className="levelPill">
          📖 {lesson} · {roundNum}/{totalRounds}
        </div>
      </div>

      {/* Target: the picture + a Listen button (no letter shown — that's the game!) */}
      {target && (
        <div className="target">
          <div className="targetLabel">Catch this sound</div>
          <div className="targetRow">
            <div className="wordPic" aria-label={target.word}>
              <LetterPicture letter={target} size={78} className="wordEmoji" />
            </div>
          </div>
          <button
            type="button"
            className="targetSound"
            onClick={() => {
              unlockSfx();
              if (targetRef.current) speakCombo(targetRef.current.id);
            }}
            aria-label="listen to the target word"
          >
            <SpeakerIcon /> Listen
          </button>
        </div>
      )}

      {/* Countdown timer bar (driven by the RAF loop while playing) */}
      <div className="timerWrap">
        <div className="timerFill" ref={timerRef} style={{ width: "100%" }} />
      </div>

      {/* Pond with fish */}
      <div className="pond" ref={pondRef}>
        {fish.map((spec) => (
          <Fish
            key={spec.id}
            spec={spec}
            registerRoot={registerRoot}
            registerGraphic={registerGraphic}
            onTap={handleTap}
          />
        ))}

        {bursts.map((b) => (
          <span key={b.id} className="burst" style={{ left: b.x, top: b.y }}>
            {b.emoji}
          </span>
        ))}
      </div>

      {/* ---- Overlays ---- */}
      {phase === "start" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🐟🎣</div>
            <div className="overlayTitle">Fish Game</div>
            <p style={{ fontSize: 18, color: "#0a3d57", margin: "4px 0 18px" }}>
              Catch the fish with the right letter
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
            <div className="overlayEmoji">
              {loseReason === "wrong" ? "😅" : "⏳"}
            </div>
            <div className="overlayTitle">Try again</div>
            <button
              type="button"
              className="bigButton blue"
              onClick={() => {
                stopAll(); // cut the wah-wah-wah the instant they tap
                unlockSfx();
                primeSpeech();
                // Restart the CURRENT round.
                startRound(roundIndexRef.current);
              }}
            >
              🔁 Try again
            </button>
            <a
              className="bigButton"
              href="/"
              style={{ marginTop: 12 }}
              onClick={() => stopAll()}
            >
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
            <div className="overlayStars">⭐⭐⭐</div>
            {onFinish ? (
              // Embedded in a lesson flow: a single Continue hands control back.
              <button
                type="button"
                className="bigButton"
                onClick={() => {
                  stopAll(); // cut the applause the instant they tap
                  onFinish();
                }}
              >
                ▶ Continue
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="bigButton"
                  onClick={() => {
                    stopAll(); // cut the applause the instant they tap
                    unlockSfx();
                    primeSpeech();
                    newGame();
                  }}
                >
                  ▶ Play again
                </button>
                {nextLessonN !== null && (
                  <a
                    className="bigButton blue"
                    href={`/fish/lesson-${nextLessonN}`}
                    style={{ marginTop: 12 }}
                    onClick={() => stopAll()}
                  >
                    Next lesson →
                  </a>
                )}
                <a
                  className="bigButton"
                  href="/"
                  style={{ marginTop: 12 }}
                  onClick={() => stopAll()}
                >
                  🏠 All games
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
