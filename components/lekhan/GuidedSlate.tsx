"use client";

// ---------------------------------------------------------------------------
// GUIDED SLATE — the trace level (L1).
// ---------------------------------------------------------------------------
// The accurate font glyph is shown as DOTTED OUTLINES, split into its strokes.
// The current stroke's dots are fluorescent white and shimmer/march (in the
// writing direction) to show where to trace next; all other strokes are light
// grey dots. The child traces the current stroke; when enough of it is covered
// its dots turn solid white and the next stroke starts shimmering. No colour
// coding — just white (active/done) vs light grey (not yet).
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
const OFF_MAX = 0.32;
const COVER = 0.6;

export default function GuidedSlate({ text, letterId, width, height, onComplete }: Props) {
  const guideRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const dots = useRef<{ x: number; y: number; s: number; o: number }[]>([]); // device px
  const strokeCells = useRef<Set<number>[]>([]);
  const nStrokes = useRef(0);
  const currentRef = useRef(0);
  const drawnCells = useRef<Set<number>>(new Set());
  const drawing = useRef(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const pointerId = useRef<number | null>(null);
  const doneRef = useRef(false);
  const rafRef = useRef(0);
  const [current, setCurrent] = useState(0);
  const [flash, setFlash] = useState<null | "green">(null);

  const cw = width / GRID;
  const ch = height / GRID;
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const dotR = Math.max(2.2, width * 0.011) * dpr;

  const wipeInk = useCallback(() => {
    const c = inkRef.current;
    if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    drawnCells.current = new Set();
    lastPt.current = null;
  }, []);

  useEffect(() => {
    doneRef.current = false;
    currentRef.current = 0;
    setCurrent(0);
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
    const ictx = ink.getContext("2d")!;
    ictx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ictx.clearRect(0, 0, width, height);
    ictx.lineJoin = "round";
    ictx.lineCap = "round";

    const strokes: Stroke[] = LETTER_STROKES[letterId] || [[[20, 50], [80, 50]]];
    nStrokes.current = strokes.length;

    // render glyph (device res) -> alpha + bbox
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
    const A = (x: number, y: number) => (x < 0 || y < 0 || x >= DW || y >= DH ? 0 : data[(y * DW + x) * 4 + 3]);

    let minx = 1e9, miny = 1e9, maxx = -1, maxy = -1;
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

    // sampled centrelines (device px) -> for ordering dots along the stroke
    const cl = strokes.map((st) =>
      st.map(([x, y]) => [minx + (x / 100) * bw, miny + (y / 100) * bh] as [number, number])
    );
    const orderOf = (px: number, py: number, si: number) => {
      const poly = cl[si];
      let best = 0, bestD = Infinity, acc = 0, total = 0, at = 0;
      for (let i = 0; i < poly.length - 1; i++) total += Math.hypot(poly[i + 1][0] - poly[i][0], poly[i + 1][1] - poly[i][1]);
      total = total || 1;
      for (let i = 0; i < poly.length - 1; i++) {
        const [ax, ay] = poly[i], [bx, by] = poly[i + 1];
        const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
        let t = ((px - ax) * dx + (py - ay) * dy) / l2;
        t = Math.max(0, Math.min(1, t));
        const d = Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
        const segLen = Math.hypot(dx, dy);
        if (d < bestD) { bestD = d; best = acc + t * segLen; }
        acc += segLen;
      }
      at = best;
      return at / total;
    };

    // edge dots: glyph pixels bordering the background, deduped on a small grid
    const spacing = Math.max(6, Math.round(width * 0.026)) * dpr;
    const seen = new Set<number>();
    const list: { x: number; y: number; s: number; o: number }[] = [];
    const sets: Set<number>[] = strokes.map(() => new Set<number>());
    for (let y = 0; y < DH; y++) {
      for (let x = 0; x < DW; x++) {
        const al = data[(y * DW + x) * 4 + 3];
        if (al <= 80) continue;
        const nx = ((x - minx) / bw) * 100;
        const ny = ((y - miny) / bh) * 100;
        const s = segmentStroke(nx, ny, strokes);
        sets[s].add(Math.floor(y / dpr / ch) * GRID + Math.floor(x / dpr / cw)); // validation cell
        // edge?
        if (A(x - 2, y) > 80 && A(x + 2, y) > 80 && A(x, y - 2) > 80 && A(x, y + 2) > 80) continue;
        const key = Math.floor(y / spacing) * 4000 + Math.floor(x / spacing);
        if (seen.has(key)) continue;
        seen.add(key);
        list.push({ x, y, s, o: orderOf(x, y, s) });
      }
    }
    dots.current = list;
    strokeCells.current = sets;
    drawnCells.current = new Set();
    lastPt.current = null;

    // animation loop
    const gctx = g.getContext("2d")!;
    const loop = (t: number) => {
      gctx.setTransform(1, 0, 0, 1, 0, 0);
      gctx.clearRect(0, 0, DW, DH);
      const cur = currentRef.current;
      for (const d of dots.current) {
        let color: string, r = dotR;
        if (d.s < cur) {
          color = "rgba(255,255,255,0.95)"; // done
        } else if (d.s === cur && !doneRef.current) {
          const wave = 0.5 + 0.5 * Math.sin(d.o * Math.PI * 5 - t * 0.007);
          color = `rgba(214,255,224,${0.35 + 0.65 * wave})`; // fluorescent white, marching
          r = dotR * 1.25;
        } else {
          color = "rgba(206,212,208,0.5)"; // light grey
        }
        gctx.fillStyle = color;
        gctx.beginPath();
        gctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        gctx.fill();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, letterId, width, height]);

  const nearSet = (cell: number, set: Set<number>) => {
    const r = Math.floor(cell / GRID);
    const col = cell % GRID;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr, cc = col + dc;
        if (rr < 0 || cc < 0 || rr >= GRID || cc >= GRID) continue;
        if (set.has(rr * GRID + cc)) return true;
      }
    return false;
  };

  const judge = useCallback(() => {
    if (doneRef.current) return;
    const region = strokeCells.current[currentRef.current];
    const drawn = drawnCells.current;
    if (!region || drawn.size < 2) return;
    let off = 0;
    drawn.forEach((c) => {
      if (!nearSet(c, region)) off++;
    });
    if (off / drawn.size > OFF_MAX) {
      wipeInk();
      return; // strayed — just clear the attempt, no red
    }
    let cov = 0;
    region.forEach((c) => {
      if (nearSet(c, drawn)) cov++;
    });
    if (region.size > 0 && cov / region.size < COVER) return;
    wipeInk();
    const next = currentRef.current + 1;
    currentRef.current = next;
    setCurrent(next);
    if (next >= nStrokes.current) {
      doneRef.current = true;
      setFlash("green");
      window.setTimeout(() => onComplete(), 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wipeInk, onComplete]);

  const toXY = (e: React.PointerEvent) => {
    const r = inkRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const mark = (x: number, y: number) => {
    if (x >= 0 && y >= 0 && x < width && y < height)
      drawnCells.current.add(Math.floor(y / ch) * GRID + Math.floor(x / cw));
  };
  const onDown = (e: React.PointerEvent) => {
    if (doneRef.current) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointerId.current = e.pointerId;
    drawing.current = true;
    const p = toXY(e);
    lastPt.current = p;
    mark(p.x, p.y);
    const ctx = inkRef.current!.getContext("2d")!;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(9, width * 0.033);
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
      <button type="button" className="slateClear" onClick={wipeInk} aria-label="फिर से">
        ↺
      </button>
    </div>
  );
}
