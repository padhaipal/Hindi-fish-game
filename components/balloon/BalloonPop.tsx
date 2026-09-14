"use client";

// ---------------------------------------------------------------------------
// BALLOON POP — a single-letter mini-game (one step of a per-letter adventure).
// ---------------------------------------------------------------------------
// Colourful balloons float up from below the bottom edge, each showing a
// Devanagari letter. The child pops the balloons that show the TARGET letter.
//
// It is deliberately FORGIVING: there is no lose / time-up / exit state. Wrong
// taps just pop with a soft "baaap" and cost nothing. Once the child has popped
// TARGET_COUNT (5) target balloons we call onDone() exactly once and the parent
// adventure takes over — this component owns no navigation or overlays.
//
// Motion is animated the same way as the pond game (components/fish/PondGame):
// each balloon's position lives in a ref, and a single requestAnimationFrame
// loop writes `transform: translate3d(...)` straight to the DOM node (looked up
// via a ref map) so we never re-render on every frame. React state is used only
// to ADD or REMOVE a balloon from the tree.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { LETTERS, getLetter, letterWordAudio } from "@/lib/letters";
import { playLetterSound, playWrongSound, unlockAudio } from "@/lib/audio";

interface Props {
  letterId: string;
  onDone: () => void;
}

// How many TARGET balloons the child must pop to finish this step.
const TARGET_COUNT = 5;
// Cap on-screen balloons so it never gets crowded on a small phone.
const MAX_BALLOONS = 7;
// Share of spawned balloons that show the target letter (rest are distractors),
// so there is (almost) always a target on screen to pop.
const TARGET_SHARE = 0.45;
// Balloon size in px (must match the .bpop-balloon width/height below).
const BALLOON = 72;

// Cheerful, high-contrast balloon fills — the letter is drawn in dark text so it
// stays readable on every one. We rotate through these as balloons spawn.
const COLORS = [
  "#ff6b6b", // red
  "#ffa94d", // orange
  "#ffd43b", // yellow
  "#69db7c", // green
  "#4dabf7", // blue
  "#da77f2", // purple
];

// Internal per-balloon state (lives in a ref, NOT React state). `y` counts up
// from 0 at the bottom; the render maps it to an upward `translate3d`.
interface BalloonMotion {
  id: number;
  char: string;
  isTarget: boolean;
  color: string;
  x: number; // px from the left edge
  y: number; // px risen above the bottom edge
  speed: number; // px per second upward
  sway: number; // horizontal wobble phase
  swayAmp: number; // horizontal wobble amplitude in px
  baseX: number; // x the sway oscillates around
  popping: boolean; // true once tapped — freezes it while the pop plays out
}

// Unique class prefix so the injected @keyframes / styles never collide with
// globals.css or any other component on the page.
const CSS = `
.bpop-root {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100%;
  overflow: hidden;
  touch-action: manipulation;
  background: linear-gradient(180deg, #bce7ff 0%, #e7f7ff 55%, #fff6e0 100%);
  user-select: none;
  -webkit-user-select: none;
}
.bpop-balloon {
  position: absolute;
  left: 0;
  top: 0;
  width: 72px;
  height: 88px;
  padding: 0;
  border: none;
  background: transparent; /* otherwise the <button> shows a grey box */
  will-change: transform;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.bpop-body {
  position: relative;
  width: 72px;
  height: 84px;
  border-radius: 50% 50% 48% 48% / 55% 55% 45% 45%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset -8px -10px 16px rgba(0, 0, 0, 0.18),
    inset 10px 8px 14px rgba(255, 255, 255, 0.55),
    0 4px 8px rgba(0, 0, 0, 0.15);
  transition: transform 0.24s ease-out, opacity 0.24s ease-out;
}
.bpop-shine {
  position: absolute;
  top: 12px;
  left: 15px;
  width: 16px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  filter: blur(1px);
  pointer-events: none;
}
.bpop-knot {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid rgba(0, 0, 0, 0.25);
}
.bpop-string {
  position: absolute;
  top: 88px;
  left: 50%;
  width: 2px;
  height: 22px;
  transform: translateX(-50%);
  background: rgba(90, 90, 90, 0.55);
  border-radius: 2px;
  pointer-events: none;
}
.bpop-char {
  font-size: 34px;
  font-weight: 800;
  line-height: 1;
  color: #1a1330;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
  pointer-events: none;
}
.bpop-pop {
  transform: scale(1.55) !important;
  opacity: 0 !important;
}
.bpop-chip {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  font-size: 20px;
  font-weight: 800;
  color: #0a3d57;
  pointer-events: none;
}
`;

