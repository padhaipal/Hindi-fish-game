"use client";

// ---------------------------------------------------------------------------
// MATRA POND — a single-MATRA "pond hop" mini-game (one stop of a per-matra
// adventure).
// ---------------------------------------------------------------------------
// A frog crosses a pond by hopping ONLY on stones that show a syllable carrying
// the TARGET matra. The pond has 4 rows of stones (4 hops), near bank at the
// bottom, far bank at the top. Each row has 3 stones: exactly ONE carries the
// target-matra syllable (e.g. का, पा for ा) and the other two are distractors
// (the same consonants with a DIFFERENT matra, or occasionally a bare
// consonant) — so exactly one stone per row carries the target matra's sign.
//
// It is deliberately FORGIVING, mirroring the letter pond-hop's look & feel but
// simpler: there is no lose / timer / splash-out / exit / trophy. Only the next
// reachable row is tappable. Tapping the target stone hops the frog up a row,
// speaks the syllable and plays a bright "bing". Tapping a wrong stone plays a
// soft "baaap" and shakes that stone — the frog does NOT advance and the child
// can try again. Reaching the top row calls onDone() exactly once and the
// parent adventure takes over; this component owns no navigation or overlays.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LETTERS } from "@/lib/letters";
import { getMatra, MATRAS, matraChip, syllable } from "@/lib/matras";
import { speakSyllable, primeTts } from "@/lib/tts";
import { playBingSound, playWrongSound, unlockAudio } from "@/lib/audio";

interface Props {
  matraId: string;
  onDone: () => void;
}

// The pond has ROWS rows of stones — one hop each — from near bank (bottom) up
// to the far bank (top).
const ROWS = 4;
const STONES_PER_ROW = 3;

// Vertical position (% of the water height) of each row's stones, index 0 =
// first hop (nearest the near bank / bottom) up to the last (near far bank).
const ROW_Y = [84, 61, 38, 15];
// Horizontal positions (% of the water width) of the 3 stones in a row.
const COL_X = [20, 50, 80];
// Where the frog waits before its first hop (% of the water area).
const START = { x: 50, y: 97 };
// Hop animation length (ms) — kept in step with the CSS transition below.
const HOP_MS = 460;

interface Stone {
  id: number;
  row: number; // 0 = first hop (bottom) … ROWS-1 = last hop (top)
  x: number; // % across the water
  text: string; // what is shown on the stone
  spoken: string; // what to speak when it is the target
  isTarget: boolean; // carries the target matra?
}

