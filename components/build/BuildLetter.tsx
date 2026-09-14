"use client";

// ---------------------------------------------------------------------------
// BUILD THE LETTER — one stop in the letter adventure.
// ---------------------------------------------------------------------------
// The letter's pen strokes (from the same medial-axis data the tracing game
// uses) start as loose, colourful PIECES lined up along the BOTTOM of the
// screen. The child drags each piece up into the empty assembly area; when a
// piece lands close enough to where it belongs it snaps home and turns green.
// There is no outline to trace — the letter simply appears, in green, as the
// pieces click into place. Placing the last piece finishes the stop.
//
// Self-contained: inline styles + one injected <style> (bld- prefixed).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLetterStrokes } from "@/lib/lekhan/hindiStrokes";
import { getLetter, letterWordAudio } from "@/lib/letters";
import { playLetterSound, playBingSound, playWinSound, unlockAudio } from "@/lib/audio";

interface Props {
  letterId: string;
  onDone: () => void;
}

type Pt = { x: number; y: number };

const MARGIN = 0.14; // empty margin fraction inside the assembly box
const PIECE_COLORS = ["#e8477a", "#f08a24", "#3d7de0", "#8a5cf0", "#0aa5b5", "#2fa84f"];

// Build a smoothed SVG path `d` (quadratic through segment midpoints).
function pathFrom(pts: Pt[]): string {
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} l 0.01 0.01`;
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q ${pts[i].x} ${pts[i].y} ${xc} ${yc}`;
  }
  d += ` Q ${pts[pts.length - 2].x} ${pts[pts.length - 2].y} ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
  return d;
}

export default function BuildLetter({ letterId, onDone }: Props) {
  const letter = getLetter(letterId);
  const areaRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const introRef = useRef(false);
  const doneRef = useRef(false);

  // Measure the play area (assembly zone on top, tray at the bottom).
  useEffect(() => {
    const measure = () => {
      const el = areaRef.current;
      if (el) setDims({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (introRef.current) return;
    introRef.current = true;
    unlockAudio();
    const t = window.setTimeout(() => playLetterSound(letterWordAudio(letterId)), 350);
    return () => window.clearTimeout(t);
  }, [letterId]);

  // Fit the strokes into an assembly box (upper area) and lay the loose pieces
  // out along the bottom.
  const model = useMemo(() => {
    if (!dims) return null;
    const { w: W, h: H } = dims;
    const raw = getLetterStrokes(letterId);

    // Assembly box — where the letter forms, in the upper part of the area.
    const A = Math.min(W * 0.84, H * 0.5);
    const ax = (W - A) / 2;
    const ay = H * 0.03;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of raw) for (const [x, y] of s) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    const bw = Math.max(1e-3, maxX - minX);
    const bh = Math.max(1e-3, maxY - minY);
    const scale = (A * (1 - 2 * MARGIN)) / Math.max(bw, bh);
    const offX = ax + (A - bw * scale) / 2;
    const offY = ay + (A - bh * scale) / 2;
    const map = ([x, y]: number[]): Pt => ({ x: offX + (x - minX) * scale, y: offY + (y - minY) * scale });
    const lw = Math.max(12, A * 0.12);
    const pad = lw * 0.72;

    // Tray band along the bottom for the loose pieces.
    const trayTop = ay + A + Math.max(16, H * 0.04);
    const trayBot = H - 6;
    const n = raw.length;

    const pieces = raw.map((stroke, i) => {
      const pts = stroke.map(map);
      let sx0 = Infinity, sy0 = Infinity, sx1 = -Infinity, sy1 = -Infinity;
      for (const p of pts) {
        if (p.x < sx0) sx0 = p.x; if (p.x > sx1) sx1 = p.x;
        if (p.y < sy0) sy0 = p.y; if (p.y > sy1) sy1 = p.y;
      }
      const w = sx1 - sx0 + 2 * pad;
      const h = sy1 - sy0 + 2 * pad;
      const rel = pts.map((p) => ({ x: p.x - sx0 + pad, y: p.y - sy0 + pad }));
      const homeX = sx0 - pad;
      const homeY = sy0 - pad;
      // Start spot: spread across the bottom band, small vertical jitter.
      const slotW = W / n;
      let startX = i * slotW + (slotW - w) / 2;
      startX = Math.max(4, Math.min(W - w - 4, startX));
      const bandH = Math.max(1, trayBot - trayTop - h);
      let startY = trayTop + ((i % 2) * 0.4 + 0.1) * bandH;
      startY = Math.max(trayTop, Math.min(trayBot - h, startY));
      return { i, w, h, d: pathFrom(rel), homeX, homeY, startX, startY, color: PIECE_COLORS[i % PIECE_COLORS.length] };
    });
    // Faint outline of the whole letter, shown in the assembly area as a target
    // to drop the pieces onto (the pieces themselves start down in the tray).
    const guide = raw.map((s) => pathFrom(s.map(map)));
    return { pieces, guide, lw, tol: A * 0.2 };
  }, [letterId, dims]);

  const [pos, setPos] = useState<Record<number, Pt>>({});
  const [placed, setPlaced] = useState<Record<number, boolean>>({});
  const drag = useRef<{ i: number; dx: number; dy: number; pid: number } | null>(null);

  useEffect(() => {
    if (!model) return;
    const p: Record<number, Pt> = {};
    for (const pc of model.pieces) p[pc.i] = { x: pc.startX, y: pc.startY };
    setPos(p);
    setPlaced({});
    doneRef.current = false;
  }, [model]);

  const onDown = (e: React.PointerEvent, i: number) => {
    if (placed[i]) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const cur = pos[i] ?? { x: 0, y: 0 };
    drag.current = { i, dx: e.clientX - cur.x, dy: e.clientY - cur.y, pid: e.pointerId };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.pid) return;
    setPos((p) => ({ ...p, [d.i]: { x: e.clientX - d.dx, y: e.clientY - d.dy } }));
  };
  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.pid || !model) return;
    drag.current = null;
    const pc = model.pieces[d.i];
    const cur = pos[d.i] ?? { x: pc.startX, y: pc.startY };
    const dist = Math.hypot(cur.x - pc.homeX, cur.y - pc.homeY);
    if (dist <= model.tol) {
      setPos((p) => ({ ...p, [d.i]: { x: pc.homeX, y: pc.homeY } }));
      setPlaced((pl) => {
        const next = { ...pl, [d.i]: true };
        if (Object.keys(next).length >= model.pieces.length && !doneRef.current) {
          doneRef.current = true;
          playLetterSound(letter.audio);
          window.setTimeout(() => playWinSound(), 150);
          window.setTimeout(() => onDone(), 950);
        } else {
          playBingSound();
        }
        return next;
      });
    }
  };

  return (
    <div className="bld-stage">
      <p className="advHint">टुकड़ों को खींचकर “{letter.char}” बनाओ 🧩</p>
      <div
        className="bld-area"
        ref={areaRef}
        style={{ touchAction: "none" }}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {/* faint outline of the letter to drop the pieces onto */}
        {model && (
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {model.guide.map((d, k) => (
              <path key={k} d={d} fill="none" stroke="#0a3d5722" strokeWidth={model.lw}
                strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </svg>
        )}
        {model &&
          model.pieces.map((pc) => {
            const p = pos[pc.i] ?? { x: pc.startX, y: pc.startY };
            const isPlaced = !!placed[pc.i];
            return (
              <div
                key={pc.i}
                className={`bld-piece${isPlaced ? " bld-placed" : ""}`}
                data-home-x={pc.homeX}
                data-home-y={pc.homeY}
                onPointerDown={(e) => onDown(e, pc.i)}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: pc.w,
                  height: pc.h,
                  transform: `translate3d(${p.x}px, ${p.y}px, 0)`,
                  cursor: isPlaced ? "default" : "grab",
                  touchAction: "none",
                  zIndex: isPlaced ? 1 : 5,
                }}
              >
                <svg width={pc.w} height={pc.h} style={{ display: "block", overflow: "visible" }}>
                  <path
                    d={pc.d}
                    fill="none"
                    stroke={isPlaced ? "#2fa84f" : pc.color}
                    strokeWidth={model.lw}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            );
          })}
      </div>

      <style>{`
        .bld-stage { height:100%; box-sizing:border-box; display:flex; flex-direction:column;
          align-items:center; padding:58px 10px 8px; }
        .bld-area { position:relative; width:100%; max-width:460px; flex:1 1 auto; }
        .bld-piece { filter: drop-shadow(0 3px 3px #0003); transition: transform .05s linear; }
        .bld-piece:active { cursor: grabbing; }
        .bld-placed { transition: none; }
      `}</style>
    </div>
  );
}