export default function BalloonPop({ letterId, onDone }: Props) {
  // Only React state drives the JSX list; each balloon then animates via refs.
  const [balloons, setBalloons] = useState<BalloonMotion[]>([]);
  const [popped, setPopped] = useState(0);

  // ---- refs used by the animation loop / tap handling --------------------
  const rootRef = useRef<HTMLDivElement>(null);
  const motion = useRef<Map<number, BalloonMotion>>(new Map());
  const els = useRef<Map<number, HTMLButtonElement>>(new Map());
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const idSeq = useRef(0);
  const colorSeq = useRef(0);
  const poppedRef = useRef(0); // target pops so far (avoids stale closures)
  const doneRef = useRef(false); // guards onDone() so it fires at most once
  const introRef = useRef(false); // guards the intro prompt (StrictMode safety)
  const spawnTimer = useRef<number>(0);

  // The target letter's Devanagari char, and the OTHER letters used as
  // distractors — computed once from the id.
  const targetChar = getLetter(letterId).char;
  const distractorChars = LETTERS.filter((l) => l.id !== letterId).map(
    (l) => l.char
  );

  const registerEl = useCallback(
    (id: number, el: HTMLButtonElement | null) => {
      if (el) els.current.set(id, el);
      else els.current.delete(id);
    },
    []
  );

  // ---- spawn a single balloon just below the bottom edge -----------------
  const spawn = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    if (motion.current.size >= MAX_BALLOONS) return;

    const w = root.clientWidth;
    const isTarget = Math.random() < TARGET_SHARE;
    const char = isTarget
      ? targetChar
      : distractorChars[Math.floor(Math.random() * distractorChars.length)];
    const swayAmp = 8 + Math.random() * 16;
    // Keep the balloon fully on screen even at the extremes of its sway.
    const margin = swayAmp + 4;
    const baseX = margin + Math.random() * Math.max(1, w - BALLOON - margin * 2);

    const b: BalloonMotion = {
      id: idSeq.current++,
      char,
      isTarget,
      color: COLORS[colorSeq.current++ % COLORS.length],
      x: baseX,
      // Start a little below the bottom so it floats up into view.
      y: -(BALLOON + 30),
      // Cross the screen in ~6-9s -> speed depends on the height.
      speed: root.clientHeight / (6 + Math.random() * 3),
      sway: Math.random() * Math.PI * 2,
      swayAmp,
      baseX,
      popping: false,
    };
    motion.current.set(b.id, b);
    setBalloons((list) => [...list, b]);
  }, [targetChar, distractorChars]);

  // ---- remove a balloon from the ref map + the React tree ----------------
  const remove = useCallback((id: number) => {
    motion.current.delete(id);
    els.current.delete(id);
    setBalloons((list) => list.filter((b) => b.id !== id));
  }, []);

  // ---- handle a tap (pointerdown) on a balloon ---------------------------
  const handlePop = useCallback(
    (id: number) => {
      const b = motion.current.get(id);
      if (!b || b.popping || doneRef.current) return;
      unlockAudio(); // first gesture unlocks audio on mobile

      b.popping = true; // freeze it in the rAF loop while the pop plays
      const el = els.current.get(id);
      if (el) {
        const body = el.querySelector(".bpop-body");
        if (body) body.classList.add("bpop-pop"); // quick scale-up + fade
      }

      if (b.isTarget) {
        // CORRECT: play the letter sound and count it toward TARGET_COUNT.
        playLetterSound(getLetter(letterId).audio);
        poppedRef.current += 1;
        setPopped(poppedRef.current);
        if (poppedRef.current >= TARGET_COUNT && !doneRef.current) {
          doneRef.current = true;
          // Small beat so the last pop animation is seen before we hand off.
          window.setTimeout(() => onDone(), 260);
        }
      } else {
        // WRONG: soft "baaap", no penalty — the balloon just pops too.
        playWrongSound();
      }

      // Remove after the ~250ms pop animation finishes.
      window.setTimeout(() => remove(id), 250);
    },
    [letterId, onDone, remove]
  );

  // ---- mount: unlock audio, play the intro prompt once, start spawning ----
  useEffect(() => {
    // Guard against React 19 StrictMode's double-mount so the intro plays once.
    if (!introRef.current) {
      introRef.current = true;
      unlockAudio();
      playLetterSound(letterWordAudio(letterId)); // picture+letter prompt
    }

    // Seed a couple of balloons immediately, then keep topping up.
    spawn();
    const kickoff = window.setTimeout(spawn, 500);
    spawnTimer.current = window.setInterval(() => {
      if (!doneRef.current) spawn();
    }, 1100);

    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(spawnTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- the animation loop: float balloons up, write transforms to DOM -----
  useEffect(() => {
    lastRef.current = 0;

    const loop = (t: number) => {
      if (lastRef.current === 0) lastRef.current = t;
      let dt = (t - lastRef.current) / 1000;
      lastRef.current = t;
      if (dt > 0.05) dt = 0.05; // clamp big gaps (tab switch / slow frame)

      const root = rootRef.current;
      if (root) {
        const h = root.clientHeight;
        const gone: number[] = [];

        motion.current.forEach((b) => {
          if (!b.popping) {
            b.y += b.speed * dt; // rise upward
            b.sway += dt * 1.6;
            b.x = b.baseX + Math.sin(b.sway) * b.swayAmp;
          }
          const el = els.current.get(b.id);
          if (el) {
            // y counts up from the bottom, so subtract it from the bottom edge.
            const top = h - b.y;
            el.style.transform = `translate3d(${b.x}px, ${top}px, 0)`;
          }
          // Once fully past the top edge, mark it for removal.
          if (!b.popping && b.y > h + BALLOON + 40) gone.push(b.id);
        });

        for (const id of gone) remove(id);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [remove]);

  // ---- render -------------------------------------------------------------
  return (
    <div className="bpop-root" ref={rootRef}>
      {/* Inject the component's styles + @keyframes once, scoped by prefix. */}
      <style>{CSS}</style>

      {/* Progress chip in the top-right corner. */}
      <div className="bpop-chip" aria-live="polite">
        🎈 {popped}/{TARGET_COUNT}
      </div>

      {balloons.map((b) => (
        <button
          type="button"
          key={b.id}
          className="bpop-balloon"
          ref={(el) => registerEl(b.id, el)}
          onPointerDown={(e) => {
            e.preventDefault();
            handlePop(b.id);
          }}
          aria-label={b.isTarget ? `pop ${b.char}` : b.char}
        >
          <div className="bpop-body" style={{ background: b.color }}>
            <span className="bpop-shine" />
            <span className="bpop-char">{b.char}</span>
            <span className="bpop-knot" />
          </div>
          <span className="bpop-string" />
        </button>
      ))}
    </div>
  );
}
