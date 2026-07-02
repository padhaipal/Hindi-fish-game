"use client";

// ---------------------------------------------------------------------------
// GUIDED SLATE — the trace level (L1).
// ---------------------------------------------------------------------------
// A piece of chalk animates along the letter's strokes (in order) leaving a
// DOTTED line behind — showing the shape, order and direction. Then the child
// runs a finger over the dotted line and it fills in solid WHITE. White can only
// appear ON the letter's path (a band around the strokes), so stray marks don't
// show. When enough of the letter has been made white, it's complete.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { LETTER_STROKES, Stroke } from "@/lib/lekhan/strokes";

interface Props {
  text: string;
  letterId: string;
  width: number;
  height: number;
  onComplete: () => void;
}

type Pt = [number, number];

const COVER = 0.72; // fraction of the letter path that must be whitened
const DEMO_MS = 1900; // chalk demonstration length

// smooth path (quadratic through midpoints) for a px polyline
function pathFor(poly: Pt[]): Path2D {
  const p = new Path2D();
  if (!poly.length) return p;
  p.moveTo(poly[0][0], poly[0][1]);
  if (poly.length === 2) {
    p.lineTo(poly[1][0], poly[1][1]);
    return p;
  }
  for (let i = 1; i < poly.length - 1; i++) {
    const mx = (poly[i][0] + poly[i + 1][0]) / 2;
    const my = (poly[i][1] + poly[i + 1][1]) / 2;
    p.quadraticCurveTo(poly[i][0], poly[i][1], mx, my);
  }
  p.lineTo(poly[poly.length - 1][0], poly[poly.length - 1][1]);
  return p;
}

