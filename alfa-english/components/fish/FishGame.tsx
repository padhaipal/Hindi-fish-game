"use client";

// ---------------------------------------------------------------------------
// FISH GAME (ALfA English) — catch the fish with the right letter.
// ---------------------------------------------------------------------------
// Pedagogy: the child is shown a PICTURE they know (an apple) and hears the
// word ("apple"). They must catch a fish showing the letter that word starts
// with (a) — i.e. they map the SOUND to the letter, never the letter's name.
//
// Round flow:
//   1. "start"   — big Play button (unlocks audio + speech on the first tap).
//   2. "playing" — a target picture is shown; fish swim; the target word is
//                  spoken once. Tapping the target letter's fish = a catch:
//                  it splashes away, the word replays, the next target appears.
//                  A wrong fish just shakes. After 6 catches you win.
//   3. "won"     — trophy overlay with Play again / All games / Next lesson.
//
// Fish motion (position + swivel + bounce) is animated with requestAnimationFrame
// writing transforms straight to the DOM, so we never re-render per frame.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Fish from "./Fish";
import { buildLetterIds, FishSpec, randomColor } from "@/lib/fish/round";
import { getLetter, Letter } from "@/lib/letters";
import { getReadingLesson, READING_LESSONS } from "@/lib/lessons";
import LetterPicture from "@/components/shared/LetterPicture";
import SpeakerIcon from "@/components/shared/SpeakerIcon";
import {
  dingCorrect,
  buzzWrong,
  chimeWin,
  unlockSfx,
} from "@/lib/sfx";
import { say, stopSpeech, primeSpeech } from "@/lib/speech";

// Must match the .fish width/height in globals.css.
const FISH = 88;
// How close two fish centres may get before they bounce off each other.
const COLLIDE_DIST = 60;
// Fish in the pond at once (5–7 keeps it lively but not crowded).
const FISH_COUNT = 6;
// Target fish per pond (so it is always catchable, and quick to find).
const TARGET_FISH = 2;
// Catch this many correct targets to win the round.
const GOAL = 6;
// Base swim speed (pixels per second).
const SPEED = 46;

type Phase = "start" | "playing" | "won";

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

