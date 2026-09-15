"use client";

// ---------------------------------------------------------------------------
// MATRA BASKET (मात्रा टोकरी) — a fruit-tree sorting game for ONE matra.
// ---------------------------------------------------------------------------
// A leafy tree stands across the top of the screen with 12 fruits hanging on
// its canopy. Each fruit has a syllable written on it — 6 carry the TARGET
// matra (का, पा, मा … when the target is ा) and 6 carry a DIFFERENT matra
// (कि, कु, को …). The child DRAGS the fruits that have the target matra down
// into the basket at the bottom, and leaves the rest. A basketed fruit lands
// as a visible little fruit in the basket mouth, so the pile grows as they go.
//
// Deliberately FORGIVING: no lose / time-up / exit. A wrong fruit dropped on
// the basket gives a soft "baaap", shakes and snaps back — it is never counted
// and never removed. A fruit dropped anywhere off the basket just snaps home.
// The set of 12 fruits is FIXED for the round — nothing ever refills. Once the
// child has basketed all 6 target fruits we call onDone() exactly once (guarded
// by a ref) and the parent adventure takes over — this component owns no
// navigation or overlays.
//
// Self-contained: inline styles + one injected <style>, all classes mb- prefixed
// so nothing collides with globals.css or another component on the page.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LETTERS } from "@/lib/letters";
import { getMatra, MATRAS, Matra, matraChip, syllable } from "@/lib/matras";
import { speakSyllable, primeTts } from "@/lib/tts";
import { playBingSound, playWrongSound, unlockAudio } from "@/lib/audio";

interface Props {
  matraId: string;
  onDone: () => void;
}

// How many TARGET fruits carry the matra (== how many must be basketed).
const TARGETS = 6;
// Total fruits on the tree (fixed for the whole round): 6 target + 6 distractor.
const FRUIT_COUNT = 12;
// Fruit size in px (kept in sync with .mb-fruit below).
const FRUIT = 70;

type Pt = { x: number; y: number };

// Distinct fruit looks — colour + shape so they read as different fruits. The
// syllable sits on a light plate on top, so it stays readable on every one.
interface FruitLook {
  bg: string;
  radius: string;
  leaf: string;
}
const LOOKS: FruitLook[] = [
  // apple (red)
  { bg: "radial-gradient(circle at 34% 28%, #ff9a9a, #e23b4e 72%)", radius: "50% 50% 47% 47%", leaf: "#3fae57" },
  // orange
  { bg: "radial-gradient(circle at 34% 28%, #ffce7a, #ff8f1f 74%)", radius: "50%", leaf: "#3fae57" },
  // mango (yellow, egg-ish)
  { bg: "radial-gradient(circle at 36% 26%, #ffe873, #f0ad00 76%)", radius: "56% 56% 50% 50% / 62% 62% 44% 44%", leaf: "#3fae57" },
  // plum (purple)
  { bg: "radial-gradient(circle at 34% 28%, #cfa8ff, #8a3ff0 72%)", radius: "50%", leaf: "#3fae57" },
  // guava (green)
  { bg: "radial-gradient(circle at 34% 28%, #c2ec86, #5cb531 74%)", radius: "50% 50% 52% 52%", leaf: "#2f9e44" },
];

interface Fruit {
  key: number; // stable identity
  slot: number; // which layout slot it hangs in (0..FRUIT_COUNT-1)
  isTarget: boolean; // does it carry the target matra?
  syl: string; // rendered syllable, e.g. "का"
  look: number; // index into LOOKS
}