function samplePolyline(poly: Pt[], step: number): Pt[] {
  if (poly.length === 1) return [poly[0]];
  const out: Pt[] = [];
  for (let i = 0; i < poly.length - 1; i++) {
    const [ax, ay] = poly[i];
    const [bx, by] = poly[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    const n = Math.max(1, Math.round(len / step));
    for (let k = 0; k < n; k++) out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
  }
  out.push(poly[poly.length - 1]);
  return out;
}

export default function GuidedSlate({ text, letterId, width, height, onComplete }: Props) {
  const guideRef = useRef<HTMLCanvasElement>(null); // dotted line + chalk demo
  const inkRef = useRef<HTMLCanvasElement>(null); // white reveal + pointer
  const maskRef = useRef<HTMLCanvasElement | null>(null); // band the white is clipped to
  const strokesPx = useRef<Pt[][]>([]);
  const demoPts = useRef<Pt[]>([]); // concatenated points for the chalk demo
  const coverPts = useRef<Pt[]>([]); // sampled path points for coverage
  const coveredRef = useRef<boolean[]>([]);
  const drawing = useRef(false);
  const lastPt = useRef<Pt | null>(null);
  const pointerId = useRef<number | null>(null);
  const doneRef = useRef(false);
  const demoRef = useRef(true); // demo still playing
  const rafRef = useRef(0);
  const [flash, setFlash] = useState<null | "green">(null);

  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const W = Math.max(10, Math.min(width, height) * 0.1); // white line width
  const tol = W * 0.95;

  // draw the dotted guide line (all strokes), optionally with the chalk head
  const drawGuide = useCallback(
    (chalk?: Pt) => {
      const c = guideRef.current;
      if (!c) return;
      const ctx = c.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = Math.max(3, W * 0.42);
      ctx.setLineDash([2, W * 0.42]);
      for (const poly of strokesPx.current) ctx.stroke(pathFor(poly));
      ctx.setLineDash([]);
      if (chalk) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(chalk[0], chalk[1], W * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [dpr, width, height, W]
  );

  const stopDemo = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    demoRef.current = false;
    drawGuide();
  }, [drawGuide]);

  useEffect(() => {
    doneRef.current = false;
    demoRef.current = true;
    setFlash(null);
    const g = guideRef.current;
    const ink = inkRef.current;
    if (!g || !ink) return;
    const DW = Math.round(width * dpr);
    const DH = Math.round(height * dpr);
    for (const c of [g, ink]) {
      c.width = DW;
      c.height = DH;
    }
    const strokes: Stroke[] = LETTER_STROKES[letterId] || [[[20, 50], [80, 50]]];
    strokesPx.current = strokes.map((st) => st.map(([x, y]) => [(x / 100) * width, (y / 100) * height] as Pt));

    // clip band the white reveal is limited to (strokes stroked thick)
    const mask = document.createElement("canvas");
    mask.width = DW;
    mask.height = DH;
    const mctx = mask.getContext("2d")!;
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mctx.lineCap = "round";
    mctx.lineJoin = "round";
    mctx.strokeStyle = "#fff";
    mctx.lineWidth = W * 1.35;
    for (const poly of strokesPx.current) mctx.stroke(pathFor(poly));
    maskRef.current = mask;

    // demo + coverage sample points
    demoPts.current = strokesPx.current.flatMap((poly) => samplePolyline(poly, W * 0.5));
    coverPts.current = strokesPx.current.flatMap((poly) => samplePolyline(poly, tol * 0.8));
    coveredRef.current = coverPts.current.map(() => false);

    const ictx = ink.getContext("2d")!;
    ictx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ictx.clearRect(0, 0, width, height);

    // run the chalk demo
    const pts = demoPts.current;
    let start = 0;
    const step = (t: number) => {
      if (!start) start = t;
      const f = Math.min(1, (t - start) / DEMO_MS);
      const idx = Math.min(pts.length - 1, Math.floor(f * (pts.length - 1)));
      drawGuide(pts[idx]);
      if (f < 1 && demoRef.current) rafRef.current = requestAnimationFrame(step);
      else stopDemo();
    };
    drawGuide();
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, letterId, width, height]);

  // whiten under the finger, clipped to the letter band
  const paint = (a: Pt, b: Pt) => {
    const c = inkRef.current!;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "#ffffff";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = W;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
    // clip everything drawn so far to the band
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "destination-in";
    if (maskRef.current) ctx.drawImage(maskRef.current, 0, 0);
    ctx.globalCompositeOperation = "source-over";
  };

  const cover = (p: Pt) => {
    const cp = coverPts.current;
    const cov = coveredRef.current;
    for (let i = 0; i < cp.length; i++)
      if (!cov[i] && Math.hypot(cp[i][0] - p[0], cp[i][1] - p[1]) <= tol) cov[i] = true;
  };

  const checkDone = () => {
    if (doneRef.current) return;
    const cov = coveredRef.current;
    const n = cov.length || 1;
    const c = cov.reduce((s, v) => s + (v ? 1 : 0), 0);
    if (c / n >= COVER) {
      doneRef.current = true;
      setFlash("green");
      window.setTimeout(() => onComplete(), 550);
    }
  };

  const toXY = (e: React.PointerEvent): Pt => {
    const r = inkRef.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const onDown = (e: React.PointerEvent) => {
    if (doneRef.current) return;
    e.preventDefault();
    if (demoRef.current) stopDemo(); // start tracing -> end the demo
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointerId.current = e.pointerId;
    drawing.current = true;
    const p = toXY(e);
    lastPt.current = p;
    paint(p, p);
    cover(p);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current || e.pointerId !== pointerId.current) return;
    const p = toXY(e);
    paint(lastPt.current || p, p);
    cover(p);
    lastPt.current = p;
  };
  const onUp = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerId.current) return;
    drawing.current = false;
    lastPt.current = null;
    pointerId.current = null;
    checkDone();
  };

  return (
    <div
      className={`slate ${flash ? `slate--${flash}` : ""}`}
      style={{ width, height }}
      data-text={text}
    >
      <canvas ref={guideRef} className="slateCanvas" style={{ width, height, zIndex: 0 }} />
      <canvas
        ref={inkRef}
        className="slateCanvas"
        style={{ width, height, zIndex: 1 }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
    </div>
  );
}
