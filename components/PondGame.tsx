"use client";

// ---------------------------------------------------------------------------
// POND GAME — the whole game screen.
// ---------------------------------------------------------------------------
// Responsibilities:
//   - build a round from the current level (target letter + fish)
//   - animate the fish around the pond (requestAnimationFrame, direct DOM writes)
//   - run the countdown timer bar
//   - handle taps: correct -> splash + sound + reward; wrong -> shake + "baaap"
//   - show start / level-complete / time-up overlays and advance levels
//
// The game logic is intentionally kept readable. Movement uses refs (not React
// state) so we never re-render on every animation frame — important for keeping
// things smooth on low-end phones.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import Fish from "./Fish";
import { buildRound, FishSpec, RoundPlan } from "@/lib/round";
import { getLevelConfig, LevelConfig, TOTAL_LEVELS } from "@/lib/levels";
import { getLetter } from "@/lib/letters";
import {
  playLetterSound,
  playWrongSound,
  unlockAudio,
} from "@/lib/audio";

// Must match the .fish width/height in globals.css.
const FISH_W = 92;
const FISH_H = 70;

// Internal motion state for one fish (lives in a ref, not React state).
interface Motion {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bob: number;
}

interface Burst {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

type Phase = "start" | "playing" | "levelComplete" | "timeUp";

export default function PondGame() {
  const [phase, setPhase] = useState<Phase>("start");
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState<RoundPlan | null>(null);
  const [roundId, setRoundId] = useState(0);
  const [score, setScore] = useState(0);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [stars, setStars] = useState(3);

  // ---- refs used by the animation loop / tap handling --------------------
  const pondRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const fishEls = useRef<Map<number, HTMLButtonElement>>(new Map());
  const motion = useRef<Map<number, Motion>>(new Map());
  const caughtRef = useRef<Set<number>>(new Set());
  const caughtTargetsRef = useRef(0);
  const targetsNeededRef = useRef(1);
  const remainingRef = useRef(0);
  const totalTimeRef = useRef(1);
  const configRef = useRef<LevelConfig | null>(null);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const burstSeq = useRef(0);
  const fishIdSeq = useRef(0);

  // Register/unregister a fish's DOM node so the loop can move it.
  const registerRef = useCallback(
    (id: number, el: HTMLButtonElement | null) => {
      if (el) fishEls.current.set(id, el);
      else fishEls.current.delete(id);
    },
    []
  );

  // ---- start (or restart) a level ----------------------------------------
  const startLevel = useCallback((levelNumber: number) => {
    const cfg = getLevelConfig(levelNumber);
    const plan = buildRound(cfg, fishIdSeq.current);
    fishIdSeq.current += plan.fish.length + 5;

    // reset per-round state
    caughtRef.current = new Set();
    caughtTargetsRef.current = 0;
    targetsNeededRef.current = plan.fish.filter((f) => f.isTarget).length;
    remainingRef.current = cfg.timeSeconds * 1000;
    totalTimeRef.current = cfg.timeSeconds * 1000;
    configRef.current = cfg;
    fishEls.current = new Map();
    motion.current = new Map();
    lastRef.current = 0;

    setLevel(levelNumber);
    setRound(plan);
    setPhase("playing");
    setRoundId((r) => r + 1);
  }, []);

  // ---- spawn a coin/star reward at a pond position -----------------------
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
      unlockAudio(); // first gesture unlocks audio on mobile
      if (caughtRef.current.has(spec.id)) return;

      if (spec.isTarget) {
        // CORRECT: splash away, play the letter sound, show a reward.
        caughtRef.current.add(spec.id);
        caughtTargetsRef.current += 1;
        playLetterSound(getLetter(spec.letterId).audio);
        el.classList.add("caught");

        const m = motion.current.get(spec.id);
        if (m) spawnBurst(m.x + FISH_W / 2, m.y);
        setScore((s) => s + 1);

        // All target fish caught -> level complete.
        if (caughtTargetsRef.current >= targetsNeededRef.current) {
          const pct = remainingRef.current / totalTimeRef.current;
          setStars(pct > 0.5 ? 3 : pct > 0.2 ? 2 : 1);
          window.setTimeout(() => setPhase("levelComplete"), 450);
        }
      } else {
        // WRONG: fish stays, shakes gently, soft "baaap".
        playWrongSound();
        el.classList.add("shake");
        window.setTimeout(() => el.classList.remove("shake"), 450);
      }
    },
    [spawnBurst]
  );

  // ---- the animation + timer loop ----------------------------------------
  useEffect(() => {
    if (phase !== "playing" || !round) return;
    const pond = pondRef.current;
    if (!pond) return;

    // Place each fish at a random spot with a random direction.
    const rect = pond.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const speed = configRef.current?.speed ?? 40;

    const m = new Map<number, Motion>();
    for (const f of round.fish) {
      const angle = Math.random() * Math.PI * 2;
      m.set(f.id, {
        x: Math.random() * Math.max(1, W - FISH_W),
        y: Math.random() * Math.max(1, H - FISH_H),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        bob: Math.random() * Math.PI * 2,
      });
    }
    motion.current = m;

    const loop = (t: number) => {
      if (lastRef.current === 0) lastRef.current = t;
      let dt = (t - lastRef.current) / 1000;
      lastRef.current = t;
      if (dt > 0.05) dt = 0.05; // clamp big gaps (tab switch, slow frame)

      const p = pondRef.current;
      if (p) {
        const w = p.clientWidth;
        const h = p.clientHeight;
        motion.current.forEach((fishM, id) => {
          if (caughtRef.current.has(id)) return; // frozen while splashing
          fishM.x += fishM.vx * dt;
          fishM.y += fishM.vy * dt;

          // Bounce off the pond walls.
          if (fishM.x <= 0) {
            fishM.x = 0;
            fishM.vx = Math.abs(fishM.vx);
          } else if (fishM.x >= w - FISH_W) {
            fishM.x = w - FISH_W;
            fishM.vx = -Math.abs(fishM.vx);
          }
          if (fishM.y <= 0) {
            fishM.y = 0;
            fishM.vy = Math.abs(fishM.vy);
          } else if (fishM.y >= h - FISH_H) {
            fishM.y = h - FISH_H;
            fishM.vy = -Math.abs(fishM.vy);
          }

          fishM.bob += dt * 3;
          const el = fishEls.current.get(id);
          if (el) {
            el.style.transform = `translate3d(${fishM.x}px, ${
              fishM.y + Math.sin(fishM.bob) * 4
            }px, 0)`;
          }
        });
      }

      // Countdown timer bar.
      remainingRef.current -= dt * 1000;
      const pct = Math.max(0, remainingRef.current / totalTimeRef.current);
      if (timerRef.current) {
        timerRef.current.style.width = `${pct * 100}%`;
        if (pct < 0.25) timerRef.current.classList.add("low");
        else timerRef.current.classList.remove("low");
      }

      if (remainingRef.current <= 0) {
        setPhase("timeUp");
        return; // stop the loop; overlay takes over
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId, phase]);

  // ---- render -------------------------------------------------------------
  const target = round?.target;

  return (
    <div className="app">
      {/* Top bar: score + level */}
      <div className="topbar">
        <div className="scorePill">
          <span>🪙</span>
          <span>{score}</span>
        </div>
        <div className="levelPill">
          {/* minimal text: a star + level number */}
          ⭐ {Math.min(level, TOTAL_LEVELS)}
        </div>
      </div>

      {/* Target letter the child must find */}
      {target && (
        <div className="target">
          <div className="targetLabel">यह पकड़ो</div>
          <div className="targetCard" key={roundId}>
            {target.char}
          </div>
          <button
            type="button"
            className="targetSound"
            onClick={() => {
              unlockAudio();
              playLetterSound(target.audio);
            }}
            aria-label="play target letter sound"
          >
            🔊 सुनो
          </button>
        </div>
      )}

      {/* Timer bar */}
      <div className="timerWrap">
        <div className="timerFill" ref={timerRef} style={{ width: "100%" }} />
      </div>

      {/* Pond with fish */}
      <div className="pond" ref={pondRef}>
        {round?.fish.map((spec) => (
          <Fish
            key={spec.id}
            spec={spec}
            registerRef={registerRef}
            onTap={handleTap}
          />
        ))}

        {/* Reward bursts */}
        {bursts.map((b) => (
          <span
            key={b.id}
            className="burst"
            style={{ left: b.x, top: b.y }}
          >
            {b.emoji}
          </span>
        ))}
      </div>

      {/* ---- Overlays ---- */}
      {phase === "start" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">🐟🎣</div>
            <div className="overlayTitle">मछली पकड़ो!</div>
            <p style={{ fontSize: 18, color: "#0a3d57", margin: "4px 0 18px" }}>
              सही अक्षर वाली मछली पकड़ो
            </p>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                unlockAudio();
                setScore(0);
                startLevel(1);
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
            <div className="overlayStars">
              {"⭐".repeat(stars)}
              {"☆".repeat(3 - stars)}
            </div>
            <button
              type="button"
              className="bigButton"
              onClick={() => {
                unlockAudio();
                startLevel(level + 1);
              }}
            >
              ▶ आगे
            </button>
          </div>
        </div>
      )}

      {phase === "timeUp" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">⏰</div>
            <div className="overlayTitle">फिर कोशिश करो</div>
            <button
              type="button"
              className="bigButton blue"
              onClick={() => {
                unlockAudio();
                startLevel(level);
              }}
            >
              🔁 दोबारा
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
