"use client";

// ---------------------------------------------------------------------------
// POND GAME — the whole game screen.
// ---------------------------------------------------------------------------
// Round flow:
//   1. "intro"  — the board is set up and FROZEN (fish placed but not moving,
//                 timer not running) while the target letter's sound plays.
//   2. "playing"— the sound has finished: the timer starts and the fish swim.
//   3. tapping  — correct: splash + reward + replay the letter sound;
//                 wrong:   the fish stays, shakes, and plays a soft "baaap".
//   4. overlays — level-complete / time-up, then the next/again level.
//
// Fish motion (position + swivel + bounce-off-each-other) is animated with
// requestAnimationFrame writing transforms straight to the DOM, so we never
// re-render on every frame — important for smoothness on low-end phones.
// ---------------------------------------------------------------------------

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import Fish from "./Fish";
import { buildRound, FishSpec, RoundPlan } from "@/lib/round";
import { getLevelConfig, LevelConfig, TOTAL_LEVELS } from "@/lib/levels";
import { getLetter, Letter, LETTERS } from "@/lib/letters";
import {
  playLetterSound,
  playWrongSound,
  playWinSound,
  playLoseSound,
  playEndgameSound,
  stopWinLoseSounds,
  unlockAudio,
} from "@/lib/audio";

// Where the final "पाठ पर जाएं" button sends the child: a WhatsApp chat with the
// PadhaiPal number (+91 8528097842). No text param = no auto-filled message.
const PADHAIPAL_URL = "https://wa.me/918528097842";

// Must match the .fish width/height in globals.css.
const FISH = 88;
// How close two fish centres may get before they bounce off each other.
const COLLIDE_DIST = 60;

// Internal motion state for one fish (lives in a ref, not React state).
interface Motion {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bob: number; // phase for the gentle up/down bobbing
  facing: string; // last applied swivel transform (so we only update on change)
}

