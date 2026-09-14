"use client";

// ---------------------------------------------------------------------------
// MATRA FISH — a single-MATRA mini-game (one stop of a per-matra adventure).
// ---------------------------------------------------------------------------
// Colourful syllable bubbles drift around the screen, bouncing off the edges.
// Each bubble shows a consonant + a matra (e.g. का, कि, पू). The child taps the
// bubbles that carry the TARGET matra's sign (e.g. all the "ा" ones: का, पा, मा).
//
// It is deliberately FORGIVING: there is no lose / time-up / exit state. A wrong
// tap plays a soft "baaap" and costs nothing. Once the child has caught
// CATCH_COUNT (6) target bubbles we call onDone() exactly once and the parent
// adventure takes over — this component owns no navigation or overlays.
//
// Motion is animated the same way as the balloon / pond games: each bubble's
// position lives in a ref, and a SINGLE requestAnimationFrame loop writes
// `transform: translate3d(...)` straight to the DOM node (looked up via a ref
// map) so we never re-render on every frame. React state is used ONLY to ADD or
// REMOVE a bubble from the tree.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { LETTERS } from "@/lib/letters";
import { getMatra, MATRAS, matraChip, syllable } from "@/lib/matras";
import { speakSyllable, primeTts } from "@/lib/tts";
import { playBingSound, playWrongSound, unlockAudio } from "@/lib/audio";

interface Props {
  matraId: string;
  onDone: () => void;
}

// How many TARGET bubbles the child must catch to finish this step.
const CATCH_COUNT = 6;
// Cap on-screen bubbles so it never gets crowded on a small phone.
const MAX_BUBBLES = 7;
// Share of spawned bubbles that carry the target matra (rest are distractors),
// so there is (almost) always a target on screen to catch.
const TARGET_SHARE = 0.5;
// Bubble diameter in px (must match the .mf-bubble width/height below).
const BUBBLE = 76;

// Cheerful, high-contrast bubble fills — the syllable is drawn in dark text so
// it stays readable on every one. We rotate through these as bubbles spawn.
const COLORS = [
  "#ff8787", // red
  "#ffb26b", // orange
  "#ffd93d", // yellow
  "#7bd88f", // green
  "#5cb8ff", // blue
  "#c792ea", // purple
  "#ff9fb2", // pink
];

// Internal per-bubble state (lives in a ref, NOT React state). Position is the
// bubble's top-left in px; velocity is px/second; it bounces off every edge.
interface BubbleMotion {
  id: number;
  text: string; // the string shown on the bubble (syllable or bare consonant)
  spoken: string; // what to speak when caught (same as text for targets)
  isTarget: boolean;
  color: string;
  x: number; // px from the left edge
  y: number; // px from the top edge
  vx: number; // px per second, horizontal
  vy: number; // px per second, vertical
  popping: boolean; // true once tapped — freezes it while the pop plays out
}

// Unique class prefix so the injected styles never collide with globals.css or
// any other component on the page.
const CSS = `
.mf-root {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100%;
  overflow: hidden;
  touch-action: manipulation;
  background: radial-gradient(120% 120% at 50% 0%, #d7f4ff 0%, #bfe9ff 40%, #a6dcff 100%);
  user-select: none;
  -webkit-user-select: none;
}
.mf-bubble {
  position: absolute;
  left: 0;
  top: 0;
  width: 76px;
  height: 76px;
  padding: 0;
  border: none;
  background: transparent; /* otherwise the <button> shows a grey box */
  will-change: transform;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.mf-body {
  position: relative;
  width: 76px;
  height: 76px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset -9px -11px 18px rgba(0, 0, 0, 0.16),
    inset 11px 9px 15px rgba(255, 255, 255, 0.6),
    0 4px 9px rgba(0, 0, 0, 0.16);
  transition: transform 0.24s ease-out, opacity 0.24s ease-out;
}
.mf-shine {
  position: absolute;
  top: 12px;
  left: 16px;
  width: 18px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.65);
  filter: blur(1px);
  pointer-events: none;
}
.mf-text {
  font-size: 34px;
  font-weight: 800;
  line-height: 1;
  color: #1a1330;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
  pointer-events: none;
}
.mf-pop {
  transform: scale(1.5) !important;
  opacity: 0 !important;
}
.mf-chip {
  position: absolute;
  top: 12px;
  z-index: 5;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 15px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  font-size: 20px;
  font-weight: 800;
  color: #0a3d57;
  pointer-events: none;
}
.mf-goal {
  left: 12px;
}
.mf-goal .mf-goal-sign {
  font-size: 24px;
  color: #c92a2a;
}
.mf-count {
  right: 12px;
}
`;

