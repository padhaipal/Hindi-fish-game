"use client";

// ---------------------------------------------------------------------------
// GUIDED SLATE — the trace level (L1), solid-fill style.
// ---------------------------------------------------------------------------
// The whole letter is shown as a SOLID FILL, split into its strokes:
//   - light grey   = a stroke not done yet
//   - flashing yellow = the stroke to trace NEXT
//   - white        = a stroke already done
// The child drags a finger over the flashing yellow stroke; once they've
// covered enough of it, that stroke snaps to WHITE in its true shape (we do NOT
// trace the child's wiggly finger path) and the next stroke starts flashing.
// When the last stroke is filled the letter flashes green and completes.
//
// It's deliberately forgiving: only coverage of the current stroke matters, so
// a slightly messy drag still fills it. The ↺ button restarts the letter.
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

const GRID = 18; // coverage grid (cells per axis)
const COVER = 0.5; // fraction of the current stroke that must be covered to fill it

// Colours for the three stroke states.
const C_DONE = "#ffffff";
const C_PENDING = "#c8d0cc";
const C_YELLOW = "#ffe23a";

export default function GuidedSlate({ text, letterId, width, height, onComplete }: Props) {
  const viewRef = useRef<HTMLCanvasElement>(null); // the coloured letter
  const masks = useRef<HTMLCanvasElement[]>([]); // per-stroke white masks (device px)
  const baseRef = useRef<HTMLCanvasElement | null>(null); // done+pending, recomputed on advance
  const scratchRef = useRef<HTMLCanvasElement | null>(null); // reused for tinting the live stroke
  const strokeCells = useRef<Set<number>[]>([]); // validation cells per stroke
  const drawnCells = useRef<Set<number>>(new Set()); // cells covered in the current stroke
  const nStrokes = useRef(0);
  const currentRef = useRef(0);
  const drawing = useRef(false);
  const pointerId = useRef<number | null>(null);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const fingerRef = useRef<{ x: number; y: number } | null>(null);
  const doneRef = useRef(false);
  const rafRef = useRef(0);
  const [current, setCurrent] = useState(0);
  const [flash, setFlash] = useState<null | "green">(null);

  const cw = width / GRID;
  const ch = height / GRID;
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  // Tint a white per-stroke mask into `color` at `alpha` and stamp it on `dctx`.
  const tint = useCallback(
    (dctx: CanvasRenderingContext2D, mask: HTMLCanvasElement, color: string, alpha: number) => {
      const s = scratchRef.current!;
      const sctx = s.getContext("2d")!;
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.clearRect(0, 0, s.width, s.height);
      sctx.globalCompositeOperation = "source-over";
      sctx.drawImage(mask, 0, 0);
      sctx.globalCompositeOperation = "source-in";
      sctx.fillStyle = color;
      sctx.fillRect(0, 0, s.width, s.height);
      dctx.globalAlpha = alpha;
      dctx.drawImage(s, 0, 0);
      dctx.globalAlpha = 1;
    },
    []
  );

  // Recompute the static base = done strokes (white) + pending strokes (grey).
  const rebuildBase = useCallback(() => {
    const base = baseRef.current;
    if (!base) return;
    const bctx = base.getContext("2d")!;
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, base.width, base.height);
    const cur = currentRef.current;
    for (let i = 0; i < masks.current.length; i++) {
      if (i === cur && !doneRef.current) continue; // the live stroke is drawn per-frame
      const done = i < cur;
      // done = bright white; pending = dim grey (so "done" clearly stands out)
      tint(bctx, masks.current[i], done ? C_DONE : C_PENDING, done ? 1 : 0.5);
    }
  }, [tint]);

  const resetAll = useCallback(() => {
    doneRef.current = false;
    currentRef.current = 0;
    drawnCells.current = new Set();
    lastPt.current = null;
    fingerRef.current = null;
    setCurrent(0);
    setFlash(null);
    rebuildBase();
  }, [rebuildBase]);

  useEffect(() => {
    doneRef.current = false;
    currentRef.current = 0;
    drawnCells.current = new Set();
    lastPt.current = null;
    fingerRef.current = null;
    setCurrent(0);
    setFlash(null);

    const view = viewRef.current;
    if (!view) return;
    const DW = Math.round(width * dpr);
    const DH = Math.round(height * dpr);
    view.width = DW;
    view.height = DH;

    const base = document.createElement("canvas");
    base.width = DW;
    base.height = DH;
    baseRef.current = base;
    const scratch = document.createElement("canvas");
    scratch.width = DW;
    scratch.height = DH;
    scratchRef.current = scratch;

    const strokes: Stroke[] = LETTER_STROKES[letterId] || [[[20, 50], [80, 50]]];
    nStrokes.current = strokes.length;

    // render the glyph (device res) -> alpha + bbox
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

    // per-stroke white mask (device px) + per-stroke validation cells
    const maskData: ImageData[] = strokes.map(() => new ImageData(DW, DH));
    const sets: Set<number>[] = strokes.map(() => new Set<number>());
    for (let y = 0; y < DH; y++) {
      for (let x = 0; x < DW; x++) {
        const al = data[(y * DW + x) * 4 + 3];
        if (al <= 60) continue;
        const nx = ((x - minx) / bw) * 100;
        const ny = ((y - miny) / bh) * 100;
        const s = segmentStroke(nx, ny, strokes);
        const md = maskData[s].data;
        const idx = (y * DW + x) * 4;
        md[idx] = 255;
        md[idx + 1] = 255;
        md[idx + 2] = 255;
        md[idx + 3] = al; // keep the glyph's own anti-aliased edge
        sets[s].add(Math.floor(y / dpr / ch) * GRID + Math.floor(x / dpr / cw));
      }
    }
    masks.current = maskData.map((imgData) => {
      const m = document.createElement("canvas");
      m.width = DW;
      m.height = DH;
      m.getContext("2d")!.putImageData(imgData, 0, 0);
      return m;
    });
    strokeCells.current = sets;

    rebuildBase();

    // animation loop — base + the flashing yellow live stroke + a fingertip dot
    const vctx = view.getContext("2d")!;
    const loop = (t: number) => {
      vctx.setTransform(1, 0, 0, 1, 0, 0);
      vctx.clearRect(0, 0, DW, DH);
      if (baseRef.current) vctx.drawImage(baseRef.current, 0, 0);
      const cur = currentRef.current;
      if (!doneRef.current && cur < masks.current.length) {
        // solid yellow so it stays vivid on the dark board, plus a white
        // shimmer that pulses on top to make it "flash".
        tint(vctx, masks.current[cur], C_YELLOW, 1);
        const shimmer = 0.28 + 0.28 * Math.sin(t * 0.006);
        tint(vctx, masks.current[cur], "#ffffff", shimmer);
      }
      const f = fingerRef.current;
      if (f && drawing.current) {
        vctx.beginPath();
        vctx.fillStyle = "rgba(255,255,255,0.85)";
        vctx.arc(f.x * dpr, f.y * dpr, Math.max(5, width * 0.02) * dpr, 0, Math.PI * 2);
        vctx.fill();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, letterId, width, height]);

  // is `cell` inside (or adjacent to) the current stroke's region?
  const inCurrentRegion = (cell: number) => {
    const region = strokeCells.current[currentRef.current];
    if (!region) return false;
    const r = Math.floor(cell / GRID), col = cell % GRID;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr, cc = col + dc;
        if (rr < 0 || cc < 0 || rr >= GRID || cc >= GRID) continue;
        if (region.has(rr * GRID + cc)) return true;
      }
    return false;
  };

  // Advance to the next stroke (snap current to white); finish if it was the last.
  const advance = useCallback(() => {
    const next = currentRef.current + 1;
    currentRef.current = next;
    drawnCells.current = new Set();
    setCurrent(next);
    if (next >= nStrokes.current) {
      doneRef.current = true;
      rebuildBase(); // all strokes white
      setFlash("green");
      window.setTimeout(() => onComplete(), 600);
    } else {
      rebuildBase(); // previous stroke now white
    }
  }, [onComplete, rebuildBase]);

  // Have we covered enough of the current stroke to fill it?
  const checkCoverage = useCallback(() => {
    if (doneRef.current) return;
    const region = strokeCells.current[currentRef.current];
    const drawn = drawnCells.current;
    if (!region || region.size === 0) return;
    let cov = 0;
    region.forEach((c) => {
      const r = Math.floor(c / GRID), col = c % GRID;
      let hit = false;
      for (let dr = -1; dr <= 1 && !hit; dr++)
        for (let dc = -1; dc <= 1 && !hit; dc++) {
          const rr = r + dr, cc = col + dc;
          if (rr < 0 || cc < 0 || rr >= GRID || cc >= GRID) continue;
          if (drawn.has(rr * GRID + cc)) hit = true;
        }
      if (hit) cov++;
    });
    if (cov / region.size >= COVER) advance();
  }, [advance]);

  const toXY = (e: React.PointerEvent) => {
    const r = viewRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const mark = (x: number, y: number) => {
    fingerRef.current = { x, y };
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const cell = Math.floor(y / ch) * GRID + Math.floor(x / cw);
    // only count marks that land on the current stroke — messy strays are ignored
    if (inCurrentRegion(cell)) drawnCells.current.add(cell);
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
    checkCoverage();
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawing.current || e.pointerId !== pointerId.current) return;
    const p = toXY(e);
    const last = lastPt.current;
    if (last) {
      const steps = Math.max(1, Math.ceil(Math.hypot(p.x - last.x, p.y - last.y) / 4));
      for (let i = 1; i <= steps; i++)
        mark(last.x + ((p.x - last.x) * i) / steps, last.y + ((p.y - last.y) * i) / steps);
    } else {
      mark(p.x, p.y);
    }
    lastPt.current = p;
    checkCoverage(); // fill the stroke as soon as it's covered — mid-drag is fine
  };
  const onUp = (e: React.PointerEvent) => {
    if (e.pointerId !== pointerId.current) return;
    drawing.current = false;
    lastPt.current = null;
    fingerRef.current = null;
    pointerId.current = null;
  };

  return (
    <div
      className={`slate ${flash ? `slate--${flash}` : ""}`}
      style={{ width, height }}
      data-text={text}
      data-step={current}
      data-steps={nStrokes.current}
    >
      <canvas
        ref={viewRef}
        className="slateCanvas"
        style={{ width, height, zIndex: 1 }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      <button type="button" className="slateClear" onClick={resetAll} aria-label="फिर से">
        ↺
      </button>
    </div>
  );
}
