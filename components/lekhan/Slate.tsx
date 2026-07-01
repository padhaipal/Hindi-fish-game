"use client";

// ---------------------------------------------------------------------------
// SLATE — the writing surface for the Lekhan game.
// ---------------------------------------------------------------------------
// The child draws with a finger. We validate against a reference "ink mask" of
// the target text: the glyph is rendered to an offscreen canvas (using the
// font), and its inked cells on a coarse grid become the target. On each lift:
//   - if too much of what they drew is OFF the glyph  -> flash red, wipe, retry
//     (this is the "traced more than X px away" case in the spec);
//   - else if enough of the glyph has been covered    -> flash green, complete.
// This needs no hand-authored letter paths and works for the dotted-trace level
// and the blank / from-memory levels alike (the reference is just hidden).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";

interface SlateProps {
  text: string; // the letter or word to write
  showGuide: boolean; // draw a dotted outline to trace
  width: number;
  height: number;
  onComplete: () => void; // called once the target is written well enough
}

const GRID = 14; // validation grid (cells per axis)
const OFF_MAX = 0.42; // fail once more than this fraction of drawn cells are off
const COVER = 0.7; // complete once this fraction of the glyph is covered

// fit the biggest bold font that leaves a little margin in the slate
function fitFont(ctx: CanvasRenderingContext2D, text: string, w: number, h: number): number {
  let fs = h * 0.72;
  ctx.font = `700 ${fs}px sans-serif`;
  const measured = ctx.measureText(text).width;
  const maxW = w * 0.82;
  if (measured > maxW) fs = (fs * maxW) / measured;
  return Math.round(fs);
}

export default function Slate({ text, showGuide, width, height, onComplete }: SlateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetCells = useRef<Set<number>>(new Set());
  const drawnCells = useRef<Set<number>>(new Set());
  const drawingRef = useRef(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const doneRef = useRef(false);
  const pointerId = useRef<number | null>(null);
  const [flash, setFlash] = useState<null | "red" | "green">(null);
  const [fontPx, setFontPx] = useState(0);

  const cw = width / GRID;
  const ch = height / GRID;

  const wipe = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    drawnCells.current = new Set();
    lastPt.current = null;
  }, []);

  // ---- (re)build the reference mask whenever the target/size changes -------
  useEffect(() => {
    doneRef.current = false;
    setFlash(null);
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(width * dpr);
    c.height = Math.round(height * dpr);
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // offscreen glyph -> inked grid cells
    const off = document.createElement("canvas");
    off.width = width;
    off.height = height;
    const octx = off.getContext("2d")!;
    const fs = fitFont(octx, text, width, height);
    setFontPx(fs);
    octx.fillStyle = "#000";
    octx.font = `700 ${fs}px sans-serif`;
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.fillText(text, width / 2, height / 2);
    const data = octx.getImageData(0, 0, width, height).data;
    const cells = new Set<number>();
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        if (data[(y * width + x) * 4 + 3] > 80) {
          cells.add(Math.floor(y / ch) * GRID + Math.floor(x / cw));
        }
      }
    }
    targetCells.current = cells;
    drawnCells.current = new Set();
    lastPt.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, width, height]);

  // is there a target cell within one cell of `cell`? (tolerance ~1.5 cells)
  const nearTarget = (cell: number) => {
    const r = Math.floor(cell / GRID);
    const col = cell % GRID;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr;
        const cc = col + dc;
        if (rr < 0 || cc < 0 || rr >= GRID || cc >= GRID) continue;
        if (targetCells.current.has(rr * GRID + cc)) return true;
      }
    }
    return false;
  };
  const nearDrawn = (cell: number) => {
    const r = Math.floor(cell / GRID);
    const col = cell % GRID;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr;
        const cc = col + dc;
        if (rr < 0 || cc < 0 || rr >= GRID || cc >= GRID) continue;
        if (drawnCells.current.has(rr * GRID + cc)) return true;
      }
    }
    return false;
  };

  const validate = useCallback(() => {
    const drawn = drawnCells.current;
    if (drawn.size < 3) return;
    let off = 0;
    drawn.forEach((c) => {
      if (!nearTarget(c)) off++;
    });
    if (off / drawn.size > OFF_MAX) {
      // strayed too far -> red flash, wipe, start again
      setFlash("red");
      window.setTimeout(() => {
        wipe();
        setFlash(null);
      }, 480);
      return;
    }
    let cov = 0;
    targetCells.current.forEach((c) => {
      if (nearDrawn(c)) cov++;
    });
    if (targetCells.current.size > 0 && cov / targetCells.current.size >= COVER) {
      doneRef.current = true;
      setFlash("green");
      window.setTimeout(() => onComplete(), 620);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete, wipe]);

  // ---- drawing ------------------------------------------------------------
  const toXY = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const mark = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    drawnCells.current.add(Math.floor(y / ch) * GRID + Math.floor(x / cw));
  };

  const onDown = (e: React.PointerEvent) => {
    if (doneRef.current || flash) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointerId.current = e.pointerId;
    drawingRef.current = true;
    const p = toXY(e);
    lastPt.current = p;
    mark(p.x, p.y);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.strokeStyle = "#fdf3d0";
    ctx.lineWidth = Math.max(9, width * 0.032);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || e.pointerId !== pointerId.current) return;
    const p = toXY(e);
    const last = lastPt.current;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    if (last) ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    // mark cells along the segment so fast strokes don't skip cells
    if (last) {
      const steps = Math.max(1, Math.ceil(Math.hypot(p.x - last.x, p.y - last.y) / (cw / 2)));
      for (let i = 0; i <= steps; i++) {
        mark(last.x + ((p.x - last.x) * i) / steps, last.y + ((p.y - last.y) * i) / steps);
      }
    } else {
      mark(p.x, p.y);
    }
    lastPt.current = p;
  };
  const onUp = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerId.current) return;
    drawingRef.current = false;
    lastPt.current = null;
    pointerId.current = null;
    if (!doneRef.current) validate();
  };

  const guideFs = fontPx || Math.round(height * 0.6);

  return (
    <div className={`slate ${flash ? `slate--${flash}` : ""}`} style={{ width, height }} data-text={text}>
      {showGuide && fontPx > 0 && (
        <svg className="slateGuide" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <text
            x={width / 2}
            y={height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={guideFs}
            fontWeight={700}
            fill="none"
            stroke="#ffffffcc"
            strokeWidth={2}
            strokeDasharray="2 7"
            strokeLinecap="round"
          >
            {text}
          </text>
        </svg>
      )}
      <canvas
        ref={canvasRef}
        className="slateCanvas"
        style={{ width, height }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      <button type="button" className="slateClear" onClick={wipe} aria-label="फिर से">
        ↺
      </button>
    </div>
  );
}