export default function FishGame({ lesson }: { lesson: number }) {
  // The lesson's letter pool (fall back to the first reading lesson).
  const pool = (getReadingLesson(lesson) ?? READING_LESSONS[0]).letters;

  // The next reading lesson (for the "Next lesson" link), if any.
  const lessonIdx = READING_LESSONS.findIndex((l) => l.n === lesson);
  const nextLessonN =
    lessonIdx >= 0 && lessonIdx < READING_LESSONS.length - 1
      ? READING_LESSONS[lessonIdx + 1].n
      : null;

  const [phase, setPhase] = useState<Phase>("start");
  const [fish, setFish] = useState<FishSpec[]>([]);
  const [target, setTarget] = useState<Letter | null>(null);
  const [caughtCount, setCaughtCount] = useState(0);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [roundId, setRoundId] = useState(0);

  // ---- refs used by the animation loop / tap handling --------------------
  const pondRef = useRef<HTMLDivElement>(null);
  const fishEls = useRef<Map<number, HTMLButtonElement>>(new Map());
  const fishGraphics = useRef<Map<number, HTMLSpanElement>>(new Map());
  const motion = useRef<Map<number, Motion>>(new Map());
  const caughtRef = useRef<Set<number>>(new Set());
  const colorRef = useRef<Map<number, string>>(new Map());
  const targetRef = useRef<Letter | null>(null);
  const acceptRef = useRef(false); // ignore taps during a catch transition
  const caughtCountRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const burstSeq = useRef(0);

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

  // Build a fresh set of fish specs (stable ids 0..FISH_COUNT-1) whose letters
  // guarantee the target letter is present.
  const buildFish = useCallback(
    (targetId: string): FishSpec[] => {
      const letterIds = buildLetterIds(pool, targetId, FISH_COUNT, TARGET_FISH);
      return letterIds.map((letterId, i) => {
        let color = colorRef.current.get(i);
        if (!color) {
          color = randomColor();
          colorRef.current.set(i, color);
        }
        return { id: i, letterId, char: letterId, color };
      });
    },
    [pool]
  );

  // Pick a target letter from the pool, avoiding an immediate repeat.
  const pickTarget = useCallback(
    (avoidId?: string): Letter => {
      const choices = pool.filter((id) => id !== avoidId);
      const src = choices.length ? choices : pool;
      return getLetter(src[Math.floor(Math.random() * src.length)]);
    },
    [pool]
  );

  // ---- start a brand-new round -------------------------------------------
  const newRound = useCallback(() => {
    const first = pickTarget();
    targetRef.current = first;
    caughtRef.current = new Set();
    caughtCountRef.current = 0;
    acceptRef.current = true;
    lastRef.current = 0;

    setTarget(first);
    setCaughtCount(0);
    setFish(buildFish(first.id));
    setPhase("playing");
    setRoundId((r) => r + 1);
  }, [buildFish, pickTarget]);

  // ---- place fish + speak the target once, each new round ----------------
  useLayoutEffect(() => {
    if (phase !== "playing") return;
    const pond = pondRef.current;
    if (!pond) return;

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

    // Speak the target word once as the round begins.
    if (targetRef.current) say(targetRef.current.word);
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

  // Move a fish (by id) to a fresh random spot and apply it immediately, so a
  // revived (recycled) fish never flashes at its old position.
  const repositionFish = useCallback((id: number) => {
    const pond = pondRef.current;
    if (!pond) return;
    const W = pond.clientWidth;
    const H = pond.clientHeight;
    const x = Math.random() * Math.max(1, W - FISH);
    const y = Math.random() * Math.max(1, H - FISH);
    const angle = Math.random() * Math.PI * 2;
    const fm: Motion = {
      x,
      y,
      vx: Math.cos(angle) * SPEED,
      vy: Math.sin(angle) * SPEED,
      bob: Math.random() * Math.PI * 2,
      facing: "",
    };
    motion.current.set(id, fm);
    const el = fishEls.current.get(id);
    if (el) el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    const g = fishGraphics.current.get(id);
    if (g) {
      fm.facing = facingTransform(fm.vx, fm.vy);
      g.style.transform = fm.facing;
    }
  }, []);

  // ---- handle a tap on a fish --------------------------------------------
  const handleTap = useCallback(
    (spec: FishSpec, el: HTMLButtonElement) => {
      if (!acceptRef.current) return;
      const t = targetRef.current;
      if (!t) return;
      if (caughtRef.current.has(spec.id)) return;

      if (spec.letterId === t.id) {
        // CORRECT: splash the fish, replay the word, reward, next target.
        acceptRef.current = false;
        caughtRef.current.add(spec.id);
        el.classList.add("caught");
        dingCorrect();
        say(t.word);

        const m = motion.current.get(spec.id);
        if (m) spawnBurst(m.x + FISH / 2, m.y);

        caughtCountRef.current += 1;
        const done = caughtCountRef.current;
        setCaughtCount(done);

        if (done >= GOAL) {
          // Round complete — celebrate.
          window.setTimeout(() => {
            chimeWin();
            setPhase("won");
          }, 500);
          return;
        }

        // Advance to the next target after the splash finishes.
        window.setTimeout(() => {
          const next = pickTarget(t.id);
          targetRef.current = next;

          // Revive the caught fish at a new spot and rebuild the pond's letters
          // so the new target is present.
          repositionFish(spec.id);
          el.classList.remove("caught");
          caughtRef.current.delete(spec.id);

          setTarget(next);
          setFish(buildFish(next.id));
          say(next.word);
          acceptRef.current = true;
        }, 500);
      } else {
        // WRONG: the fish stays and shakes.
        buzzWrong();
        el.classList.add("shake");
        window.setTimeout(() => el.classList.remove("shake"), 450);
      }
    },
    [buildFish, pickTarget, repositionFish, spawnBurst]
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

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId, phase]);

  // Stop any speech if we leave the game.
  useEffect(() => () => stopSpeech(), []);

  const progressPct = Math.min(100, (caughtCount / GOAL) * 100);

  return (
    <div className="app">
      {/* Top bar: catches + lesson */}
      <div className="topbar">
        <div className="scorePill">
          <span>🐟</span>
          <span>
            {caughtCount}/{GOAL}
          </span>
        </div>
        <div className="levelPill">📖 {lesson}</div>
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
              if (targetRef.current) say(targetRef.current.word);
            }}
            aria-label="listen to the target word"
          >
            <SpeakerIcon /> Listen
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="timerWrap">
        <div className="timerFill" style={{ width: `${progressPct}%` }} />
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
                newRound();
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
            <div className="overlayStars">⭐⭐⭐</div>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                unlockSfx();
                primeSpeech();
                newRound();
              }}
            >
              ▶ Play again
            </button>
            {nextLessonN !== null && (
              <a
                className="bigButton blue"
                href={`/fish/lesson-${nextLessonN}`}
                style={{ marginTop: 12 }}
              >
                Next lesson →
              </a>
            )}
            <a className="bigButton" href="/" style={{ marginTop: 12 }}>
              🏠 All games
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
