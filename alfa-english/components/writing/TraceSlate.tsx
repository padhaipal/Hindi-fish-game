"use client";

// ---------------------------------------------------------------------------
// TRACE SLATE — the chalkboard the child traces a single letter on.
// ---------------------------------------------------------------------------
// The target LOWERCASE letter is drawn LARGE and FAINT as a guide. Over the
// letter's ink we scatter a handful of WAYPOINT dots (guided-waypoint tracing,
// like iTrace / LetterSchool / "Trace Letters"). As the child drags a finger,
// the path is drawn in bright chalk and every waypoint the finger passes near
// (within a generous tolerance band) lights up green. When ~all the waypoints
// are lit the slate flashes green and we call onComplete. There is NO stroke-
// order enforcement and NO fragile pixel-coverage test — any order is fine, a
// genuine trace over the whole letter reliably completes, and a tap does not.
//
// Waypoints are derived from the glyph itself: we render it SOLID to an
// offscreen canvas, read its opaque pixels, overlay a grid across the ink's
// bounding box, and take the INK CENTROID of each grid cell that holds enough
// ink. Centroids sit on the actual strokes, so a finger following the letter's
// shape passes right over them. Both layers are high-DPI (dpr capped at 2).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  letter: string; // the lowercase letter to trace
  width: number;
  height: number;
  onComplete: () => void; // called once enough waypoints are lit
}

const GUIDE_FONT = "'Baloo 2', 'Comic Sans MS', sans-serif";
const TARGET_WAYPOINTS = 17; // aim for ~14–20 dots, well spread over the ink
const MAX_WAYPOINTS = 20;
const COMPLETE_FRAC = 0.85; // light this fraction of waypoints to finish
const TOL_FRAC = 0.13; // tolerance radius = min(w, h) * this

type Pt = { x: number; y: number };

// Fit a bold font size so the letter sits comfortably inside the slate.
function fitFont(ctx: CanvasRenderingContext2D, text: string, w: number, h: number): number {
  let fs = Math.floor(h * 0.72);
  const maxW = w * 0.72;
  ctx.font = `800 ${fs}px ${GUIDE_FONT}`;
  while (fs > 12 && ctx.measureText(text).width > maxW) {
    fs -= 2;
    ctx.font = `800 ${fs}px ${GUIDE_FONT}`;
  }
  return fs;
}

