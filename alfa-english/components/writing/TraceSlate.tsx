"use client";

// ---------------------------------------------------------------------------
// TRACE SLATE — the chalkboard the child traces a single letter on.
// ---------------------------------------------------------------------------
// The target LOWERCASE letter is drawn LARGE and FAINT as a guide. Over it we
// place a single-file line of WAYPOINT dots that runs down the CENTRE-LINE
// (skeleton) of the letter, plus one larger RED start dot at the top so the
// child knows where to begin. As the child drags a finger the path is drawn in
// bright chalk — CLIPPED to the letter's silhouette so a mark can never appear
// outside the outline — and every waypoint the finger passes near (within a
// generous tolerance) lights green. When ~85% of the waypoints are lit the
// slate flashes green and we call onComplete. No stroke-order enforcement and
// no fragile pixel-coverage test: any order works, a genuine trace over the
// whole letter reliably completes, and a tap does not.
//
// HOW THE WAYPOINTS ARE FOUND
//   1. Render the glyph SOLID to an offscreen canvas and read its opaque pixels.
//   2. Rasterise that ink into a small binary grid (long axis ~130 px).
//   3. Zhang–Suen morphological THINNING reduces every stroke to a 1-px-wide
//      skeleton (the centre-line).
//   4. Walk the skeleton as a connected path (DFS from the top-most endpoint,
//      re-emitting parents on backtrack so the path stays continuous) and
//      resample it into evenly-spaced, ORDERED waypoints — one neat line of
//      dots through the middle of each stroke, not a cloud.
//
// CLIPPING
//   The letter is also rendered OPAQUE into a persistent MASK canvas. The raw
//   chalk accumulates on an offscreen TRAIL canvas; each frame we composite
//   trail → visible, then globalCompositeOperation "destination-in" with the
//   mask, so only the parts of the stroke INSIDE the letter are ever shown.
// All layers are high-DPI (dpr capped at 2).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  letter: string; // the lowercase letter to trace
  width: number;
  height: number;
  onComplete: () => void; // called once enough waypoints are lit
}

const GUIDE_FONT = "'Baloo 2', 'Comic Sans MS', sans-serif";
const MIN_DOTS = 10;
const MAX_DOTS = 16; // aim for ~10–16 centre-line dots
const SKEL_LONG = 130; // long axis of the binary grid used for thinning
const COMPLETE_FRAC = 0.85; // light this fraction of waypoints to finish
const TOL_FRAC = 0.12; // tolerance radius = min(w, h) * this

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

// Zhang–Suen thinning: reduce a binary grid (0/1) to a 1-px-wide skeleton.
function thin(grid: Uint8Array, w: number, h: number): void {
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : grid[y * w + x]);
  const toClear: number[] = [];
  let changed = true;
  while (changed) {
    changed = false;
    for (let step = 0; step < 2; step++) {
      toClear.length = 0;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          if (!grid[y * w + x]) continue;
          const p2 = at(x, y - 1);
          const p3 = at(x + 1, y - 1);
          const p4 = at(x + 1, y);
          const p5 = at(x + 1, y + 1);
          const p6 = at(x, y + 1);
          const p7 = at(x - 1, y + 1);
          const p8 = at(x - 1, y);
          const p9 = at(x - 1, y - 1);
          const nb = [p2, p3, p4, p5, p6, p7, p8, p9];
          let b = 0;
          for (let i = 0; i < 8; i++) b += nb[i];
          if (b < 2 || b > 6) continue;
          let a = 0;
          for (let i = 0; i < 8; i++) if (nb[i] === 0 && nb[(i + 1) % 8] === 1) a++;
          if (a !== 1) continue;
          if (step === 0) {
            if (p2 * p4 * p6 !== 0) continue;
            if (p4 * p6 * p8 !== 0) continue;
          } else {
            if (p2 * p4 * p8 !== 0) continue;
            if (p2 * p6 * p8 !== 0) continue;
          }
          toClear.push(y * w + x);
        }
      }
      if (toClear.length) {
        changed = true;
        for (const k of toClear) grid[k] = 0;
      }
    }
  }
}

