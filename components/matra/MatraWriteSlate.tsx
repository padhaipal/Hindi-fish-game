"use client";

// ---------------------------------------------------------------------------
// MATRA WRITE SLATE — write just the MATRA; the consonant is already in place.
// ---------------------------------------------------------------------------
// The consonant क is drawn on the chalkboard as a solid, non-interactive glyph
// ("already there"). The child then writes the matra onto it, stroke by stroke,
// from each red start dot (order-enforced, exactly like the letter TraceSlate).
//   • guided = true  → the matra is shown as a faint outline to trace over.
//   • guided = false → no outline (write it yourself); a red start dot still
//     marks where each stroke begins, and the tolerance is more generous.
// Both use the same medial-axis matra strokes (lib/matra/matraStrokes.ts).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { getMatraWrite, type Stroke } from "@/lib/matra/matraStrokes";

interface Props {
  matraId: string;
  guided: boolean;
  width: number;
  height: number;
  onComplete: () => void;
}

type Pt = { x: number; y: number };
type StrokeC = { pts: Pt[]; cum: number[]; len: number };

const MARGIN = 0.14;
const GUIDE_W_FRAC = 0.12;
const START_GATE = 0.24;
const JUMP_AHEAD = 0.3;
const DONE_THRESH = 0.86;

const COL_CONS = "rgba(226, 236, 230, 0.5)"; // consonant, drawn in place
const COL_FAINT = "rgba(240, 243, 208, 0.22)"; // matra guide, faint
const COL_CURRENT = "rgba(253, 243, 208, 0.5)";
const COL_GREEN = "rgba(120, 226, 140, 0.97)";
const COL_RED = "rgba(233, 66, 55, 0.98)";

function project(stroke: StrokeC, p: Pt): { t: number; d: number } {
  const { pts, cum, len } = stroke;
  if (pts.length === 1 || len <= 0) return { t: 0, d: Math.hypot(p.x - pts[0].x, p.y - pts[0].y) };
  let bestD = Infinity;
  let bestArc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const seg2 = dx * dx + dy * dy;
    let tt = seg2 > 0 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / seg2 : 0;
    if (tt < 0) tt = 0;
    else if (tt > 1) tt = 1;
    const cx = a.x + dx * tt;
    const cy = a.y + dy * tt;
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d < bestD) {
      bestD = d;
      bestArc = cum[i] + tt * (cum[i + 1] - cum[i]);
    }
  }
  return { t: bestArc / len, d: bestD };
}

function partialPoints(stroke: StrokeC, frac: number): Pt[] {
  const { pts, cum, len } = stroke;
  if (len <= 0 || pts.length === 1) return [pts[0]];
  const target = frac * len;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (cum[i] <= target) out.push(pts[i]);
    else {
      const segLen = cum[i] - cum[i - 1];
      const tt = segLen > 0 ? (target - cum[i - 1]) / segLen : 0;
      out.push({ x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * tt, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * tt });
      break;
    }
  }
  return out;
}