// Unique class prefix so the injected styles never collide with globals.css or
// any other component on the page.
const CSS = `
.mp-root {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 6px;
  box-sizing: border-box;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  background: radial-gradient(120% 100% at 50% 100%, #bfe9ff 0%, #7ec8ff 55%, #4aa8f0 100%);
}
/* far bank (top) — the grassy side we're crossing TO, carries the goal banner */
.mp-bank {
  flex: 0 0 auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  background: linear-gradient(#7bd86a, #4caf50);
  border-radius: 16px;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.15);
}
.mp-far {
  min-height: 58px;
  padding: 8px 12px;
}
.mp-near {
  min-height: 44px;
  padding: 6px;
}
.mp-goal {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.18);
  font-size: 18px;
  font-weight: 800;
  color: #0a3d57;
  text-align: center;
}
.mp-goal-sign {
  font-size: 26px;
  font-weight: 800;
  color: #c92a2a;
}
/* the water — the coordinate space stones + frog are positioned within (%) */
.mp-water {
  position: relative;
  flex: 1 1 auto;
  width: 100%;
  min-height: 0;
}
/* a stone — positioned absolutely by its % (x, y), centred on that point */
.mp-stone {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border: none;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  background: radial-gradient(circle at 35% 30%, #c7cdd4 0%, #9aa3ad 60%, #79828d 100%);
  box-shadow: 0 4px 0 rgba(0, 0, 0, 0.2), inset 0 3px 5px rgba(255, 255, 255, 0.33);
  opacity: 0.5; /* rows further ahead sit well back */
  transition: opacity 0.25s ease, box-shadow 0.25s ease;
}
.mp-stone.mp-done {
  opacity: 0.8; /* rows already crossed */
}
.mp-stone.mp-done.mp-was-target {
  background: radial-gradient(circle at 35% 30%, #6ee08a 0%, #34c062 60%, #1ea24c 100%);
}
.mp-stone.mp-done.mp-was-target .mp-stone-text {
  color: #fff;
}
.mp-stone:disabled {
  cursor: default;
}
/* the reachable row (the frog's next hop) is bright, ringed + glowing */
.mp-stone.mp-reachable {
  opacity: 1;
  animation: mp-pulse 1.1s ease-in-out infinite;
}
@keyframes mp-pulse {
  0%, 100% { box-shadow: 0 4px 0 rgba(0,0,0,0.2), inset 0 3px 5px rgba(255,255,255,0.33), 0 0 0 3px rgba(255,210,63,0.87); }
  50% { box-shadow: 0 4px 0 rgba(0,0,0,0.2), inset 0 3px 5px rgba(255,255,255,0.33), 0 0 0 9px rgba(255,210,63,0.4); }
}
.mp-stone-text {
  font-size: 26px;
  font-weight: 800;
  line-height: 1;
  color: #18313f;
  pointer-events: none;
}
/* a wrong tap gives the stone a little shake (no penalty) */
.mp-stone.mp-shake {
  animation: mp-shake 0.45s ease;
}
@keyframes mp-shake {
  0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
  20% { transform: translate(-58%, -50%) rotate(-7deg); }
  50% { transform: translate(-42%, -50%) rotate(7deg); }
  80% { transform: translate(-54%, -50%) rotate(-4deg); }
}
/* the frog — one element that glides (left/top) from stone to stone, its body
   lifting in a little hop as it goes */
.mp-frog {
  position: absolute;
  transform: translate(-50%, -72%);
  z-index: 6;
  pointer-events: none;
  transition: left ${HOP_MS}ms cubic-bezier(0.45, 0, 0.45, 1),
    top ${HOP_MS}ms cubic-bezier(0.45, 0, 0.45, 1);
}
.mp-frog-body {
  display: block;
  font-size: 42px;
  line-height: 1;
  filter: drop-shadow(0 3px 2px rgba(0, 0, 0, 0.25));
  animation: mp-hop ${HOP_MS}ms ease;
}
@keyframes mp-hop {
  0% { transform: translateY(0) scale(1); }
  40% { transform: translateY(-26px) scale(1.12); }
  100% { transform: translateY(0) scale(1); }
}
`;

// Build one distractor for a row: a syllable carrying a DIFFERENT matra, or,
// occasionally, a bare consonant — never the target matra, and never equal to
// the target syllable or another stone already placed in the row.
function makeDistractor(
  otherMatras: typeof MATRAS,
  taken: Set<string>
): string {
  for (let attempt = 0; attempt < 12; attempt++) {
    const consonant = LETTERS[Math.floor(Math.random() * LETTERS.length)].char;
    let text: string;
    if (Math.random() < 0.18 || otherMatras.length === 0) {
      text = consonant; // bare consonant, no matra
    } else {
      const m = otherMatras[Math.floor(Math.random() * otherMatras.length)];
      text = syllable(consonant, m);
    }
    if (!taken.has(text)) return text;
  }
  // Extremely unlikely fallback: a bare consonant not yet used.
  const spare = LETTERS.map((l) => l.char).find((c) => !taken.has(c));
  return spare ?? LETTERS[0].char;
}