// Build the waypoints: grid over the glyph ink's bbox, keep the ink centroid of
// each cell that holds enough ink, aiming for a well-spread ~TARGET_WAYPOINTS.
function buildWaypoints(inkX: number[], inkY: number[]): Pt[] {
  const n = inkX.length;
  if (n === 0) return [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    if (inkX[i] < minX) minX = inkX[i];
    if (inkX[i] > maxX) maxX = inkX[i];
    if (inkY[i] < minY) minY = inkY[i];
    if (inkY[i] > maxY) maxY = inkY[i];
  }
  const bw = Math.max(1, maxX - minX);
  const bh = Math.max(1, maxY - minY);
  const longAxis = Math.max(bw, bh);

  // Try a few grid resolutions (divisions along the longer axis) and keep the
  // one whose waypoint count lands closest to TARGET_WAYPOINTS.
  let best: Pt[] = [];
  let bestScore = Infinity;
  for (let div = 2; div <= 8; div++) {
    const cell = longAxis / div;
    if (cell < 1) break;
    const cols = Math.max(1, Math.ceil(bw / cell));
    const rows = Math.max(1, Math.ceil(bh / cell));
    const sumX = new Float64Array(cols * rows);
    const sumY = new Float64Array(cols * rows);
    const cnt = new Int32Array(cols * rows);
    for (let i = 0; i < n; i++) {
      let c = Math.floor((inkX[i] - minX) / cell);
      let r = Math.floor((inkY[i] - minY) / cell);
      if (c >= cols) c = cols - 1;
      if (r >= rows) r = rows - 1;
      const k = r * cols + c;
      sumX[k] += inkX[i];
      sumY[k] += inkY[i];
      cnt[k]++;
    }
    const minInk = Math.max(6, cell * cell * 0.03); // ignore near-empty cells
    const pts: Pt[] = [];
    for (let k = 0; k < cnt.length; k++) {
      if (cnt[k] >= minInk) pts.push({ x: sumX[k] / cnt[k], y: sumY[k] / cnt[k] });
    }
    const score = Math.abs(pts.length - TARGET_WAYPOINTS);
    if (pts.length >= 8 && score < bestScore) {
      bestScore = score;
      best = pts;
    }
  }
  // Fallback: if every grid was too sparse, use the densest attempt we have.
  if (best.length === 0) {
    const cell = longAxis / 6;
    const cols = Math.max(1, Math.ceil(bw / cell));
    const rows = Math.max(1, Math.ceil(bh / cell));
    const sumX = new Float64Array(cols * rows);
    const sumY = new Float64Array(cols * rows);
    const cnt = new Int32Array(cols * rows);
    for (let i = 0; i < n; i++) {
      let c = Math.floor((inkX[i] - minX) / cell);
      let r = Math.floor((inkY[i] - minY) / cell);
      if (c >= cols) c = cols - 1;
      if (r >= rows) r = rows - 1;
      const k = r * cols + c;
      sumX[k] += inkX[i];
      sumY[k] += inkY[i];
      cnt[k]++;
    }
    for (let k = 0; k < cnt.length; k++) {
      if (cnt[k] > 0) best.push({ x: sumX[k] / cnt[k], y: sumY[k] / cnt[k] });
    }
  }

  // Even-spread subsample if we overshot: sort top-to-bottom, left-to-right and
  // keep evenly spaced indices so the survivors still cover the whole letter.
  if (best.length > MAX_WAYPOINTS) {
    best.sort((a, b) => a.y - b.y || a.x - b.x);
    const keep: Pt[] = [];
    const step = best.length / MAX_WAYPOINTS;
    for (let i = 0; i < MAX_WAYPOINTS; i++) keep.push(best[Math.floor(i * step)]);
    best = keep;
  }
  return best;
}

