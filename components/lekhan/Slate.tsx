"use client";

// ---------------------------------------------------------------------------
// SLATE — the writing surface for the Lekhan game.
// ---------------------------------------------------------------------------
// The child draws with a finger. We validate against a reference of the target
// text rendered to an offscreen canvas (using the font):
//   - accuracy: an "on" mask = the glyph grown outwards by `accTol` px. Any drawn
//     point outside it is OFF. If too much of the drawing is off, the slate
//     flashes red, wipes, and they start again. On the guide level this is
//     strict, so going OUT OF THE DOTTED LINES is marked wrong.
//   - coverage: the glyph's inked cells on a coarse grid; once enough are
//     covered, it flashes green and completes.
// Because many letters need the pen lifted mid-way, we DON'T judge the instant a
// finger lifts — we wait `SETTLE_MS` for them to carry on, and only then mark.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";

interface SlateProps {
  text: string; // the letter or word to write
  showGuide: boolean; // dotted outline to trace (also => strict accuracy)
  width: number;
  height: number;
  onComplete: () => void; // called once the target is written well enough
}

const GRID = 14; // coverage grid (cells per axis)
const COVER = 0.66; // complete once this fraction of the glyph is covered
const SETTLE_MS = 2000; // pause after lifting the finger before we judge

export default function Slate({ text, showGuide, width, height, onComplete }: SlateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetCells = useRef<Set<number>>(new Set());
  const accOn = useRef<Uint8Array | null>(null); // 1 where drawing is allowed
  const drawnPts = useRef<{ x: number; y: number }[]>([]);
  const drawnCells = useRef<Set<number>>(new Set());
  const drawingRef = useRef(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const doneRef = useRef(false);
  const pointerId = useRef<number | null>(null);
  const settleTimer = useRef<number | null>(null);
  const [flash, setFlash] = useState<null | "red" | "green">(null);
  const [fontPx, setFontPx] = useState(0);

  const cw = width / GRID;
  const ch = height / GRID;
  // how far outside the glyph still counts as "on": tight on the trace level,
  // a little looser when writing free-hand.
  const accTol = Math.round(width * (showGuide ? 0.03 : 0.07));
  const OFF_MAX = showGuide ? 0.08 : 0.16;

  const clearSettle = () => {
    if (settleTimer.current) {
      window.clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  };

  const wipe = useCallback(() => {
    const c = canvasRef.current;
    if (c) {
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, c.width, c.height);
    }
    drawnPts.current = [];
    drawnCells.current = new Set();
    lastPt.current = null;
  }, []);

  // ---- (re)build the reference whenever the target/size changes -----------
  useEffect(() => {
    doneRef.current = false;
    setFlash(null);
    clearSettle();
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

    const off = document.createElement("canvas");
    off.width = width;
    off.height = height;
    const octx = off.getContext("2d")!;
    const fs = fitFont(octx, text, width, height);
    setFontPx(fs);
    octx.font = `700 ${fs}px sans-serif`;
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.lineJoin = "round";

    // (1) core glyph -> inked grid cells (for coverage)
    octx.clearRect(0, 0, width, height);
    octx.fillStyle = "#000";
    octx.fillText(text, width / 2, height / 2);
    const core = octx.getImageData(0, 0, width, height).data;
    const cells = new Set<number>();
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        if (core[(y * width + x) * 4 + 3] > 80) {
          cells.add(Math.floor(y / ch) * GRID + Math.floor(x / cw));
        }
      }
    }
    targetCells.current = cells;

    // (2) glyph grown by accTol -> the "on" mask (for accuracy)
    octx.clearRect(0, 0, width, height);
    octx.fillText(text, width / 2, height / 2);
    octx.strokeStyle = "#000";
    octx.lineWidth = accTol * 2;
    octx.strokeText(text, width / 2, height / 2);
    const grown = octx.getImageData(0, 0, width, height).data;
    const mask = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) mask[i] = grown[i * 4 + 3] > 40 ? 1 : 0;
    accOn.current = mask;

    wipe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, width, height]);

  useEffect(() => () => clearSettle(), []);

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
    if (doneRef.current) return;
    const pts = drawnPts.current;
    const mask = accOn.current;
    if (pts.length < 4 || !mask) return;

    // accuracy — how much of the stroke fell outside the allowed region
    let off = 0;
    for (const p of pts) {
      const xi = Math.round(p.x);
      const yi = Math.round(p.y);
      if (xi < 0 || yi < 0 || xi >= width || yi >= height || !mask[yi * width + xi]) off++;
    }
    if (off / pts.length > OFF_MAX) {
      setFlash("red");
      window.setTimeout(() => {
        wipe();
        setFlash(null);
      }, 480);
      return;
    }

    // coverage — did they cover enough of the glyph?
    let cov = 0;
    targetCells.current.forEach((c) => {
      if (nearDrawn(c)) cov++;
    });
    if (targetCells.current.size > 0 && cov / targetCells.current.size >= COVER) {
      doneRef.current = true;
      setFlash("green");
      window.setTimeout(() => onComplete(), 620);
    }
    // else: accurate but not finished — wait quietly for more strokes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete, wipe, width, height, OFF_MAX]);

  // ---- drawing ------------------------------------------------------------
  const toXY = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const addPoint = (x: number, y: number) => {
    drawnPts.current.push({ x, y });
    if (x >= 0 && y >= 0 && x < width && y < height) {
      drawnCells.current.add(Math.floor(y / ch) * GRID + Math.floor(x / cw));
    }
  };

  const onDown = (e: React.PointerEvent) => {
    if (doneRef.current || flash) return;
    e.preventDefault();
    clearSettle(); // they're carrying on — cancel any pending judgement
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointerId.current = e.pointerId;
    drawingRef.current = true;
    const p = toXY(e);
    lastPt.current = p;
    addPoint(p.x, p.y);
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.strokeStyle = "#fdf3d0";
    ctx.lineWidth = Math.max(8, width * 0.028);
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
    if (last) {
      const steps = Math.max(1, Math.ceil(Math.hypot(p.x - last.x, p.y - last.y) / 3));
      for (let i = 1; i <= steps; i++) {
        addPoint(last.x + ((p.x - last.x) * i) / steps, last.y + ((p.y - last.y) * i) / steps);
      }
    } else {
      addPoint(p.x, p.y);
    }
    lastPt.current = p;
  };
  const onUp = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerId.current) return;
    drawingRef.current = false;
    lastPt.current = null;
    pointerId.current = null;
    // Wait in case they lift only to draw the next stroke of the same letter.
    clearSettle();
    settleTimer.current = window.setTimeout(() => validate(), SETTLE_MS);
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

// fit the biggest bold font that leaves a little margin in the slate
function fitFont(ctx: CanvasRenderingContext2D, text: string, w: number, h: number): number {
  let fs = h * 0.72;
  ctx.font = `700 ${fs}px sans-serif`;
  const measured = ctx.measureText(text).width;
  const maxW = w * 0.82;
  if (measured > maxW) fs = (fs * maxW) / measured;
  return Math.round(fs);
}
