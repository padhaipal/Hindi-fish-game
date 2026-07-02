"use client";

// ---------------------------------------------------------------------------
// GUIDED SLATE — the trace level (L1).
// ---------------------------------------------------------------------------
// The accurate font glyph is split into its natural pen strokes (see
// lib/lekhan/strokes.ts): every glyph pixel is coloured by the stroke it belongs
// to. Colour theme:  red = current stroke,  light grey = future strokes,
// green = completed strokes. The current stroke also shows a step number + a
// direction arrow. The child traces the red stroke:
//   - stray outside it     -> flash red, wipe that attempt, try again
//   - cover it well enough  -> it turns green and the next stroke lights up
// Finishing the last stroke completes the letter. This teaches stroke order.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { fitFont } from "@/lib/lekhan/recognize";
import { LETTER_STROKES, segmentStroke, Stroke } from "@/lib/lekhan/strokes";

interface Props {
  text: string;
  letterId: string;
  width: number;
  height: number;
  onComplete: () => void;
}

const GRID = 16;
const OFF_MAX = 0.3; // stray budget while tracing the current stroke
const COVER = 0.62; // how much of the stroke must be covered to finish it

const CUR: [number, number, number] = [255, 82, 82]; // red
const DONE: [number, number, number] = [90, 210, 140]; // green
const FUT: [number, number, number] = [206, 212, 208]; // light grey