interface Burst {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

type Phase =
  | "start"
  | "intro"
  | "playing"
  | "levelComplete"
  | "lost"
  | "allDone"; // all 8 levels cleared

// Why a level was lost — changes the message/emoji on the lose screen.
type LoseReason = "time" | "wrong";

// Lose the level after this many wrong taps.
const MAX_WRONG_TAPS = 3;

// Build the CSS transform that swivels a fish to face its travel direction.
// The graphic points right by default; when swimming left we mirror it so it
// stays upright (never belly-up) instead of rotating a full 180°.
function facingTransform(vx: number, vy: number): string {
  const deg = (Math.atan2(vy, vx) * 180) / Math.PI;
  if (vx >= 0) return `rotate(${deg}deg)`;
  return `scaleX(-1) rotate(${180 - deg}deg)`;
}

export default function PondGame() {
  const [phase, setPhase] = useState<Phase>("start");
  const [level, setLevel] = useState(1);
  const [round, setRound] = useState<RoundPlan | null>(null);
  const [roundId, setRoundId] = useState(0);
  const [score, setScore] = useState(0);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [stars, setStars] = useState(3);
  const [loseReason, setLoseReason] = useState<LoseReason>("time");

  // ---- refs used by the animation loop / tap handling --------------------
  const pondRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLDivElement>(null);
  const fishEls = useRef<Map<number, HTMLButtonElement>>(new Map());
  const fishGraphics = useRef<Map<number, HTMLSpanElement>>(new Map());
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
  const currentRoundRef = useRef(0);
  const introDoneForRound = useRef(-1);
  const wrongTapsRef = useRef(0); // wrong taps this level (for star penalty + loss)
  const roundOverRef = useRef(false); // true once the level is won or lost
  const levelRef = useRef(1); // current level (avoids stale closures in handleTap)
  // The 8 letters in a random order — one letter per level, reshuffled each game.
  const letterOrderRef = useRef<string[]>([]);

  const registerRoot = useCallback(
    (id: number, el: HTMLButtonElement | null) => {
      if (el) fishEls.current.set(id, el);
      else fishEls.current.delete(id);
    },
    []
  );
  const registerGraphic = useCallback(
    (id: number, el: HTMLSpanElement | null) => {
      if (el) fishGraphics.current.set(id, el);
      else fishGraphics.current.delete(id);
    },
    []
  );

  // ---- start (or restart) a level ----------------------------------------
  const startLevel = useCallback((levelNumber: number) => {
    const cfg = getLevelConfig(levelNumber);
    // This level's target letter comes from the shuffled per-game order.
    const order = letterOrderRef.current;
    const targetId = order[(levelNumber - 1) % order.length];
    const plan = buildRound(cfg, getLetter(targetId), fishIdSeq.current);
    fishIdSeq.current += plan.fish.length + 5;
    levelRef.current = levelNumber;

    // reset per-round state
    caughtRef.current = new Set();
    caughtTargetsRef.current = 0;
    wrongTapsRef.current = 0;
    roundOverRef.current = false;
    targetsNeededRef.current = plan.fish.filter((f) => f.isTarget).length;
    remainingRef.current = cfg.timeSeconds * 1000;
    totalTimeRef.current = cfg.timeSeconds * 1000;
    configRef.current = cfg;
    fishEls.current = new Map();
    fishGraphics.current = new Map();
    motion.current = new Map();
    lastRef.current = 0;

    setLevel(levelNumber);
    setRound(plan);
    setPhase("intro"); // start FROZEN; the intro sound effect will unfreeze
    setRoundId((r) => r + 1);
  }, []);

  // ---- start a brand-new game --------------------------------------------
  // Reshuffle the 8 letters (so each level's target is random per player), reset
  // the score, and begin at Level 1.
  const newGame = useCallback(() => {
    const ids = LETTERS.map((l) => l.id);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    letterOrderRef.current = ids;
    setScore(0);
    startLevel(1);
  }, [startLevel]);

  // ---- place the fish + (after layout) play the frozen intro sound -------
  // Runs once per round. Positions the fish so the frozen board looks set up,
  // then plays the target letter's sound and unfreezes when it finishes.
  useLayoutEffect(() => {
    if (!round) return;
    const pond = pondRef.current;
    if (!pond) return;
    currentRoundRef.current = roundId;

    const rect = pond.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const speed = configRef.current?.speed ?? 40;

    // Place each fish at a random spot, trying not to overlap the others.
    const placed: { cx: number; cy: number }[] = [];
    const m = new Map<number, Motion>();
    for (const f of round.fish) {
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
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        bob: Math.random() * Math.PI * 2,
        facing: "",
      });
    }
    motion.current = m;

    // Apply the initial position + facing so the frozen board looks natural.
    motion.current.forEach((fm, id) => {
      const el = fishEls.current.get(id);
      if (el) el.style.transform = `translate3d(${fm.x}px, ${fm.y}px, 0)`;
      const g = fishGraphics.current.get(id);
      if (g) {
        fm.facing = facingTransform(fm.vx, fm.vy);
        g.style.transform = fm.facing;
      }
    });

    // Reset the timer bar to full.
    if (timerRef.current) {
      timerRef.current.style.width = "100%";
      timerRef.current.classList.remove("low");
    }

    // Play the target sound once; unfreeze (start playing) when it ends.
    if (introDoneForRound.current !== roundId) {
      introDoneForRound.current = roundId;
      playLetterSound(round.target.audio, () => {
        if (currentRoundRef.current === roundId) setPhase("playing");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId]);

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
      // Only respond while actually playing (ignore taps during the frozen
      // intro, overlays, or once the level is already won/lost).
      if (phase !== "playing" || roundOverRef.current) return;
      if (caughtRef.current.has(spec.id)) return;

      if (spec.isTarget) {
        // CORRECT: splash away, REPLAY the letter sound, show a reward.
        caughtRef.current.add(spec.id);
        caughtTargetsRef.current += 1;
        playLetterSound(getLetter(spec.letterId).audio);
        el.classList.add("caught");

        const m = motion.current.get(spec.id);
        if (m) spawnBurst(m.x + FISH / 2, m.y);
        setScore((s) => s + 1);

        // All target fish caught -> level complete (you win!).
        if (caughtTargetsRef.current >= targetsNeededRef.current) {
          roundOverRef.current = true;
          // Stars: start from how much time was left, then LOSE ONE STAR per
          // wrong tap. Always keep at least 1 star for a win.
          const pct = remainingRef.current / totalTimeRef.current;
          const timeStars = pct > 0.5 ? 3 : pct > 0.2 ? 2 : 1;
          setStars(Math.max(1, timeStars - wrongTapsRef.current));

          const wasLastLevel = levelRef.current >= TOTAL_LEVELS;
          window.setTimeout(() => {
            if (wasLastLevel) {
              // Finished all 8 levels -> the final "go back to the app" screen.
              setPhase("allDone");
            } else {
              setPhase("levelComplete");
              playWinSound(); // clapping/cheer
            }
          }, 450);
        }
      } else {
        // WRONG: fish stays and shakes gently.
        wrongTapsRef.current += 1;
        el.classList.add("shake");
        window.setTimeout(() => el.classList.remove("shake"), 450);

        if (wrongTapsRef.current >= MAX_WRONG_TAPS) {
          // Too many wrong taps -> you lose. Play the sad "wa wa wa".
          roundOverRef.current = true;
          setLoseReason("wrong");
          playLoseSound();
          window.setTimeout(() => setPhase("lost"), 500);
        } else {
          playWrongSound(); // soft "baaap"
        }
      }
    },
    [phase, spawnBurst]
  );