// Build the ordered centre-line waypoints from the glyph ink pixels.
// Returns points ordered from the start (top) along the skeleton; index 0 is
// the start point.
function buildWaypoints(inkX: number[], inkY: number[], minDim: number): Pt[] {
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
  const factor = Math.min(1, SKEL_LONG / longAxis);
  const pad = 2;
  const gw = Math.ceil(bw * factor) + pad * 2 + 1;
  const gh = Math.ceil(bh * factor) + pad * 2 + 1;
  const grid = new Uint8Array(gw * gh);
  for (let i = 0; i < n; i++) {
    let gx = pad + Math.floor((inkX[i] - minX) * factor);
    let gy = pad + Math.floor((inkY[i] - minY) * factor);
    if (gx < 0) gx = 0;
    if (gy < 0) gy = 0;
    if (gx >= gw) gx = gw - 1;
    if (gy >= gh) gy = gh - 1;
    grid[gy * gw + gx] = 1;
  }

  thin(grid, gw, gh);

  // Collect skeleton pixels and count how many there are.
  const dirs = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ];
  const neighbors = (k: number): number[] => {
    const x = k % gw;
    const y = (k - x) / gw;
    const out: number[] = [];
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
      if (grid[ny * gw + nx]) out.push(ny * gw + nx);
    }
    return out;
  };

  let total = 0;
  let start = -1;
  let startY = Infinity;
  let endTopY = Infinity;
  // First pass: total count, and the top-most skeleton pixel as a fallback start.
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const k = y * gw + x;
      if (!grid[k]) continue;
      total++;
      if (y < startY) {
        startY = y;
        start = k;
      }
    }
  }
  if (total === 0) return [];
  // Prefer a skeleton ENDPOINT (degree 1) — the top-most one — as the start,
  // since most lowercase letters begin at the top of a stroke.
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const k = y * gw + x;
      if (!grid[k]) continue;
      if (neighbors(k).length === 1 && y < endTopY) {
        endTopY = y;
        start = k;
      }
    }
  }

  // Walk the skeleton into a continuous ordered path. DFS from the start; on
  // backtrack we re-emit the parent so consecutive path points stay adjacent
  // (continuous arc length). Stop as soon as every skeleton pixel is visited so
  // we don't append a redundant return journey.
  const visited = new Uint8Array(gw * gh);
  const path: number[] = [];
  visited[start] = 1;
  path.push(start);
  let seen = 1;
  const stack = [start];
  while (stack.length && seen < total) {
    const cur = stack[stack.length - 1];
    let next = -1;
    for (const nb of neighbors(cur)) {
      if (!visited[nb]) {
        next = nb;
        break;
      }
    }
    if (next >= 0) {
      visited[next] = 1;
      seen++;
      path.push(next);
      stack.push(next);
    } else {
      stack.pop();
      if (stack.length) path.push(stack[stack.length - 1]);
    }
  }

  // Convert path (grid coords) to CSS coords.
  const toCss = (k: number): Pt => {
    const gx = k % gw;
    const gy = (k - gx) / gw;
    return { x: minX + (gx - pad + 0.5) / factor, y: minY + (gy - pad + 0.5) / factor };
  };
  const poly = path.map(toCss);
  if (poly.length === 1) return [poly[0]];

  // Cumulative arc length.
  const cum: number[] = [0];
  for (let i = 1; i < poly.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(poly[i].x - poly[i - 1].x, poly[i].y - poly[i - 1].y));
  }
  const len = cum[cum.length - 1];
  if (len <= 0) return [poly[0]];

  // How many evenly-spaced dots.
  const dots = Math.max(MIN_DOTS, Math.min(MAX_DOTS, Math.round(len / (minDim * 0.16))));

  // Resample the polyline at evenly-spaced arc-length positions.
  const out: Pt[] = [];
  let seg = 0;
  for (let i = 0; i < dots; i++) {
    const target = (len * i) / (dots - 1);
    while (seg < cum.length - 2 && cum[seg + 1] < target) seg++;
    const segLen = cum[seg + 1] - cum[seg];
    const t = segLen > 0 ? (target - cum[seg]) / segLen : 0;
    out.push({
      x: poly[seg].x + (poly[seg + 1].x - poly[seg].x) * t,
      y: poly[seg].y + (poly[seg + 1].y - poly[seg].y) * t,
    });
  }
  return out;
}

