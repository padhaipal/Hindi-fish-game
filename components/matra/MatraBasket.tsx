"use client";

// ---------------------------------------------------------------------------
// MATRA BASKET (मात्रा टोकरी) — one stop in a per-matra adventure.
// ---------------------------------------------------------------------------
// A single-MATRA sorting game. Syllable tiles float in the upper area — some
// carry the TARGET matra (का, पा, मा … when the target is ा) and some carry a
// DIFFERENT matra (कि, कु, को …). The child DRAGS the tiles that have the target
// matra into the basket at the bottom, and leaves the rest.
//
// Deliberately FORGIVING: no lose / time-up / exit. A wrong tile dropped on the
// basket gives a soft "baaap", shakes and snaps back — it is never counted and
// never removed. A tile dropped anywhere off the basket just snaps home. Once
// the child has collected COLLECT (6) target tiles we call onDone() exactly once
// (guarded by a ref) and the parent adventure takes over — this component owns
// no navigation or overlays.
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

// How many TARGET tiles the child must basket to finish this stop.
const COLLECT = 6;
// How many tiles we try to keep on the board at once (a loose scatter).
const TILE_COUNT = 6;
// Tile size in px (kept in sync with .mb-tile below).
const TILE = 72;

// Cheerful, high-contrast tile fills — the syllable is drawn in dark text so it
// stays readable on every one. We rotate through these as tiles spawn.
const COLORS = [
  "#ff8787", // red
  "#ffa94d", // orange
  "#ffd43b", // yellow
  "#69db7c", // green
  "#4dabf7", // blue
  "#da77f2", // purple
  "#3bc9db", // teal
];

interface Tile {
  key: number; // unique, stable identity
  slot: number; // which layout slot it sits in
  char: string; // the consonant character
  matra: Matra; // the matra this tile carries
  isTarget: boolean; // does it carry the target matra?
  syl: string; // the rendered syllable, e.g. "का"
  color: string;
}

type Pt = { x: number; y: number };