// Build the fixed set of 12 fruits: 6 targets + 6 distractors, shuffled so the
// colours and the target/distractor fruits interleave over the tree.
function buildFruits(matra: Matra): Fruit[] {
  const others = MATRAS.filter((m) => m.id !== matra.id);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const raw: { isTarget: boolean; syl: string }[] = [];
  for (let i = 0; i < TARGETS; i++) {
    const c = pick(LETTERS);
    raw.push({ isTarget: true, syl: syllable(c.char, matra) });
  }
  for (let i = 0; i < FRUIT_COUNT - TARGETS; i++) {
    const c = pick(LETTERS);
    // A different matra guarantees the syllable can never equal the target.
    const m = pick(others);
    raw.push({ isTarget: false, syl: syllable(c.char, m) });
  }

  // Fisher–Yates shuffle so targets are scattered among the slots.
  for (let i = raw.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [raw[i], raw[j]] = [raw[j], raw[i]];
  }

  return raw.map((r, i) => ({
    key: i,
    slot: i,
    isTarget: r.isTarget,
    syl: r.syl,
    look: i % LOOKS.length,
  }));
}

export default function MatraBasket({ matraId, onDone }: Props) {
  const matra = getMatra(matraId);

  const rootRef = useRef<HTMLDivElement>(null);
  const basketRef = useRef<HTMLDivElement>(null);
  const elsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  // The fixed set of fruits — built once. If the matra prop changes (rare), a
  // guarded effect below rebuilds the round.
  const [fruits, setFruits] = useState<Fruit[]>(() => buildFruits(matra));
  const [offset, setOffset] = useState<Record<number, Pt>>({});
  const [removing, setRemoving] = useState<Set<number>>(new Set());
  const [shakeKey, setShakeKey] = useState<number | null>(null);
  const [collected, setCollected] = useState(0);
  // Fruits that have landed in the basket — shown piled up inside it so the
  // child can see the fruit they dropped in (they don't just vanish).
  const [basketed, setBasketed] = useState<{ key: number; syl: string; look: number }[]>([]);

  const drag = useRef<{ key: number; sx: number; sy: number; pid: number } | null>(null);
  const collectedRef = useRef(0);
  const doneRef = useRef(false);
  const introRef = useRef(false);
  const builtForId = useRef(matra.id);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    const t = window.setTimeout(fn, ms);
    timers.current.push(t);
    return t;
  }, []);

  // ---- measure the play area (re-measures on resize) ----------------------
  useEffect(() => {
    const measure = () => {
      const el = rootRef.current;
      if (el) setDims({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // ---- mount: unlock audio + prime TTS once (StrictMode-guarded) -----------
  useEffect(() => {
    if (introRef.current) return;
    introRef.current = true;
    unlockAudio();
    primeTts();
  }, []);

  // ---- clean up any pending timers on unmount ------------------------------
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
    },
    []
  );

  // ---- rebuild the round if the matra prop changes -------------------------
  useEffect(() => {
    if (builtForId.current === matra.id) return;
    builtForId.current = matra.id;
    doneRef.current = false;
    collectedRef.current = 0;
    setCollected(0);
    setOffset({});
    setRemoving(new Set());
    setShakeKey(null);
    setBasketed([]);
    elsRef.current.clear();
    setFruits(buildFruits(matra));
  }, [matra]);

  const registerEl = useCallback((key: number, el: HTMLDivElement | null) => {
    if (el) elsRef.current.set(key, el);
    else elsRef.current.delete(key);
  }, []);

  // ---- slot layout: a scattered grid over the tree canopy -----------------
  // Slots are top-left home positions for a FRUIT-sized square, laid out inside
  // the leafy canopy (roughly the top 58% of the area) with a little
  // deterministic jitter so the fruits look hung rather than gridded.
  const slots = useMemo<Pt[]>(() => {
    if (!dims) return [];
    const { w, h } = dims;
    const cols = w < 340 ? 3 : 4;
    const rows = Math.ceil(FRUIT_COUNT / cols);
    const topPad = 82; // room for the goal line + counter chip
    const canopyH = Math.max(FRUIT * rows + topPad + 20, h * 0.58);
    const areaTop = topPad;
    const areaLeft = w * 0.06;
    const areaW = w * 0.88;
    const areaH = Math.max(FRUIT * rows, canopyH - topPad - 12);
    const cellW = areaW / cols;
    const cellH = areaH / rows;
    const out: Pt[] = [];
    for (let i = 0; i < FRUIT_COUNT; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const jx = Math.sin(i * 12.9898) * (cellW - FRUIT) * 0.22;
      const jy = Math.cos(i * 4.1414) * (cellH - FRUIT) * 0.18;
      let x = areaLeft + col * cellW + (cellW - FRUIT) / 2 + jx;
      let y = areaTop + row * cellH + (cellH - FRUIT) / 2 + jy;
      x = Math.max(6, Math.min(w - FRUIT - 6, x));
      y = Math.max(topPad, Math.min(areaTop + areaH - FRUIT, y));
      out.push({ x, y });
    }
    return out;
  }, [dims]);

  // ---- drag handling (pointer capture on the fruit; area catches move/up) --
  const onDown = (e: React.PointerEvent, key: number) => {
    if (drag.current || doneRef.current || removing.has(key)) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { key, sx: e.clientX, sy: e.clientY, pid: e.pointerId };
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.pid) return;
    setOffset((o) => ({ ...o, [d.key]: { x: e.clientX - d.sx, y: e.clientY - d.sy } }));
  };

  const snapBack = (key: number) => {
    setOffset((o) => {
      const next = { ...o };
      delete next[key];
      return next;
    });
  };

  const reject = (key: number) => {
    playWrongSound();
    setShakeKey(key);
    later(() => setShakeKey((k) => (k === key ? null : k)), 480);
    snapBack(key);
  };

  const collect = (fruit: Fruit) => {
    speakSyllable(fruit.syl);
    playBingSound();
    collectedRef.current += 1;
    setCollected(collectedRef.current);

    // Quick shrink-into-basket animation, then move the fruit from the tree into
    // the visible pile inside the basket (the set is fixed — nothing refills).
    setRemoving((s) => new Set(s).add(fruit.key));
    snapBack(fruit.key);
    const finished = collectedRef.current >= TARGETS;
    later(() => {
      setFruits((prev) => prev.filter((f) => f.key !== fruit.key));
      setRemoving((s) => {
        const n = new Set(s);
        n.delete(fruit.key);
        return n;
      });
      setBasketed((b) => [...b, { key: fruit.key, syl: fruit.syl, look: fruit.look }]);
      elsRef.current.delete(fruit.key);
    }, 240);

    if (finished && !doneRef.current) {
      doneRef.current = true;
      later(() => onDone(), 560); // small beat so the last fruit is seen landing
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.pid) return;
    drag.current = null;
    const fruit = fruits.find((f) => f.key === d.key);
    const el = elsRef.current.get(d.key);
    const basket = basketRef.current;
    if (!fruit || !el || !basket || removing.has(d.key)) {
      snapBack(d.key);
      return;
    }
    const tr = el.getBoundingClientRect();
    const cx = tr.left + tr.width / 2;
    const cy = tr.top + tr.height / 2;
    const br = basket.getBoundingClientRect();
    // Generous catch area: a little padding around the basket rect.
    const overBasket =
      cx > br.left - 28 &&
      cx < br.right + 28 &&
      cy > br.top - 34 &&
      cy < br.bottom + 28;

    if (overBasket) {
      if (fruit.isTarget) collect(fruit);
      else reject(fruit.key);
    } else {
      snapBack(fruit.key);
    }
  };

  return (
    <div
      className="mb-root"
      ref={rootRef}
      onPointerMove={onMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <style>{CSS}</style>

      {/* the tree: trunk + leafy canopy behind the fruits */}
      <div className="mb-tree" aria-hidden>
        <div className="mb-trunk" />
        <div className="mb-canopy mb-canopy-a" />
        <div className="mb-canopy mb-canopy-b" />
        <div className="mb-canopy mb-canopy-c" />
      </div>

      {/* goal line */}
      <div className="mb-goal">
        {matraChip(matra)} वाले फल टोकरी में डालो
      </div>

      {/* progress counter */}
      <div className="mb-counter" aria-live="polite">
        🧺 {collected}/{TARGETS}
      </div>

      {/* the fruits */}
      {fruits.map((fruit) => {
        const home = slots[fruit.slot] ?? { x: 0, y: 0 };
        const off = offset[fruit.key] ?? { x: 0, y: 0 };
        const dragging = !!offset[fruit.key];
        const isRemoving = removing.has(fruit.key);
        const look = LOOKS[fruit.look];
        return (
          <div
            key={fruit.key}
            ref={(el) => registerEl(fruit.key, el)}
            className={`mb-fruit${shakeKey === fruit.key ? " mb-shake" : ""}${
              isRemoving ? " mb-gone" : ""
            }`}
            onPointerDown={(e) => onDown(e, fruit.key)}
            style={{
              width: FRUIT,
              height: FRUIT,
              transform: `translate3d(${home.x + off.x}px, ${home.y + off.y}px, 0)`,
              transition: dragging ? "none" : undefined,
              zIndex: dragging ? 30 : 5,
            }}
            aria-label={fruit.syl}
          >
            <span className="mb-stem" />
            <span className="mb-leaf" style={{ background: look.leaf }} />
            <span className="mb-body" style={{ background: look.bg, borderRadius: look.radius }} />
            <span className="mb-syl">{fruit.syl}</span>
          </div>
        );
      })}

      {/* the basket (labelled with the target matra) */}
      <div className="mb-basket" ref={basketRef} aria-hidden>
        <span className="mb-basket-chip">{matraChip(matra)}</span>
        <span className="mb-basket-emoji">🧺</span>
        {/* the fruit collected so far, sitting visibly in the basket mouth */}
        {basketed.length > 0 && (
          <div className="mb-pile">
            {basketed.map((f) => (
              <span key={f.key} className="mb-pile-fruit" style={{ background: LOOKS[f.look].bg }}>
                <span className="mb-pile-syl">{f.syl}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const CSS = `
.mb-root {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100%;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  background: linear-gradient(180deg, #bfe9ff 0%, #e6f7ff 46%, #d6f4c8 78%, #eafbd6 100%);
}

/* ---- the tree ---------------------------------------------------------- */
.mb-tree { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.mb-trunk {
  position: absolute;
  left: 50%;
  top: 46%;
  transform: translateX(-50%);
  width: 46px;
  height: 40%;
  background: linear-gradient(90deg, #8a5a2b, #b07636 45%, #8a5a2b);
  border-radius: 12px 12px 0 0;
  box-shadow: inset -6px 0 10px rgba(0,0,0,0.18), inset 6px 0 8px rgba(255,255,255,0.15);
}
.mb-canopy {
  position: absolute;
  border-radius: 50%;
  filter: drop-shadow(0 8px 14px rgba(0,0,0,0.12));
}
.mb-canopy-a {
  left: -6%;
  top: 1%;
  width: 78%;
  height: 52%;
  background: radial-gradient(circle at 38% 32%, #7ed957, #46a531 75%);
}
.mb-canopy-b {
  right: -8%;
  top: 4%;
  width: 74%;
  height: 50%;
  background: radial-gradient(circle at 40% 30%, #8ee36a, #3f9b2c 76%);
}
.mb-canopy-c {
  left: 50%;
  top: -6%;
  transform: translateX(-50%);
  width: 68%;
  height: 50%;
  background: radial-gradient(circle at 42% 34%, #98ea74, #4fb038 78%);
}

/* ---- headers ----------------------------------------------------------- */
.mb-goal {
  position: absolute;
  top: 12px;
  left: 14px;
  right: 108px;
  z-index: 12;
  padding: 8px 14px;
  border-radius: 16px;
  background: rgba(255,255,255,0.92);
  box-shadow: 0 3px 8px rgba(0,0,0,0.15);
  font-size: 16px;
  font-weight: 800;
  color: #0a3d57;
  line-height: 1.25;
  pointer-events: none;
}
.mb-counter {
  position: absolute;
  top: 12px;
  right: 14px;
  z-index: 12;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255,255,255,0.94);
  box-shadow: 0 3px 8px rgba(0,0,0,0.15);
  font-size: 20px;
  font-weight: 800;
  color: #0a3d57;
  pointer-events: none;
}

/* ---- fruits ------------------------------------------------------------ */
.mb-fruit {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  touch-action: none;
  will-change: transform;
  transition: transform 0.16s ease-out, opacity 0.2s ease-out;
  -webkit-tap-highlight-color: transparent;
}
.mb-fruit:active { cursor: grabbing; }
.mb-body {
  position: absolute;
  inset: 6px 0 0 0;
  box-shadow: inset -8px -8px 14px rgba(0,0,0,0.22),
    inset 8px 8px 14px rgba(255,255,255,0.28),
    0 5px 8px rgba(0,0,0,0.24);
}
.mb-stem {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%) rotate(8deg);
  width: 6px;
  height: 12px;
  border-radius: 3px;
  background: #7a4a22;
  z-index: 2;
}
.mb-leaf {
  position: absolute;
  top: 2px;
  left: 58%;
  width: 16px;
  height: 10px;
  border-radius: 0 10px 0 10px;
  transform: rotate(-18deg);
  z-index: 2;
  box-shadow: inset 0 -2px 3px rgba(0,0,0,0.15);
}
.mb-syl {
  position: relative;
  z-index: 3;
  margin-top: 6px;
  min-width: 40px;
  padding: 2px 8px;
  border-radius: 12px;
  background: rgba(255,255,255,0.9);
  box-shadow: 0 1px 3px rgba(0,0,0,0.25);
  font-size: 30px;
  font-weight: 900;
  line-height: 1.05;
  color: #14263a;
  text-align: center;
  text-shadow: 0 1px 0 rgba(255,255,255,0.7);
}
.mb-gone {
  transform: scale(0.32) !important;
  opacity: 0 !important;
  transition: transform 0.24s ease-in, opacity 0.24s ease-in !important;
  pointer-events: none;
}
.mb-shake { animation: mb-shake 0.44s ease; }
@keyframes mb-shake {
  0%, 100% { margin-left: 0; }
  20% { margin-left: -9px; }
  40% { margin-left: 9px; }
  60% { margin-left: -7px; }
  80% { margin-left: 6px; }
}

/* ---- basket ------------------------------------------------------------ */
.mb-basket {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  z-index: 2;
  width: min(74%, 260px);
  min-height: 148px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 10px 8px 6px;
  border-radius: 26px;
  background: rgba(255,255,255,0.30);
  box-shadow: inset 0 0 0 3px rgba(255,255,255,0.55);
  pointer-events: none;
}
.mb-basket-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  padding: 6px 16px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 3px 8px rgba(0,0,0,0.16);
  font-size: 34px;
  font-weight: 800;
  color: #0a3d57;
  line-height: 1;
}
.mb-basket-emoji {
  font-size: 94px;
  line-height: 1;
  margin-top: 2px;
  filter: drop-shadow(0 4px 5px rgba(0,0,0,0.22));
}

/* ---- collected fruit, visibly piled in the basket mouth --------------- */
.mb-pile {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 58px;
  z-index: 4;
  display: flex;
  flex-wrap: wrap-reverse;
  justify-content: center;
  align-items: flex-end;
  gap: 3px 4px;
  pointer-events: none;
}
.mb-pile-fruit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  box-shadow: inset -4px -5px 8px rgba(0,0,0,0.22),
    inset 4px 4px 7px rgba(255,255,255,0.25),
    0 2px 4px rgba(0,0,0,0.28);
  animation: mb-plop 0.3s ease;
}
.mb-pile-syl {
  font-size: 15px;
  font-weight: 900;
  line-height: 1;
  color: #14263a;
  text-shadow: 0 1px 0 rgba(255,255,255,0.55);
}
@keyframes mb-plop {
  0% { transform: translateY(-16px) scale(0.6); opacity: 0; }
  60% { transform: translateY(0) scale(1.12); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
`;