interface Start {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export default function GuidedSlate({ text, letterId, width, height, onComplete }: Props) {
  const guideRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const glyphA = useRef<Uint8ClampedArray | null>(null); // glyph alpha
  const strokeIdx = useRef<Int16Array | null>(null); // stroke per pixel (-1 = none)
  const strokeCells = useRef<Set<number>[]>([]);
  const starts = useRef<Start[]>([]);
  const nStrokes = useRef(0);
  const drawnCells = useRef<Set<number>>(new Set());
  const drawing = useRef(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const pointerId = useRef<number | null>(null);
  const doneRef = useRef(false);
  const [current, setCurrent] = useState(0);
  const [flash, setFlash] = useState<null | "red" | "green">(null);

  const cw = width / GRID;
  const ch = height / GRID;
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  // paint the glyph (at device resolution, so it's crisp), each pixel coloured
  // by the state of the stroke it belongs to
  const drawGuide = useCallback(
    (cur: number) => {
      const c = guideRef.current;
      const a = glyphA.current;
      const idx = strokeIdx.current;
      if (!c || !a || !idx) return;
      const ctx = c.getContext("2d")!;
      const out = ctx.createImageData(c.width, c.height);
      const d = out.data;
      for (let i = 0; i < a.length; i++) {
        const al = a[i];
        const s = idx[i];
        if (al > 8 && s >= 0) {
          const col = s < cur ? DONE : s === cur ? CUR : FUT;
          d[i * 4] = col[0];
          d[i * 4 + 1] = col[1];
          d[i * 4 + 2] = col[2];
          d[i * 4 + 3] = al;
        }
      }
      ctx.putImageData(out, 0, 0);
    },
    []
  );

  const wipeInk = useCallback(() => {
    const c = inkRef.current;
    if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    drawnCells.current = new Set();
    lastPt.current = null;
  }, []);

  // ---- build strokes when the letter/size changes ------------------------
  useEffect(() => {
    doneRef.current = false;
    setFlash(null);
    setCurrent(0);
    const g = guideRef.current;
    const ink = inkRef.current;
    if (!g || !ink) return;
    const DW = Math.round(width * dpr);
    const DH = Math.round(height * dpr);
    g.width = DW; // guide + ink both at device resolution -> crisp
    g.height = DH;
    ink.width = DW;
    ink.height = DH;
    const ictx = ink.getContext("2d")!;
    ictx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ictx.clearRect(0, 0, width, height);
    ictx.lineJoin = "round";
    ictx.lineCap = "round";

    const strokes: Stroke[] = LETTER_STROKES[letterId] || [[[20, 50], [80, 50]]];
    nStrokes.current = strokes.length;

    // render glyph at device resolution -> alpha + bbox (all in device px)
    const off = document.createElement("canvas");
    off.width = DW;
    off.height = DH;
    const octx = off.getContext("2d")!;
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const fs = fitFont(octx, text, width, height);
    octx.font = `700 ${fs}px sans-serif`;
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.fillStyle = "#000";
    octx.fillText(text, width / 2, height / 2);
    const data = octx.getImageData(0, 0, DW, DH).data;

    let minx = 1e9;
    let miny = 1e9;
    let maxx = -1;
    let maxy = -1;
    for (let y = 0; y < DH; y++)
      for (let x = 0; x < DW; x++)
        if (data[(y * DW + x) * 4 + 3] > 80) {
          if (x < minx) minx = x;
          if (x > maxx) maxx = x;
          if (y < miny) miny = y;
          if (y > maxy) maxy = y;
        }
    const bw = Math.max(1, maxx - minx);
    const bh = Math.max(1, maxy - miny);

    const alpha = new Uint8ClampedArray(DW * DH);
    const idx = new Int16Array(DW * DH).fill(-1);
    const sets: Set<number>[] = strokes.map(() => new Set<number>());
    for (let y = 0; y < DH; y++) {
      for (let x = 0; x < DW; x++) {
        const p = y * DW + x;
        const al = data[p * 4 + 3];
        alpha[p] = al;
        if (al > 8) {
          const nx = ((x - minx) / bw) * 100;
          const ny = ((y - miny) / bh) * 100;
          const s = segmentStroke(nx, ny, strokes);
          idx[p] = s;
          if (al > 80) {
            // validation cells use CSS coords (matching pointer coords)
            const cssx = x / dpr;
            const cssy = y / dpr;
            sets[s].add(Math.floor(cssy / ch) * GRID + Math.floor(cssx / cw));
          }
        }
      }
    }
    glyphA.current = alpha;
    strokeIdx.current = idx;
    strokeCells.current = sets;
    // badge starts in CSS px (bbox is device px -> divide by dpr)
    starts.current = strokes.map((st) => {
      const [x0, y0] = st[0];
      const [x1, y1] = st[Math.min(1, st.length - 1)];
      const sx = (minx + (x0 / 100) * bw) / dpr;
      const sy = (miny + (y0 / 100) * bh) / dpr;
      const ex = (minx + (x1 / 100) * bw) / dpr;
      const ey = (miny + (y1 / 100) * bh) / dpr;
      const len = Math.hypot(ex - sx, ey - sy) || 1;
      return { x: sx, y: sy, dx: (ex - sx) / len, dy: (ey - sy) / len };
    });

    drawnCells.current = new Set();
    lastPt.current = null;
    drawGuide(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, letterId, width, height]);

  const nearSet = (cell: number, set: Set<number>) => {
    const r = Math.floor(cell / GRID);
    const col = cell % GRID;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr;
        const cc = col + dc;
        if (rr < 0 || cc < 0 || rr >= GRID || cc >= GRID) continue;
        if (set.has(rr * GRID + cc)) return true;
      }
    return false;
  };

  const judge = useCallback(() => {
    if (doneRef.current) return;
    const region = strokeCells.current[current];
    const drawn = drawnCells.current;
    if (!region || drawn.size < 2) return;

    let off = 0;
    drawn.forEach((c) => {
      if (!nearSet(c, region)) off++;
    });
    if (off / drawn.size > OFF_MAX) {
      setFlash("red");
      window.setTimeout(() => {
        wipeInk();
        setFlash(null);
      }, 450);
      return;
    }
    let cov = 0;
    region.forEach((c) => {
      if (nearSet(c, drawn)) cov++;
    });
    if (region.size > 0 && cov / region.size < COVER) return; // keep tracing

    wipeInk();
    const next = current + 1;
    if (next >= nStrokes.current) {
      doneRef.current = true;
      drawGuide(next);
      setFlash("green");
      window.setTimeout(() => onComplete(), 600);
    } else {
      setCurrent(next);
      drawGuide(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, wipeInk, drawGuide, onComplete]);

  // ---- drawing ------------------------------------------------------------
  const toXY = (e: React.PointerEvent) => {
    const r = inkRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const mark = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < width && y < height)
      drawnCells.current.add(Math.floor(y / ch) * GRID + Math.floor(x / cw));
  };
  const onDown = (e: React.PointerEvent) => {
    if (doneRef.current || flash) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointerId.current = e.pointerId;
    drawing.current = true;
    const p = toXY(e);
    lastPt.current = p;
    mark(p.x, p.y);
    const ctx = inkRef.current!.getContext("2d")!;
    ctx.strokeStyle = "#fffbe8";
    ctx.lineWidth = Math.max(8, width * 0.03);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current || e.pointerId !== pointerId.current) return;
    const p = toXY(e);
    const last = lastPt.current;
    const ctx = inkRef.current!.getContext("2d")!;
    ctx.beginPath();
    if (last) ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (last) {
      const steps = Math.max(1, Math.ceil(Math.hypot(p.x - last.x, p.y - last.y) / 3));
      for (let i = 1; i <= steps; i++)
        mark(last.x + ((p.x - last.x) * i) / steps, last.y + ((p.y - last.y) * i) / steps);
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

  const st = current < starts.current.length ? starts.current[current] : null;
  const arrowLen = Math.min(width, height) * 0.18;

  return (
    <div
      className={`slate ${flash ? `slate--${flash}` : ""}`}
      style={{ width, height }}
      data-text={text}
      data-step={current}
      data-steps={nStrokes.current}
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
      {st && !doneRef.current && (
        <svg className="slateGuide" width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ zIndex: 2 }}>
          <defs>
            <marker id="gah" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
              <path d="M0 0 L9 4.5 L0 9 Z" fill="#ffd23f" />
            </marker>
          </defs>
          <line
            x1={st.x + st.dx * 15}
            y1={st.y + st.dy * 15}
            x2={st.x + st.dx * arrowLen}
            y2={st.y + st.dy * arrowLen}
            stroke="#ffd23f"
            strokeWidth={4}
            markerEnd="url(#gah)"
          />
          <circle cx={st.x} cy={st.y} r={13} fill="#ffd23f" stroke="#fff" strokeWidth={2} />
          <text x={st.x} y={st.y + 5} textAnchor="middle" fontSize={16} fontWeight={800} fill="#7a5200">
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
