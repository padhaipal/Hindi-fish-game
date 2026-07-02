"use client";

// ---------------------------------------------------------------------------
// GUIDED SLATE — the trace level (L1).
// ---------------------------------------------------------------------------
// The letter is drawn from its own ordered pen strokes (lib/lekhan/strokes.ts,
// traced from the PadhaiPal stroke-order charts) as smooth thick round strokes.
// One stroke is highlighted at a time:  red = current,  light grey = upcoming,
// green = completed. The current stroke shows a step number + direction arrow.
// The child traces the red stroke:
//   - stray off it        -> flash red, wipe the attempt, try again
//   - cover it enough      -> it turns green and the next stroke lights up
// Finishing the last stroke completes the letter. Teaches stroke order.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { LETTER_STROKES, distToPolyline, Stroke } from "@/lib/lekhan/strokes";

interface Props {
  text: string;
  letterId: string;
  width: number;
  height: number;
  onComplete: () => void;
}

type Pt = [number, number];

const OFF_MAX = 0.3; // stray budget while tracing the current stroke
const COVER = 0.6; // fraction of the stroke that must be covered to finish it
const CUR = "#ff5b5b"; // red
const DONE = "#63e29a"; // green
const FUT = "#cdd5cf"; // light grey

// smooth path (quadratic through segment midpoints) for a px polyline
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