export default function MatraPond({ matraId, onDone }: Props) {
  const matra = getMatra(matraId);

  // step = how many hops completed = index of the next reachable row (0..ROWS).
  const [step, setStep] = useState(0);
  const [frog, setFrog] = useState(START);
  const [hopCount, setHopCount] = useState(0); // bumps each hop to retrigger the arc
  const [shakeId, setShakeId] = useState<number | null>(null);

  const doneRef = useRef(false); // guards onDone() so it fires at most once
  const busyRef = useRef(false); // true while a hop animates
  const introRef = useRef(false); // guards the mount side-effects (StrictMode)
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => clearTimers(), []);

  // ---- build the whole pond once (stable for this mount) ------------------
  const rows = useMemo<Stone[][]>(() => {
    const otherMatras = MATRAS.filter((m) => m.id !== matraId);
    let id = 0;
    const built: Stone[][] = [];
    for (let r = 0; r < ROWS; r++) {
      const targetConsonant =
        LETTERS[Math.floor(Math.random() * LETTERS.length)].char;
      const targetText = syllable(targetConsonant, matra);

      const taken = new Set<string>([targetText]);
      const texts: { text: string; isTarget: boolean }[] = [
        { text: targetText, isTarget: true },
      ];
      for (let k = 0; k < STONES_PER_ROW - 1; k++) {
        const d = makeDistractor(otherMatras, taken);
        taken.add(d);
        texts.push({ text: d, isTarget: false });
      }
      // Shuffle so the target isn't always in the same column.
      for (let i = texts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [texts[i], texts[j]] = [texts[j], texts[i]];
      }
      built.push(
        texts.map((t, col) => ({
          id: id++,
          row: r,
          x: COL_X[col],
          text: t.text,
          spoken: t.text,
          isTarget: t.isTarget,
        }))
      );
    }
    return built;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matraId]);

  // ---- mount: unlock audio + prime TTS once (StrictMode-guarded) ----------
  useEffect(() => {
    if (introRef.current) return;
    introRef.current = true;
    unlockAudio();
    primeTts();
  }, []);

  // ---- tap a stone --------------------------------------------------------
  const handleStone = useCallback(
    (stone: Stone) => {
      if (doneRef.current || busyRef.current) return;
      if (stone.row !== step) return; // only the reachable (next) row hops
      unlockAudio();

      if (!stone.isTarget) {
        // WRONG: soft "baaap" + a little shake. No advance, no penalty.
        playWrongSound();
        setShakeId(stone.id);
        later(() => setShakeId((cur) => (cur === stone.id ? null : cur)), 460);
        return;
      }

      // CORRECT: the frog hops up onto this stone.
      busyRef.current = true;
      setShakeId(null);
      setFrog({ x: stone.x, y: ROW_Y[stone.row] });
      setHopCount((h) => h + 1);

      later(() => {
        speakSyllable(stone.spoken);
        playBingSound();
        const next = step + 1;
        setStep(next);
        busyRef.current = false;
        if (next >= ROWS && !doneRef.current) {
          // Reached the far bank (top) — finish, exactly once.
          doneRef.current = true;
          later(() => onDone(), 380);
        }
      }, HOP_MS);
    },
    [step, later, onDone]
  );

  // ---- render -------------------------------------------------------------
  return (
    <div className="mp-root">
      {/* Inject the component's styles once, scoped by the mp- prefix. */}
      <style>{CSS}</style>

      {/* Far bank (top) with the goal banner. */}
      <div className="mp-bank mp-far">
        <div className="mp-goal">
          <span className="mp-goal-sign">{matraChip(matra)}</span>
          <span>वाले पत्थर पर कूदो</span>
        </div>
      </div>

      {/* The water — stones + frog are positioned by % within here. */}
      <div className="mp-water">
        {rows.map((row) =>
          row.map((stone) => {
            const reachable = stone.row === step && !doneRef.current;
            const done = stone.row < step;
            const cls = [
              "mp-stone",
              reachable ? "mp-reachable" : done ? "mp-done" : "mp-ahead",
              done && stone.isTarget ? "mp-was-target" : "",
              stone.id === shakeId ? "mp-shake" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                type="button"
                key={stone.id}
                className={cls}
                style={{ left: `${stone.x}%`, top: `${ROW_Y[stone.row]}%` }}
                disabled={!reachable}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleStone(stone);
                }}
                aria-label={reachable ? `पत्थर ${stone.text}` : stone.text}
              >
                <span className="mp-stone-text">{stone.text}</span>
              </button>
            );
          })
        )}

        {/* The frog — glides from the near bank up to each tapped target. */}
        <div
          className="mp-frog"
          style={{ left: `${frog.x}%`, top: `${frog.y}%` }}
        >
          <span className="mp-frog-body" key={hopCount}>
            🐸
          </span>
        </div>
      </div>

      {/* Near bank (bottom) — the grassy start. */}
      <div className="mp-bank mp-near" />
    </div>
  );
}