  // ---- the animation + timer loop (runs only while "playing") ------------
  useEffect(() => {
    if (phase !== "playing" || !round) return;
    lastRef.current = 0;

    const loop = (t: number) => {
      if (lastRef.current === 0) lastRef.current = t;
      let dt = (t - lastRef.current) / 1000;
      lastRef.current = t;
      if (dt > 0.05) dt = 0.05; // clamp big gaps (tab switch / slow frame)

      const pond = pondRef.current;
      if (pond) {
        const w = pond.clientWidth;
        const h = pond.clientHeight;

        // Active (uncaught) fish ids.
        const ids: number[] = [];
        motion.current.forEach((_, id) => {
          if (!caughtRef.current.has(id)) ids.push(id);
        });

        // 1) Move + bounce off the pond walls.
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

        // 2) Bounce fish off EACH OTHER (equal-mass elastic collision).
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
              // push them apart so they don't overlap
              a.x -= nx * overlap;
              a.y -= ny * overlap;
              b.x += nx * overlap;
              b.y += ny * overlap;
              // swap the velocity components along the collision normal
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

        // 3) Clamp inside walls again, then write transforms.
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
          // Swivel only when the heading actually changes (cheap + lets the CSS
          // transition smooth it out).
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

      // Countdown timer bar.
      remainingRef.current -= dt * 1000;
      const pct = Math.max(0, remainingRef.current / totalTimeRef.current);
      if (timerRef.current) {
        timerRef.current.style.width = `${pct * 100}%`;
        if (pct < 0.25) timerRef.current.classList.add("low");
        else timerRef.current.classList.remove("low");
      }

      if (remainingRef.current <= 0) {
        if (!roundOverRef.current) {
          roundOverRef.current = true;
          setLoseReason("time");
          playLoseSound(); // sad "wa wa wa"
        }
        setPhase("lost");
        return; // stop the loop; overlay takes over
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId, phase]);

  // ---- play the spoken finish message on the final screen ----------------
  useEffect(() => {
    if (phase === "allDone") playEndgameSound();
  }, [phase]);

  // ---- render -------------------------------------------------------------
  const target = round?.target;

  return (
    <div className="app">
      {/* Top bar: score + level */}
      <div className="topbar">
        <div className="scorePill">
          <span>🐟</span>
          <span>{score}</span>
        </div>
        <div className="levelPill">⭐ {Math.min(level, TOTAL_LEVELS)}</div>
      </div>

      {/* Target: picture on the left, letter card on the right */}
      {target && (
        <div className="target">
          <div className="targetLabel">यह पकड़ो</div>
          <div className="targetRow">
            <WordPicture letter={target} key={`pic-${roundId}`} />
            <div className="targetCard" key={`card-${roundId}`}>
              {target.char}
            </div>
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
            registerRoot={registerRoot}
            registerGraphic={registerGraphic}
            onTap={handleTap}
          />
        ))}

        {/* Reward bursts */}
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
            <div className="overlayTitle">मछली पकड़ो!</div>
            <p style={{ fontSize: 18, color: "#0a3d57", margin: "4px 0 18px" }}>
              सही अक्षर वाली मछली पकड़ो
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
            <Link href="/blocks" className="overlayLink">
              🧩 ब्लॉक खेल
            </Link>
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
                stopWinLoseSounds(); // cut the clapping before the next level
                startLevel(level + 1);
              }}
            >
              ▶ आगे
            </button>
          </div>
        </div>
      )}

      {phase === "lost" && (
        <div className="overlay">
          <div className="overlayCard">
            <div className="overlayEmoji">
              {loseReason === "wrong" ? "🙈" : "⏰"}
            </div>
            <div className="overlayTitle">फिर कोशिश करो</div>
            <button
              type="button"
              className="bigButton blue"
              onClick={() => {
                unlockAudio();
                stopWinLoseSounds(); // cut the "wa wa wa" before restarting
                // On a loss, drop back to the PRECEDING level (min level 1).
                startLevel(Math.max(1, level - 1));
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
            <div
              style={{ fontSize: 18, color: "#0a3d57", margin: "2px 0 12px" }}
            >
              सभी स्तर पूरे!
            </div>
            <PadhaipalImage />
            {/* Sends the child back to the PadhaiPal app / lesson. */}
            <a className="bigButton" href={PADHAIPAL_URL}>
              पाठ पर जाएं
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// WORD PICTURE — the picture shown beside the target letter.
// We use a big EMOJI rather than an image file: it stays crisp on small / low-end
// screens, needs no asset loading, and is easy to change (see `emoji` in
// lib/letters.ts). e.g. ब → 🦆 (बत्तख़), स → 🧼 (साबुन).
// Exception: ल (लट्टू) uses a hand-drawn SVG lattu, since no emoji is a real
// Indian spinning top (🪀 is a yo-yo).
// ---------------------------------------------------------------------------
function WordPicture({ letter }: { letter: Letter }) {
  return (
    <div className="wordPic" aria-label={letter.word}>
      {letter.id === "la" ? (
        <LattuIcon />
      ) : (
        <span className="wordEmoji">{letter.emoji}</span>
      )}
    </div>
  );
}

// A traditional Indian lattu (wooden spinning top): striped wooden body with a
// pointed metal tip and the lower cone wound with cream string.
function LattuIcon() {
  return (
    <svg viewBox="0 0 100 100" width="78" height="78" aria-hidden="true">
      <defs>
        <clipPath id="lattuBody">
          <path d="M50 18 C 28 20 20 36 22 50 C 24 66 38 80 50 87 C 62 80 76 66 78 50 C 80 36 72 20 50 18 Z" />
        </clipPath>
      </defs>
      {/* top knob */}
      <rect x="45" y="9" width="10" height="13" rx="4" fill="#7a4a22" />
      {/* striped body */}
      <g clipPath="url(#lattuBody)">
        <rect x="0" y="0" width="100" height="100" fill="#d2772b" />
        <rect x="0" y="30" width="100" height="8" fill="#f2b134" />
        <rect x="0" y="42" width="100" height="6" fill="#7a1f1f" />
        <rect x="0" y="56" width="100" height="24" fill="#f3ead7" />
      </g>
      {/* metal tip */}
      <path d="M44 76 L50 96 L56 76 Z" fill="#9aa0a6" />
      <path d="M47 82 L50 96 L53 82 Z" fill="#6b7075" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// PADHAIPAL IMAGE — shown on the final "all done" screen above the link button.
// Loads /images/padhaipal.png; if that file isn't present yet it falls back to
// a simple branded badge so the screen is never broken.
// ---------------------------------------------------------------------------
function PadhaipalImage() {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="brandBadge">
        <span style={{ fontSize: 40 }}>🐟</span>
        <span>PadhaiPal</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="padhaipalImg"
      src="/images/padhaipal.jpeg"
      alt="PadhaiPal"
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}
