"use client";

// ---------------------------------------------------------------------------
// TRACE SLATE — the chalkboard the child traces a single letter on.
// ---------------------------------------------------------------------------
// The target LOWERCASE letter is drawn as a large FAINT grey guide on the
// canvas. The child drags a finger over it; the finger path is drawn in bright
// chalk. We track COVERAGE only (NO handwriting recognition): the guide glyph
// is rendered to an offscreen canvas, its opaque pixels are bucketed into a
// fine grid of "target" cells, and we mark ONLY the cells the finger passes
// that are themselves glyph cells (points in the empty space don't count). Once
// most of the target cells are covered — and the finger has crossed enough
// distinct glyph cells — we flash green and call onComplete.
// High-DPI aware (devicePixelRatio), like the Hindi slate.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  letter: string; // the lowercase letter to trace
  width: number;
  height: number;
  onComplete: () => void; // called once enough of the guide has been traced
}

const GRID = 18; // coverage grid (cells per axis) — fine enough that off-glyph scribbles miss
const COVER = 0.8; // complete once this fraction of the glyph is covered
const MIN_CELLS = 10; // must cross at least this many DISTINCT glyph cells (a few taps won't do)
const GUIDE_FONT = "'Baloo 2', 'Comic Sans MS', sans-serif";

// Fit a bold font size so the letter sits comfortably inside the slate.
function fitFont(ctx: CanvasRenderingContext2D, text: string, w: number, h: number): number {
  let fs = Math.floor(h * 0.72);
  const maxW = w * 0.72;
  ctx.font = `700 ${fs}px ${GUIDE_FONT}`;
  while (fs > 12 && ctx.measureText(text).width > maxW) {
    fs -= 2;
    ctx.font = `700 ${fs}px ${GUIDE_FONT}`;
  }
  return fs;
}

export default function TraceSlate({ letter, width, height, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetCells = useRef<Set<number>>(new Set());
  const drawnCells = useRef<Set<number>>(new Set());
  const fontPx = useRef(0);
  const drawing = useRef(false);
  const pointerId = useRef<number | null>(null);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const doneRef = useRef(false);
  const [flash, setFlash] = useState<null | "green">(null);

  const cw = width / GRID;
  const ch = height / GRID;

  // Paint the faint grey guide letter onto the (already scaled) 2D context.
  const paintGuide = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.font = `700 ${fontPx.current}px ${GUIDE_FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(233, 237, 234, 0.28)"; // light grey, faint
      ctx.fillText(letter, width / 2, height / 2);
      ctx.restore();
    },
    [letter, width, height]
  );

  // Wipe the child's chalk (keeps the guide) and reset coverage.
  const wipe = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    paintGuide(ctx);
    drawnCells.current = new Set();
    lastPt.current = null;
  }, [paintGuide]);

  // ---- (re)build the guide + target cells whenever letter/size changes ----
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
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Fit the font and remember it for guide + chalk sizing.
    fontPx.current = fitFont(ctx, letter, width, height);

    // Render the glyph SOLID on an offscreen canvas (CSS resolution) and read
    // its opaque pixels into a set of coarse grid cells = the trace target.
    const off = document.createElement("canvas");
    off.width = width;
    off.height = height;
    const octx = off.getContext("2d")!;
    octx.font = `700 ${fontPx.current}px ${GUIDE_FONT}`;
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.fillStyle = "#000";
    octx.fillText(letter, width / 2, height / 2);
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

    paintGuide(ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter, width, height]);

  const checkCoverage = useCallback(() => {
    if (doneRef.current) return;
    const target = targetCells.current;
    if (target.size === 0) return;
    // The finger only ever marks cells that ARE target cells (see mark), so the
    // covered count is simply how many distinct glyph cells have been touched.
    let cov = 0;
    target.forEach((cell) => {
      if (drawnCells.current.has(cell)) cov++;
    });
    const needCells = Math.min(target.size, MIN_CELLS);
    if (cov >= needCells && cov / target.size >= COVER) {
      doneRef.current = true;
      setFlash("green");
      window.setTimeout(() => onComplete(), 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete]);

  // ---- drawing ------------------------------------------------------------
  const toXY = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const mark = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const cell = Math.floor(y / ch) * GRID + Math.floor(x / cw);
    // Only count a point that lands ON an actual glyph cell — scribbles in the
    // empty space around the letter don't add coverage.
    if (targetCells.current.has(cell)) drawnCells.current.add(cell);
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
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.strokeStyle = "#fdf3d0"; // bright chalk
    ctx.lineWidth = Math.max(9, width * 0.03);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
    checkCoverage();
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current || e.pointerId !== pointerId.current) return;
    const p = toXY(e);
    const last = lastPt.current;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    if (last) ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (last) {
      const steps = Math.max(1, Math.ceil(Math.hypot(p.x - last.x, p.y - last.y) / 3));
      for (let i = 1; i <= steps; i++) {
        mark(last.x + ((p.x - last.x) * i) / steps, last.y + ((p.y - last.y) * i) / steps);
      }
    } else {
      mark(p.x, p.y);
    }
    lastPt.current = p;
    checkCoverage();
  };
  const onUp = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerId.current) return;
    drawing.current = false;
    lastPt.current = null;
    pointerId.current = null;
  };

  return (
    <div
      className={`slate ${flash ? `slate--${flash}` : ""}`}
      style={{ width, height }}
      data-text={letter}
    >
      <canvas
        ref={canvasRef}
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