// sample points evenly-ish along a polyline (for coverage checks)
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
  const guideRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const strokesPx = useRef<Pt[][]>([]); // each stroke's polyline in px
  const samples = useRef<Pt[][]>([]); // sampled centreline points per stroke
  const drawnPts = useRef<Pt[]>([]); // child's points for the current attempt
  const drawing = useRef(false);
  const lastPt = useRef<Pt | null>(null);
  const pointerId = useRef<number | null>(null);
  const doneRef = useRef(false);
  const [current, setCurrent] = useState(0);
  const [flash, setFlash] = useState<null | "red" | "green">(null);

  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const W = Math.max(10, Math.min(width, height) * 0.085); // stroke width
  const tol = W * 1.15; // how far off the centreline still counts as "on"

  const drawGuide = useCallback(
    (cur: number) => {
      const c = guideRef.current;
      if (!c) return;
      const ctx = c.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = W;
      const strokes = strokesPx.current;
      // draw done + upcoming first, current last (so it sits on top)
      strokes.forEach((poly, i) => {
        if (i === cur) return;
        ctx.strokeStyle = i < cur ? DONE : FUT;
        ctx.stroke(pathFor(poly));
      });
      if (cur < strokes.length) {
        ctx.strokeStyle = CUR;
        ctx.stroke(pathFor(strokes[cur]));
      }
    },
    [dpr, width, height, W]
  );

  const wipeInk = useCallback(() => {
    const c = inkRef.current;
    if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    drawnPts.current = [];
    lastPt.current = null;
  }, []);

  useEffect(() => {
    doneRef.current = false;
    setFlash(null);
    setCurrent(0);
    const g = guideRef.current;
    const ink = inkRef.current;
    if (!g || !ink) return;
    const DW = Math.round(width * dpr);
    const DH = Math.round(height * dpr);
    for (const c of [g, ink]) {
      c.width = DW;
      c.height = DH;
      const cx = c.getContext("2d")!;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.clearRect(0, 0, width, height);
      cx.lineJoin = "round";
      cx.lineCap = "round";
    }
    const strokes: Stroke[] = LETTER_STROKES[letterId] || [[[20, 50], [80, 50]]];
    strokesPx.current = strokes.map((st) => st.map(([x, y]) => [(x / 100) * width, (y / 100) * height] as Pt));
    samples.current = strokesPx.current.map((poly) => samplePolyline(poly, tol * 0.7));
    drawnPts.current = [];
    lastPt.current = null;
    drawGuide(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, letterId, width, height]);

  const judge = useCallback(() => {
    if (doneRef.current) return;
    const poly = strokesPx.current[current];
    const pts = drawnPts.current;
    if (!poly || pts.length < 2) return;

    let off = 0;
    for (const p of pts) if (distToPolyline(p[0], p[1], poly) > tol) off++;
    if (off / pts.length > OFF_MAX) {
      setFlash("red");
      window.setTimeout(() => {
        wipeInk();
        setFlash(null);
      }, 450);
      return;
    }
    const samp = samples.current[current];
    let cov = 0;
    for (const s of samp) {
      let near = false;
      for (const p of pts) {
        if (Math.hypot(p[0] - s[0], p[1] - s[1]) <= tol) {
          near = true;
          break;
        }
      }
      if (near) cov++;
    }
    if (samp.length > 0 && cov / samp.length < COVER) return; // keep tracing

    wipeInk();
    const next = current + 1;
    if (next >= strokesPx.current.length) {
      doneRef.current = true;
      drawGuide(next);
      setFlash("green");
      window.setTimeout(() => onComplete(), 600);
    } else {
      setCurrent(next);
      drawGuide(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, tol, wipeInk, drawGuide, onComplete]);

  const toXY = (e: React.PointerEvent): Pt => {
    const r = inkRef.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const onDown = (e: React.PointerEvent) => {
    if (doneRef.current || flash) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointerId.current = e.pointerId;
    drawing.current = true;
    const p = toXY(e);
    lastPt.current = p;
    drawnPts.current.push(p);
    const ctx = inkRef.current!.getContext("2d")!;
    ctx.strokeStyle = "#fffbe8";
    ctx.lineWidth = Math.max(8, width * 0.03);
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    ctx.lineTo(p[0] + 0.1, p[1] + 0.1);
    ctx.stroke();
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current || e.pointerId !== pointerId.current) return;
    const p = toXY(e);
    const last = lastPt.current;
    const ctx = inkRef.current!.getContext("2d")!;
    ctx.beginPath();
    if (last) ctx.moveTo(last[0], last[1]);
    ctx.lineTo(p[0], p[1]);
    ctx.stroke();
    if (last) {
      const steps = Math.max(1, Math.ceil(Math.hypot(p[0] - last[0], p[1] - last[1]) / 4));
      for (let i = 1; i <= steps; i++)
        drawnPts.current.push([last[0] + ((p[0] - last[0]) * i) / steps, last[1] + ((p[1] - last[1]) * i) / steps]);
    }
    lastPt.current = p;
  };
  const onUp = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerId.current) return;
    drawing.current = false;
    lastPt.current = null;
    pointerId.current = null;
    judge();
  };

  // number badge + direction arrow for the current stroke
  const cur = strokesPx.current[current];
  const badge = cur && !doneRef.current
    ? (() => {
        const [sx, sy] = cur[0];
        const [nx, ny] = cur[Math.min(1, cur.length - 1)];
        const len = Math.hypot(nx - sx, ny - sy) || 1;
        return { sx, sy, dx: (nx - sx) / len, dy: (ny - sy) / len };
      })()
    : null;
  const arrowLen = Math.min(width, height) * 0.16;

  return (
    <div
      className={`slate ${flash ? `slate--${flash}` : ""}`}
      style={{ width, height }}
      data-text={text}
      data-step={current}
      data-steps={strokesPx.current.length}
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
      {badge && (
        <svg className="slateGuide" width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ zIndex: 2 }}>
          <defs>
            <marker id="gah" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
              <path d="M0 0 L9 4.5 L0 9 Z" fill="#ffd23f" />
            </marker>
          </defs>
          <line
            x1={badge.sx + badge.dx * (W * 0.6)}
            y1={badge.sy + badge.dy * (W * 0.6)}
            x2={badge.sx + badge.dx * arrowLen}
            y2={badge.sy + badge.dy * arrowLen}
            stroke="#ffd23f"
            strokeWidth={4}
            markerEnd="url(#gah)"
          />
          <circle cx={badge.sx} cy={badge.sy} r={13} fill="#ffd23f" stroke="#fff" strokeWidth={2} />
          <text x={badge.sx} y={badge.sy + 5} textAnchor="middle" fontSize={16} fontWeight={800} fill="#7a5200">
            {current + 1}
          </text>
        </svg>
      )}
      <button type="button" className="slateClear" onClick={wipeInk} aria-label="फिर से">
        ↺
      </button>
    </div>
  );
}