export default function TraceSlate({ letter, width, height, onComplete }: Props) {
  const guideRef = useRef<HTMLCanvasElement>(null); // faint letter + waypoint dots
  const traceRef = useRef<HTMLCanvasElement>(null); // bright chalk trail
  const fontPx = useRef(0);
  const waypoints = useRef<Pt[]>([]);
  const lit = useRef<boolean[]>([]);
  const litCount = useRef(0);
  const drawing = useRef(false);
  const pointerId = useRef<number | null>(null);
  const lastPt = useRef<Pt | null>(null);
  const doneRef = useRef(false);
  const [flash, setFlash] = useState(false);

  const tol = Math.min(width, height) * TOL_FRAC;
  const dotR = Math.max(3.5, Math.min(width, height) * 0.014);

  // Paint the faint guide letter and the waypoint dots (green where lit).
  const paintGuide = useCallback(() => {
    const c = guideRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.font = `800 ${fontPx.current}px ${GUIDE_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(233, 237, 234, 0.26)"; // light grey, faint
    ctx.fillText(letter, width / 2, height / 2);
    const wps = waypoints.current;
    for (let i = 0; i < wps.length; i++) {
      const on = lit.current[i];
      ctx.beginPath();
      ctx.arc(wps[i].x, wps[i].y, dotR, 0, Math.PI * 2);
      ctx.fillStyle = on ? "rgba(86, 226, 122, 0.95)" : "rgba(233, 237, 234, 0.5)";
      ctx.fill();
      if (on) {
        ctx.beginPath();
        ctx.arc(wps[i].x, wps[i].y, dotR + 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(86, 226, 122, 0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    ctx.restore();
  }, [letter, width, height, dotR]);

  // Wipe the child's chalk and reset lit waypoints.
  const wipe = useCallback(() => {
    const t = traceRef.current;
    if (t) t.getContext("2d")!.clearRect(0, 0, width, height);
    lit.current = waypoints.current.map(() => false);
    litCount.current = 0;
    lastPt.current = null;
    paintGuide();
  }, [paintGuide, width, height]);

  // ---- (re)build guide + waypoints whenever letter/size changes ----
  useEffect(() => {
    doneRef.current = false;
    setFlash(false);
    const g = guideRef.current;
    const t = traceRef.current;
    if (!g || !t) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const c of [g, t]) {
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
      const ctx = c.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
    }

    const gctx = g.getContext("2d")!;
    fontPx.current = fitFont(gctx, letter, width, height);

    // Render the glyph SOLID offscreen (CSS resolution) and read its ink.
    const off = document.createElement("canvas");
    off.width = width;
    off.height = height;
    const octx = off.getContext("2d")!;
    octx.font = `800 ${fontPx.current}px ${GUIDE_FONT}`;
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.fillStyle = "#000";
    octx.fillText(letter, width / 2, height / 2);
    const data = octx.getImageData(0, 0, width, height).data;
    const inkX: number[] = [];
    const inkY: number[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 80) {
          inkX.push(x);
          inkY.push(y);
        }
      }
    }
    waypoints.current = buildWaypoints(inkX, inkY);
    lit.current = waypoints.current.map(() => false);
    litCount.current = 0;
    lastPt.current = null;
    t.getContext("2d")!.clearRect(0, 0, width, height);
    paintGuide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter, width, height]);

  // Light up every waypoint within tolerance of a path point.
  const lightAt = (x: number, y: number): boolean => {
    let changed = false;
    const wps = waypoints.current;
    for (let i = 0; i < wps.length; i++) {
      if (lit.current[i]) continue;
      if (Math.hypot(wps[i].x - x, wps[i].y - y) <= tol) {
        lit.current[i] = true;
        litCount.current++;
        changed = true;
      }
    }
    return changed;
  };

  const checkComplete = useCallback(() => {
    if (doneRef.current) return;
    const total = waypoints.current.length;
    if (total === 0) return;
    if (litCount.current / total >= COMPLETE_FRAC) {
      doneRef.current = true;
      setFlash(true);
      window.setTimeout(() => onComplete(), 220);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete]);

  // ---- drawing ------------------------------------------------------------
  const toXY = (e: React.PointerEvent): Pt => {
    const r = traceRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (e: React.PointerEvent) => {
    if (doneRef.current || flash) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointerId.current = e.pointerId;
    drawing.current = true;
    const p = toXY(e);
    lastPt.current = p;
    const ctx = traceRef.current!.getContext("2d")!;
    ctx.strokeStyle = "#fdf3d0"; // bright chalk
    ctx.lineWidth = Math.max(9, width * 0.03);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
    if (lightAt(p.x, p.y)) paintGuide();
    checkComplete();
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current || e.pointerId !== pointerId.current) return;
    const p = toXY(e);
    const last = lastPt.current;
    const ctx = traceRef.current!.getContext("2d")!;
    ctx.beginPath();
    if (last) ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    // Interpolate so fast swipes still catch every dot along the segment.
    let changed = false;
    if (last) {
      const steps = Math.max(1, Math.ceil(Math.hypot(p.x - last.x, p.y - last.y) / 4));
      for (let i = 1; i <= steps; i++) {
        const ix = last.x + ((p.x - last.x) * i) / steps;
        const iy = last.y + ((p.y - last.y) * i) / steps;
        if (lightAt(ix, iy)) changed = true;
      }
    } else if (lightAt(p.x, p.y)) {
      changed = true;
    }
    if (changed) paintGuide();
    lastPt.current = p;
    checkComplete();
  };

  const onUp = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerId.current) return;
    drawing.current = false;
    lastPt.current = null;
    pointerId.current = null;
  };

  return (
    <div
      className={`slate ${flash ? "slate--green" : ""}`}
      style={{ width, height }}
      data-text={letter}
    >
      <canvas ref={guideRef} className="slateGuide" style={{ width, height }} />
      <canvas
        ref={traceRef}
        className="slateCanvas"
        style={{ width, height }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      <button type="button" className="slateClear" onClick={wipe} aria-label="Clear">
        ↺
      </button>
    </div>
  );
}