export default function MatraFish({ matraId, onDone }: Props) {
  const matra = getMatra(matraId);

  // Only React state drives the JSX list; each bubble then animates via refs.
  const [bubbles, setBubbles] = useState<BubbleMotion[]>([]);
  const [caught, setCaught] = useState(0);

  // ---- refs used by the animation loop / tap handling --------------------
  const rootRef = useRef<HTMLDivElement>(null);
  const motion = useRef<Map<number, BubbleMotion>>(new Map());
  const els = useRef<Map<number, HTMLButtonElement>>(new Map());
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const idSeq = useRef(0);
  const colorSeq = useRef(0);
  const caughtRef = useRef(0); // target catches so far (avoids stale closures)
  const doneRef = useRef(false); // guards onDone() so it fires at most once
  const introRef = useRef(false); // guards the mount side-effects (StrictMode)
  const spawnTimer = useRef<number>(0);

  // Matras that are NOT the target — used to build distractor syllables.
  const otherMatras = MATRAS.filter((m) => m.id !== matraId);

  const registerEl = useCallback(
    (id: number, el: HTMLButtonElement | null) => {
      if (el) els.current.set(id, el);
      else els.current.delete(id);
    },
    []
  );

  // ---- build one bubble's text: target syllable, distractor syllable, or,
  //      occasionally, a bare consonant (no matra at all) --------------------
  const makeBubble = useCallback((): {
    text: string;
    spoken: string;
    isTarget: boolean;
  } => {
    const consonant = LETTERS[Math.floor(Math.random() * LETTERS.length)].char;
    const isTarget = Math.random() < TARGET_SHARE;

    if (isTarget) {
      const s = syllable(consonant, matra);
      return { text: s, spoken: s, isTarget: true };
    }

    // ~20% of distractors are the bare consonant (no matra), the rest carry a
    // DIFFERENT matra so the child must spot the target matra's sign.
    if (Math.random() < 0.2 || otherMatras.length === 0) {
      return { text: consonant, spoken: consonant, isTarget: false };
    }
    const other = otherMatras[Math.floor(Math.random() * otherMatras.length)];
    const s = syllable(consonant, other);
    return { text: s, spoken: s, isTarget: false };
  }, [matra, otherMatras]);

  // ---- spawn a single bubble at a random on-screen spot ------------------
  const spawn = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    if (motion.current.size >= MAX_BUBBLES) return;

    const w = root.clientWidth;
    const h = root.clientHeight;
    if (w <= 0 || h <= 0) return;

    const { text, spoken, isTarget } = makeBubble();

    // Random drift speed; direction is random too. ~50-100 px/s keeps a bubble
    // on screen for several seconds between edge bounces.
    const speed = 55 + Math.random() * 55;
    const angle = Math.random() * Math.PI * 2;

    const b: BubbleMotion = {
      id: idSeq.current++,
      text,
      spoken,
      isTarget,
      color: COLORS[colorSeq.current++ % COLORS.length],
      x: Math.random() * Math.max(1, w - BUBBLE),
      y: Math.random() * Math.max(1, h - BUBBLE),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      popping: false,
    };
    motion.current.set(b.id, b);
    setBubbles((list) => [...list, b]);
  }, [makeBubble]);

  // ---- remove a bubble from the ref map + the React tree -----------------
  const remove = useCallback((id: number) => {
    motion.current.delete(id);
    els.current.delete(id);
    setBubbles((list) => list.filter((b) => b.id !== id));
  }, []);

  // ---- handle a tap (pointerdown) on a bubble ----------------------------
  const handleTap = useCallback(
    (id: number) => {
      const b = motion.current.get(id);
      if (!b || b.popping || doneRef.current) return;
      unlockAudio(); // first gesture unlocks audio on mobile

      b.popping = true; // freeze it in the rAF loop while the pop plays
      const el = els.current.get(id);
      if (el) {
        const body = el.querySelector(".mf-body");
        if (body) body.classList.add("mf-pop"); // quick scale-up + fade
      }

      if (b.isTarget) {
        // CORRECT: speak the syllable, play a bright "bing!", count it.
        speakSyllable(b.spoken);
        playBingSound();
        caughtRef.current += 1;
        setCaught(caughtRef.current);
        if (caughtRef.current >= CATCH_COUNT && !doneRef.current) {
          doneRef.current = true;
          // Small beat so the last pop animation is seen before we hand off.
          window.setTimeout(() => onDone(), 280);
        }
      } else {
        // WRONG: soft "baaap", no penalty — the bubble just pops too.
        playWrongSound();
      }

      // Remove after the ~250ms pop animation finishes.
      window.setTimeout(() => remove(id), 250);
    },
    [onDone, remove]
  );

  // ---- mount: unlock audio, prime TTS once, start spawning ---------------
  useEffect(() => {
    // Guard against React 19 StrictMode's double-mount so this runs once.
    if (!introRef.current) {
      introRef.current = true;
      unlockAudio();
      primeTts();
    }

    // Seed a few bubbles immediately, then keep topping up.
    spawn();
    const kick1 = window.setTimeout(spawn, 300);
    const kick2 = window.setTimeout(spawn, 650);
    spawnTimer.current = window.setInterval(() => {
      if (!doneRef.current) spawn();
    }, 950);

    return () => {
      window.clearTimeout(kick1);
      window.clearTimeout(kick2);
      window.clearInterval(spawnTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- the animation loop: drift bubbles, bounce edges, write transforms --
  useEffect(() => {
    lastRef.current = 0;

    const loop = (t: number) => {
      if (lastRef.current === 0) lastRef.current = t;
      let dt = (t - lastRef.current) / 1000;
      lastRef.current = t;
      if (dt > 0.05) dt = 0.05; // clamp big gaps (tab switch / slow frame)

      const root = rootRef.current;
      if (root) {
        const w = root.clientWidth;
        const h = root.clientHeight;

        motion.current.forEach((b) => {
          if (!b.popping) {
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            // Bounce off every edge, keeping the bubble fully on screen.
            const maxX = Math.max(0, w - BUBBLE);
            const maxY = Math.max(0, h - BUBBLE);
            if (b.x <= 0) {
              b.x = 0;
              b.vx = Math.abs(b.vx);
            } else if (b.x >= maxX) {
              b.x = maxX;
              b.vx = -Math.abs(b.vx);
            }
            if (b.y <= 0) {
              b.y = 0;
              b.vy = Math.abs(b.vy);
            } else if (b.y >= maxY) {
              b.y = maxY;
              b.vy = -Math.abs(b.vy);
            }
          }
          const el = els.current.get(b.id);
          if (el) {
            el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
          }
        });
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ---- render -------------------------------------------------------------
  return (
    <div className="mf-root" ref={rootRef}>
      {/* Inject the component's styles once, scoped by the mf- prefix. */}
      <style>{CSS}</style>

      {/* Goal chip: which matra to catch. */}
      <div className="mf-chip mf-goal">
        <span className="mf-goal-sign">{matraChip(matra)}</span>
        <span>वाली पकड़ो</span>
      </div>

      {/* Progress chip: how many caught so far. */}
      <div className="mf-chip mf-count" aria-live="polite">
        🫧 {caught}/{CATCH_COUNT}
      </div>

      {bubbles.map((b) => (
        <button
          type="button"
          key={b.id}
          className="mf-bubble"
          ref={(el) => registerEl(b.id, el)}
          onPointerDown={(e) => {
            e.preventDefault();
            handleTap(b.id);
          }}
          aria-label={b.isTarget ? `पकड़ो ${b.text}` : b.text}
        >
          <div className="mf-body" style={{ background: b.color }}>
            <span className="mf-shine" />
            <span className="mf-text">{b.text}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