export default function MatraBasket({ matraId, onDone }: Props) {
  const matra = getMatra(matraId);
  // The matras that are NOT the target — used to build distractor tiles. We
  // filter by the RESOLVED target id (not the raw prop) so a distractor can
  // never accidentally equal the target.
  const otherMatras = useMemo(
    () => MATRAS.filter((m) => m.id !== matra.id),
    [matra.id]
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const basketRef = useRef<HTMLDivElement>(null);
  const elsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [offset, setOffset] = useState<Record<number, Pt>>({});
  const [removing, setRemoving] = useState<Set<number>>(new Set());
  const [shakeKey, setShakeKey] = useState<number | null>(null);
  const [collected, setCollected] = useState(0);

  const drag = useRef<{ key: number; sx: number; sy: number; pid: number } | null>(null);
  const keySeq = useRef(0);
  const colorSeq = useRef(0);
  const collectedRef = useRef(0);
  const doneRef = useRef(false);
  const seededRef = useRef(false);
  const introRef = useRef(false);
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

  const registerEl = useCallback((key: number, el: HTMLDivElement | null) => {
    if (el) elsRef.current.set(key, el);
    else elsRef.current.delete(key);
  }, []);

  // ---- slot layout: a loose 2-row grid in the upper area ------------------
  // Slots keep tiles from overlapping each other or the basket. Each slot is a
  // top-left home position for a TILE-sized square, with a little deterministic
  // jitter so the row looks scattered rather than mechanical.
  const slots = useMemo<Pt[]>(() => {
    if (!dims) return [];
    const { w, h } = dims;
    const cols = w < 330 ? 2 : 3;
    const rows = Math.ceil(TILE_COUNT / cols);
    const topPad = 64; // room for the counter chip up top
    const basketZone = Math.max(150, Math.min(h * 0.34, 200)); // reserved bottom
    const areaTop = topPad;
    const areaH = Math.max(TILE * rows, h - basketZone - topPad);
    const cellW = w / cols;
    const cellH = areaH / rows;
    const out: Pt[] = [];
    for (let i = 0; i < TILE_COUNT; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const jx = Math.sin(i * 12.9898) * (cellW - TILE) * 0.18;
      const jy = Math.cos(i * 4.1414) * (cellH - TILE) * 0.14;
      let x = col * cellW + (cellW - TILE) / 2 + jx;
      let y = areaTop + row * cellH + (cellH - TILE) / 2 + jy;
      x = Math.max(6, Math.min(w - TILE - 6, x));
      y = Math.max(topPad, Math.min(areaTop + areaH - TILE, y));
      out.push({ x, y });
    }
    return out;
  }, [dims]);

  // ---- build one tile for a given slot ------------------------------------
  const makeTile = useCallback(
    (slot: number, forceTarget: boolean): Tile => {
      const isTarget = forceTarget || Math.random() < 0.5;
      const consonant = LETTERS[Math.floor(Math.random() * LETTERS.length)];
      const m = isTarget
        ? matra
        : otherMatras[Math.floor(Math.random() * otherMatras.length)];
      return {
        key: keySeq.current++,
        slot,
        char: consonant.char,
        matra: m,
        isTarget,
        syl: syllable(consonant.char, m),
        color: COLORS[colorSeq.current++ % COLORS.length],
      };
    },
    [matra, otherMatras]
  );

  // ---- spawn `count` tiles into free slots, keeping ≥2 targets present -----
  const spawn = useCallback(
    (count: number) => {
      setTiles((prev) => {
        const occupied = new Set(prev.map((t) => t.slot));
        const free: number[] = [];
        for (let i = 0; i < TILE_COUNT; i++) if (!occupied.has(i)) free.push(i);
        const next = [...prev];
        let targets = prev.filter((t) => t.isTarget).length;
        for (let k = 0; k < count && free.length > 0; k++) {
          const slot = free.shift() as number;
          const t = makeTile(slot, targets < 2);
          if (t.isTarget) targets += 1;
          next.push(t);
        }
        return next;
      });
    },
    [makeTile]
  );

  // ---- seed the board once the area has been measured ---------------------
  useEffect(() => {
    if (!dims || seededRef.current) return;
    seededRef.current = true;
    spawn(TILE_COUNT);
  }, [dims, spawn]);

  // ---- drag handling (pointer capture on the tile; area catches move/up) ---
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

  const collect = (tile: Tile) => {
    speakSyllable(tile.syl);
    playBingSound();
    collectedRef.current += 1;
    setCollected(collectedRef.current);

    // Play a quick shrink-into-basket animation, then drop the tile and (unless
    // we're finished) refill its slot so ~6 tiles stay on the board.
    setRemoving((s) => new Set(s).add(tile.key));
    snapBack(tile.key);
    const finished = collectedRef.current >= COLLECT;
    later(() => {
      setTiles((prev) => prev.filter((t) => t.key !== tile.key));
      setRemoving((s) => {
        const n = new Set(s);
        n.delete(tile.key);
        return n;
      });
      elsRef.current.delete(tile.key);
      if (!finished) spawn(1);
    }, 240);

    if (finished && !doneRef.current) {
      doneRef.current = true;
      later(() => onDone(), 520); // small beat so the last tile is seen landing
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.pid) return;
    drag.current = null;
    const tile = tiles.find((t) => t.key === d.key);
    const el = elsRef.current.get(d.key);
    const basket = basketRef.current;
    if (!tile || !el || !basket || removing.has(d.key)) {
      snapBack(d.key);
      return;
    }
    const tr = el.getBoundingClientRect();
    const cx = tr.left + tr.width / 2;
    const cy = tr.top + tr.height / 2;
    const br = basket.getBoundingClientRect();
    // Generous catch area: a little padding around the basket rect.
    const overBasket =
      cx > br.left - 24 &&
      cx < br.right + 24 &&
      cy > br.top - 30 &&
      cy < br.bottom + 24;

    if (overBasket) {
      if (tile.isTarget) collect(tile);
      else reject(tile.key);
    } else {
      snapBack(tile.key);
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

      {/* progress counter */}
      <div className="mb-counter" aria-live="polite">
        🧺 {collected}/{COLLECT}
      </div>

      {/* the tiles */}
      {tiles.map((tile) => {
        const home = slots[tile.slot] ?? { x: 0, y: 0 };
        const off = offset[tile.key] ?? { x: 0, y: 0 };
        const dragging = !!offset[tile.key];
        const isRemoving = removing.has(tile.key);
        return (
          <div
            key={tile.key}
            ref={(el) => registerEl(tile.key, el)}
            className={`mb-tile${shakeKey === tile.key ? " mb-shake" : ""}${
              isRemoving ? " mb-gone" : ""
            }`}
            onPointerDown={(e) => onDown(e, tile.key)}
            style={{
              width: TILE,
              height: TILE,
              background: tile.color,
              transform: `translate3d(${home.x + off.x}px, ${home.y + off.y}px, 0)`,
              transition: dragging ? "none" : undefined,
              zIndex: dragging ? 30 : 5,
            }}
            aria-label={tile.syl}
          >
            {tile.syl}
          </div>
        );
      })}

      {/* the basket (labelled with the target matra) */}
      <div className="mb-basket" ref={basketRef} aria-hidden>
        <span className="mb-basket-chip">{matraChip(matra)}</span>
        <span className="mb-basket-emoji">🧺</span>
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
  background: linear-gradient(180deg, #d3f0ff 0%, #eaf9ff 48%, #fff3dc 100%);
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
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  font-size: 20px;
  font-weight: 800;
  color: #0a3d57;
  pointer-events: none;
}
.mb-tile {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  font-size: 38px;
  font-weight: 800;
  line-height: 1;
  color: #1a1330;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.55);
  box-shadow: inset 0 3px 6px rgba(255, 255, 255, 0.55),
    inset 0 -4px 8px rgba(0, 0, 0, 0.14), 0 4px 8px rgba(0, 0, 0, 0.2);
  cursor: grab;
  touch-action: none;
  will-change: transform;
  transition: transform 0.16s ease-out, opacity 0.2s ease-out;
  -webkit-tap-highlight-color: transparent;
}
.mb-tile:active { cursor: grabbing; }
.mb-gone {
  transform: scale(0.35) !important;
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
.mb-basket {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  z-index: 2;
  width: min(74%, 260px);
  min-height: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  padding: 10px 8px 6px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.34);
  box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.55);
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
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.16);
  font-size: 34px;
  font-weight: 800;
  color: #0a3d57;
  line-height: 1;
}
.mb-basket-emoji {
  font-size: 96px;
  line-height: 1;
  margin-top: 2px;
  filter: drop-shadow(0 4px 5px rgba(0, 0, 0, 0.22));
}
`;