function strokePath(ctx: CanvasRenderingContext2D, pts: Pt[], color: string, lw: number): void {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, lw / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  if (pts.length === 2) ctx.lineTo(pts[1].x, pts[1].y);
  else {
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.quadraticCurveTo(pts[pts.length - 2].x, pts[pts.length - 2].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
  }
  ctx.stroke();
}

export default function MatraWriteSlate({ matraId, guided, width, height, onComplete }: Props) {
  const guideRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLCanvasElement>(null);
  const consRef = useRef<StrokeC[]>([]);
  const matraRef = useRef<StrokeC[]>([]);
  const currentRef = useRef(0);
  const progressRef = useRef(0);
  const startedRef = useRef(false);
  const drawingRef = useRef(false);
  const pointerId = useRef<number | null>(null);
  const doneRef = useRef(false);
  const [flash, setFlash] = useState(false);

  const minDim = Math.min(width, height);
  const guideW = minDim * GUIDE_W_FRAC;
  const tol = minDim * (guided ? 0.15 : 0.2);
  const startR = guideW * 0.55;

  const render = useCallback(() => {
    const c = guideRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // 1. consonant — already in place.
    for (const s of consRef.current) strokePath(ctx, s.pts, COL_CONS, guideW);

    const matra = matraRef.current;
    const cur = currentRef.current;
    const prog = progressRef.current;

    // 2. matra guide (only in guided mode).
    if (guided) {
      for (const s of matra) strokePath(ctx, s.pts, COL_FAINT, guideW);
      if (cur < matra.length) strokePath(ctx, matra[cur].pts, COL_CURRENT, guideW);
    }
    // 3. completed matra strokes, green; + current progress.
    for (let s = 0; s < cur && s < matra.length; s++) strokePath(ctx, matra[s].pts, COL_GREEN, guideW * 0.86);
    if (cur < matra.length && prog > 0) strokePath(ctx, partialPoints(matra[cur], prog), COL_GREEN, guideW * 0.86);

    // 4. red start dot + arrow for the current matra stroke.
    if (cur < matra.length) {
      const st = matra[cur];
      const p0 = st.pts[0];
      if (st.pts.length > 1) {
        const p1 = st.pts[1];
        const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        const alen = guideW * 1.4;
        const ax = p0.x + Math.cos(ang) * alen;
        const ay = p0.y + Math.sin(ang) * alen;
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = Math.max(2, guideW * 0.14);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(ax, ay);
        const head = guideW * 0.45;
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - Math.cos(ang - 0.5) * head, ay - Math.sin(ang - 0.5) * head);
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - Math.cos(ang + 0.5) * head, ay - Math.sin(ang + 0.5) * head);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(p0.x, p0.y, startR, 0, Math.PI * 2);
      ctx.fillStyle = COL_RED;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.stroke();
    }
  }, [width, height, guideW, startR, guided]);

  useEffect(() => {
    doneRef.current = false;
    setFlash(false);
    currentRef.current = 0;
    progressRef.current = 0;
    startedRef.current = false;

    const g = guideRef.current;
    const inp = inputRef.current;
    if (!g || !inp) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const c of [g, inp]) {
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
      const ctx = c.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const data = getMatraWrite(matraId);
    const all: Stroke[] = [...data.consonant, ...data.matra];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of all) for (const [x, y] of s) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    const bw = Math.max(1e-3, maxX - minX);
    const bh = Math.max(1e-3, maxY - minY);
    const scale = Math.min((width * (1 - 2 * MARGIN)) / bw, (height * (1 - 2 * MARGIN)) / bh);
    const offX = (width - bw * scale) / 2;
    const offY = (height - bh * scale) / 2;
    const map = ([x, y]: number[]): Pt => ({ x: offX + (x - minX) * scale, y: offY + (y - minY) * scale });
    const toC = (s: Stroke): StrokeC => {
      const pts = s.map(map);
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
      return { pts, cum, len: cum[cum.length - 1] };
    };
    consRef.current = data.consonant.map(toC);
    matraRef.current = data.matra.map(toC);
    render();
  }, [matraId, width, height, render]);

  const handlePoint = useCallback(
    (p: Pt) => {
      if (doneRef.current) return;
      const matra = matraRef.current;
      const cur = currentRef.current;
      if (cur >= matra.length) return;
      const { t, d } = project(matra[cur], p);
      if (d > tol) {
        render();
        return;
      }
      if (!startedRef.current) {
        if (t <= START_GATE) {
          startedRef.current = true;
          progressRef.current = Math.max(progressRef.current, t);
        } else return;
      } else if (t <= progressRef.current + JUMP_AHEAD) {
        progressRef.current = Math.max(progressRef.current, t);
      }
      if (progressRef.current >= DONE_THRESH) {
        currentRef.current += 1;
        progressRef.current = 0;
        startedRef.current = false;
        if (currentRef.current >= matra.length) {
          doneRef.current = true;
          render();
          setFlash(true);
          window.setTimeout(() => onComplete(), 260);
          return;
        }
      }
      render();
    },
    [tol, render, onComplete]
  );

  const toXY = (e: React.PointerEvent): Pt => {
    const r = inputRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onDown = (e: React.PointerEvent) => {
    if (doneRef.current) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointerId.current = e.pointerId;
    drawingRef.current = true;
    handlePoint(toXY(e));
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || e.pointerId !== pointerId.current) return;
    handlePoint(toXY(e));
  };
  const onUp = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerId.current) return;
    drawingRef.current = false;
    pointerId.current = null;
  };

  const clear = useCallback(() => {
    currentRef.current = 0;
    progressRef.current = 0;
    startedRef.current = false;
    doneRef.current = false;
    setFlash(false);
    render();
  }, [render]);

  return (
    <div className={`slate ${flash ? "slate--green" : ""}`} style={{ width, height }}>
      <canvas ref={guideRef} className="slateGuide" style={{ width, height }} />
      <canvas
        ref={inputRef}
        className="slateCanvas"
        style={{ width, height }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      <button type="button" className="slateClear" onClick={clear} aria-label="फिर से">
        ↺
      </button>
    </div>
  );
}
