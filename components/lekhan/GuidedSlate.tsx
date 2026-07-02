"use client";

// ---------------------------------------------------------------------------
// GUIDED SLATE — the trace level (L1).
// ---------------------------------------------------------------------------
// The letter is shown as the accurate font glyph, split into ordered regions
// (body → stem → headline). Only the CURRENT region is highlighted in red (with
// a step number + direction arrow); finished regions turn green; upcoming ones
// stay faint. The child traces the highlighted region:
//   - stray outside it        -> the slate flashes red and that attempt is wiped
//   - cover it well enough     -> it turns green and the next region lights up
// Finish the last region -> the letter is complete. This teaches stroke order.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { fitFont } from "@/lib/lekhan/recognize";
import {
  regionOrder,
  regionOfCell,
  LETTER_STEM,
  HEADLINE_MAXY,
  RegionKey,
} from "@/lib/lekhan/regions";

interface Props {
  text: string; // the letter (glyph)
  letterId: string; // id for stem lookup
  width: number;
  height: number;
  onComplete: () => void;
}

const GRID = 16;
const OFF_MAX = 0.28; // stray budget while tracing the current region
const COVER = 0.66; // how much of the region must be covered to finish it

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  fs: number;
}

export default function GuidedSlate({ text, letterId, width, height, onComplete }: Props) {
  const guideRef = useRef<HTMLCanvasElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const order = useRef<RegionKey[]>([]);
  const regionCells = useRef<Set<number>[]>([]);
  const box = useRef<Box | null>(null);
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

  // ---- draw the guide (regions coloured by state) ------------------------
  const drawGuide = useCallback(
    (cur: number) => {
      const c = guideRef.current;
      const b = box.current;
      if (!c || !b) return;
      const ctx = c.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.font = `700 ${b.fs}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const cx = width / 2;
      const cy = height / 2;
      const barY = b.y + HEADLINE_MAXY * b.h;
      const stem = LETTER_STEM[letterId];
      const rectFor = (key: RegionKey) => {
        if (key === "headline") return [b.x - 3, b.y - 3, b.w + 6, HEADLINE_MAXY * b.h + 3];
        if (key === "stem" && stem)
          return [b.x + stem[0] * b.w, barY, (stem[1] - stem[0]) * b.w, b.h - HEADLINE_MAXY * b.h + 4];
        return [b.x - 3, barY, b.w + 6, b.h - HEADLINE_MAXY * b.h + 4]; // body
      };
      order.current.forEach((key, idx) => {
        const color = idx < cur ? "#63e29a" : idx === cur ? "#ff5b5b" : "rgba(255,255,255,0.16)";
        const [rx, ry, rw, rh] = rectFor(key);
        ctx.save();
        ctx.beginPath();
        ctx.rect(rx, ry, rw, rh);
        ctx.clip();
        ctx.fillStyle = color;
        ctx.fillText(text, cx, cy);
        ctx.restore();
      });
    },
    [dpr, width, height, letterId, text]
  );

  const wipeInk = useCallback(() => {
    const c = inkRef.current;
    if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    drawnCells.current = new Set();
    lastPt.current = null;
  }, []);

  // ---- build regions when the letter/size changes ------------------------
  useEffect(() => {
    doneRef.current = false;
    setFlash(null);
    setCurrent(0);
    const g = guideRef.current;
    const ink = inkRef.current;
    if (!g || !ink) return;
    for (const c of [g, ink]) {
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
      const cx = c.getContext("2d")!;
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.clearRect(0, 0, width, height);
      cx.lineJoin = "round";
      cx.lineCap = "round";
    }

    // render glyph offscreen -> bbox + region cells
    const off = document.createElement("canvas");
    off.width = width;
    off.height = height;
    const octx = off.getContext("2d")!;
    const fs = fitFont(octx, text, width, height);
    octx.font = `700 ${fs}px sans-serif`;
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.fillStyle = "#000";
    octx.fillText(text, width / 2, height / 2);
    const data = octx.getImageData(0, 0, width, height).data;

    let minx = 1e9;
    let miny = 1e9;
    let maxx = -1;
    let maxy = -1;
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        if (data[(y * width + x) * 4 + 3] > 80) {
          if (x < minx) minx = x;
          if (x > maxx) maxx = x;
          if (y < miny) miny = y;
          if (y > maxy) maxy = y;
        }
      }
    }
    const b: Box = { x: minx, y: miny, w: Math.max(1, maxx - minx), h: Math.max(1, maxy - miny), fs };
    box.current = b;

    const ord = regionOrder(letterId);
    const sets: Record<RegionKey, Set<number>> = {
      body: new Set(),
      stem: new Set(),
      headline: new Set(),
    };
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        if (data[(y * width + x) * 4 + 3] > 80) {
          const nx = (x - b.x) / b.w;
          const ny = (y - b.y) / b.h;
          const key = regionOfCell(nx, ny, letterId);
          sets[key].add(Math.floor(y / ch) * GRID + Math.floor(x / cw));
        }
      }
    }
    order.current = ord.filter((k) => sets[k].size > 0);
    regionCells.current = order.current.map((k) => sets[k]);
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
    const region = regionCells.current[current];
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
    if (cov / region.size < COVER) return; // on track but not finished — keep going

    // region done
    wipeInk();
    const next = current + 1;
    if (next >= order.current.length) {
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
    ctx.strokeStyle = "#fdf3d0";
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

  // ---- current-region badge + arrow --------------------------------------
  const badge = (() => {
    const b = box.current;
    if (!b || current >= order.current.length) return null;
    const key = order.current[current];
    const barY = b.y + HEADLINE_MAXY * b.h;
    const stem = LETTER_STEM[letterId];
    if (key === "headline")
      return { n: current + 1, x: b.x, y: b.y + (HEADLINE_MAXY * b.h) / 2, dir: "right" as const };
    if (key === "stem" && stem)
      return { n: current + 1, x: b.x + ((stem[0] + stem[1]) / 2) * b.w, y: barY, dir: "down" as const };
    return { n: current + 1, x: b.x + 6, y: barY + 8, dir: "dot" as const };
  })();

  return (
    <div
      className={`slate ${flash ? `slate--${flash}` : ""}`}
      style={{ width, height }}
      data-text={text}
      data-step={current}
      data-steps={order.current.length}
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
          {badge.dir === "right" && (
            <line x1={badge.x} y1={badge.y} x2={badge.x + Math.min(60, box.current!.w * 0.4)} y2={badge.y} stroke="#ffd23f" strokeWidth={4} markerEnd="url(#ah)" />
          )}
          {badge.dir === "down" && (
            <line x1={badge.x} y1={badge.y} x2={badge.x} y2={badge.y + Math.min(60, box.current!.h * 0.4)} stroke="#ffd23f" strokeWidth={4} markerEnd="url(#ah)" />
          )}
          <defs>
            <marker id="ah" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
              <path d="M0 0 L9 4.5 L0 9 Z" fill="#ffd23f" />
            </marker>
          </defs>
          <circle cx={badge.x} cy={badge.y} r={13} fill="#ffd23f" stroke="#fff" strokeWidth={2} />
          <text x={badge.x} y={badge.y + 5} textAnchor="middle" fontSize={16} fontWeight={800} fill="#7a5200">
            {badge.n}
          </text>
        </svg>
      )}
      <button type="button" className="slateClear" onClick={wipeInk} aria-label="फिर से">
        ↺
      </button>
    </div>
  );
}
