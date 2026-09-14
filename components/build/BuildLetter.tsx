"use client";

// ---------------------------------------------------------------------------
// BUILD THE LETTER — one stop in the letter adventure.
// ---------------------------------------------------------------------------
// The letter is shown as a faint "guide" (all its pen strokes, from the same
// medial-axis stroke data the tracing game uses). Each stroke is also a solid,
// colourful PIECE scattered around the board. The child drags each piece onto
// its matching place in the guide; when it lands close enough it snaps home and
// turns green. Placing the last piece assembles the whole letter -> onDone().
//
// Order is not enforced (any piece, any time) so it stays gentle for 4-7s.
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

const MARGIN = 0.16; // empty margin fraction around the assembled letter
const PIECE_COLORS = ["#e8477a", "#f08a24", "#2fa84f", "#3d7de0", "#8a5cf0", "#0aa5b5"];

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
  const [size, setSize] = useState(320);
  const introRef = useRef(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const f = () => setSize(Math.min(window.innerWidth - 36, 360, window.innerHeight - 250));
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  useEffect(() => {
    if (introRef.current) return;
    introRef.current = true;
    unlockAudio();
    const t = window.setTimeout(() => playLetterSound(letterWordAudio(letterId)), 350);
    return () => window.clearTimeout(t);
  }, [letterId]);

  // Fit the strokes into the board and compute each piece's home + start spot.
  const model = useMemo(() => {
    const raw = getLetterStrokes(letterId);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of raw) for (const [x, y] of s) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    const bw = Math.max(1e-3, maxX - minX);
    const bh = Math.max(1e-3, maxY - minY);
    const scale = (size * (1 - 2 * MARGIN)) / Math.max(bw, bh);
    const offX = (size - bw * scale) / 2;
    const offY = (size - bh * scale) / 2;
    const map = ([x, y]: number[]): Pt => ({ x: offX + (x - minX) * scale, y: offY + (y - minY) * scale });
    const lw = Math.max(12, size * 0.11);
    const pad = lw * 0.75;

    const pieces = raw.map((stroke, i) => {
      const pts = stroke.map(map);
      let sx0 = Infinity, sy0 = Infinity, sx1 = -Infinity, sy1 = -Infinity;
      for (const p of pts) {
        if (p.x < sx0) sx0 = p.x; if (p.x > sx1) sx1 = p.x;
        if (p.y < sy0) sy0 = p.y; if (p.y > sy1) sy1 = p.y;
      }
      const w = sx1 - sx0 + 2 * pad;
      const h = sy1 - sy0 + 2 * pad;
      // Points relative to the piece box.
      const rel = pts.map((p) => ({ x: p.x - sx0 + pad, y: p.y - sy0 + pad }));
      // Home top-left within the board.
      const homeX = sx0 - pad;
      const homeY = sy0 - pad;
      // Scatter start: push each piece outward from centre so they don't stack.
      const ang = (i / raw.length) * Math.PI * 2 + 0.6;
      const spread = size * 0.34;
      let startX = homeX + Math.cos(ang) * spread;
      let startY = homeY + Math.sin(ang) * spread;
      // Keep every piece fully inside the board (never over the hint above it).
      startX = Math.max(4, Math.min(size - w - 4, startX));
      startY = Math.max(4, Math.min(size - h - 4, startY));
      return { i, w, h, rel, d: pathFrom(rel), homeX, homeY, startX, startY, color: PIECE_COLORS[i % PIECE_COLORS.length] };
    });
    // Guide paths (whole letter, faint), in board coords.
    const guide = raw.map((s) => pathFrom(s.map(map)));
    return { pieces, guide, lw };
  }, [letterId, size]);

  const [pos, setPos] = useState<Record<number, Pt>>({});
  const [placed, setPlaced] = useState<Record<number, boolean>>({});
  const drag = useRef<{ i: number; dx: number; dy: number; pid: number } | null>(null);

  // Reset piece positions whenever the model changes (letter / resize).
  useEffect(() => {
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
    if (!d || e.pointerId !== d.pid) return;
    drag.current = null;
    const pc = model.pieces[d.i];
    const cur = pos[d.i] ?? { x: pc.startX, y: pc.startY };
    const dist = Math.hypot(cur.x + pc.w / 2 - (pc.homeX + pc.w / 2), cur.y + pc.h / 2 - (pc.homeY + pc.h / 2));
    if (dist <= size * 0.16) {
      // Snap home.
      setPos((p) => ({ ...p, [d.i]: { x: pc.homeX, y: pc.homeY } }));
      setPlaced((pl) => {
        const next = { ...pl, [d.i]: true };
        playLetterSound(letter.audio);
        if (Object.keys(next).length >= model.pieces.length && !doneRef.current) {
          doneRef.current = true;
          window.setTimeout(() => playWinSound(), 200);
          window.setTimeout(() => onDone(), 1100);
        } else {
          playBingSound();
        }
        return next;
      });
    }
  };

  const allDone = Object.keys(placed).length >= model.pieces.length;

  return (
    <div className="advBuild">
      <p className="advHint">टुकड़ों को खींचकर “{letter.char}” बनाओ 🧩</p>
      <div
        className="bld-board"
        style={{ width: size, height: size, position: "relative", touchAction: "none" }}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        {/* faint guide of the whole letter */}
        <svg width={size} height={size} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {model.guide.map((d, k) => (
            <path key={k} d={d} fill="none" stroke="#0a3d5733" strokeWidth={model.lw}
              strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>
        {/* pieces */}
        {model.pieces.map((pc) => {
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
                left: 0, top: 0,
                width: pc.w, height: pc.h,
                transform: `translate3d(${p.x}px, ${p.y}px, 0)`,
                cursor: isPlaced ? "default" : "grab",
                touchAction: "none",
                zIndex: isPlaced ? 1 : 5,
              }}
            >
              <svg width={pc.w} height={pc.h} style={{ display: "block", overflow: "visible" }}>
                <path d={pc.d} fill="none" stroke={isPlaced ? "#2fa84f" : pc.color}
                  strokeWidth={model.lw} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          );
        })}
        {allDone && <div className="bld-pop">{letter.char}</div>}
      </div>

      <style>{`
        .bld-piece { filter: drop-shadow(0 3px 3px #0003); transition: transform .06s linear; }
        .bld-piece:active { cursor: grabbing; }
        .bld-placed { transition: none; }
        .bld-pop {
          position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
          font-size:${Math.round(size * 0.5)}px; font-weight:800; color:#2fa84f;
          animation: bldPop .8s ease; pointer-events:none;
        }
        @keyframes bldPop { 0%{transform:scale(.4);opacity:0} 40%{transform:scale(1.15);opacity:1} 100%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  );
}