export default function TraceSlate({ letter, width, height, onComplete }: Props) {
  const guideRef = useRef<HTMLCanvasElement>(null); // faint letter + waypoint dots
  const traceRef = useRef<HTMLCanvasElement>(null); // bright chalk trail (clipped)
  const maskRef = useRef<HTMLCanvasElement | null>(null); // opaque glyph silhouette
  const trailRef = useRef<HTMLCanvasElement | null>(null); // raw (unclipped) chalk
  const dprRef = useRef(1);
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
  const dotR = Math.max(3.5, Math.min(width, height) * 0.013);
  const startR = dotR * 1.75;

  // Paint the faint guide letter and the waypoint dots. Index 0 is the START:
  // a larger RED dot until traced. Others are faint grey until lit green.
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
      const isStart = i === 0;
      const r = isStart ? startR : dotR;
      ctx.beginPath();
      ctx.arc(wps[i].x, wps[i].y, r, 0, Math.PI * 2);
      if (on) ctx.fillStyle = "rgba(86, 226, 122, 0.95)"; // lit green
      else if (isStart) ctx.fillStyle = "rgba(233, 66, 55, 0.95)"; // red start
      else ctx.fillStyle = "rgba(233, 237, 234, 0.5)"; // faint grey
      ctx.fill();
      if (on || isStart) {
        ctx.beginPath();
        ctx.arc(wps[i].x, wps[i].y, r + 2, 0, Math.PI * 2);
        ctx.strokeStyle = on ? "rgba(86, 226, 122, 0.5)" : "rgba(255, 255, 255, 0.7)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    ctx.restore();
  }, [letter, width, height, dotR, startR]);

  // Composite the accumulated (unclipped) trail onto the visible canvas, then
  // intersect it with the glyph mask so nothing outside the letter is shown.
  const composite = useCallback(() => {
    const t = traceRef.current;
    const trail = trailRef.current;
    const mask = maskRef.current;
    if (!t || !trail || !mask) return;
    const ctx = t.getContext("2d")!;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, t.width, t.height);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(trail, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
  }, []);

  // Wipe the child's chalk and reset lit waypoints.
  const wipe = useCallback(() => {
    const trail = trailRef.current;
    if (trail) {
      const tc = trail.getContext("2d")!;
      tc.save();
      tc.setTransform(1, 0, 0, 1, 0, 0);
      tc.clearRect(0, 0, trail.width, trail.height);
      tc.restore();
    }
    const t = traceRef.current;
    if (t) {
      const ctx = t.getContext("2d")!;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, t.width, t.height);
      ctx.restore();
    }
    lit.current = waypoints.current.map(() => false);
    litCount.current = 0;
    lastPt.current = null;
    paintGuide();
  }, [paintGuide]);

  // ---- (re)build guide + waypoints + mask whenever letter/size changes ----
  useEffect(() => {
    doneRef.current = false;
    setFlash(false);
    const g = guideRef.current;
    const t = traceRef.current;
    if (!g || !t) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
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

    // Offscreen TRAIL layer (accumulates raw chalk, high-DPI, CSS-coord draws).
    const trail = document.createElement("canvas");
    trail.width = Math.round(width * dpr);
    trail.height = Math.round(height * dpr);
    const trctx = trail.getContext("2d")!;
    trctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    trctx.lineJoin = "round";
    trctx.lineCap = "round";
    trailRef.current = trail;

    // Persistent MASK: the glyph rendered OPAQUE (silhouette to clip against).
    const mask = document.createElement("canvas");
    mask.width = Math.round(width * dpr);
    mask.height = Math.round(height * dpr);
    const mctx = mask.getContext("2d")!;
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mctx.font = `800 ${fontPx.current}px ${GUIDE_FONT}`;
    mctx.textAlign = "center";
    mctx.textBaseline = "middle";
    mctx.fillStyle = "#000";
    mctx.fillText(letter, width / 2, height / 2);
    maskRef.current = mask;

    // Read the glyph ink (CSS resolution) for skeleton extraction.
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
    waypoints.current = buildWaypoints(inkX, inkY, Math.min(width, height));
    lit.current = waypoints.current.map(() => false);
    litCount.current = 0;
    lastPt.current = null;
    // clear visible chalk
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

  const strokeTo = (from: Pt | null, to: Pt) => {
    const trail = trailRef.current;
    if (!trail) return;
    const ctx = trail.getContext("2d")!;
    ctx.strokeStyle = "#fdf3d0"; // bright chalk
    ctx.lineWidth = Math.max(9, width * 0.03);
    ctx.beginPath();
    if (from) ctx.moveTo(from.x, from.y);
    else ctx.moveTo(to.x - 0.1, to.y - 0.1);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const onDown = (e: React.PointerEvent) => {
    if (doneRef.current || flash) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointerId.current = e.pointerId;
    drawing.current = true;
    const p = toXY(e);
    lastPt.current = p;
    strokeTo(null, p);
    composite();
    if (lightAt(p.x, p.y)) paintGuide();
    checkComplete();
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current || e.pointerId !== pointerId.current) return;
    const p = toXY(e);
    const last = lastPt.current;
    strokeTo(last, p);
    composite();
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
