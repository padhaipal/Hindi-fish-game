"use client";

// ---------------------------------------------------------------------------
// GUIDED SLATE — the trace level (L1), arrow-guided.
// ---------------------------------------------------------------------------
// The whole letter is shown in a flat LIGHT GREY (no per-stroke colour). Little
// black ARROWS march along the CURRENT stroke, inside the letter, showing the
// direction to draw it. The child drags a finger along that stroke; once enough
// of it is covered the arrows vanish and THAT stroke turns WHITE (its true
// shape). The next stroke's arrows then appear. When the last stroke is filled
// the whole letter is white and it flashes green.
//
// Deliberately forgiving: only coverage of the current stroke matters. The ↺
// button restarts the letter.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { fitFont } from "@/lib/lekhan/recognize";
import { LETTER_STROKES, distToPolyline, Stroke } from "@/lib/lekhan/strokes";

interface Props {
  text: string;
  letterId: string;
  width: number;
  height: number;
  onComplete: () => void;
  // Called when the child restarts (↺) — a proxy for "stuck", so the game can
  // offer a "skip" after a couple of restarts (there is no fail state here).
  onMistake?: () => void;
}

const GRID = 18; // coverage grid (cells per axis)
const COVER = 0.5; // fraction of the current stroke that must be covered to fill it

const C_DONE = "#ffffff"; // a completed stroke
const C_GREY = "#cfd6d1"; // the letter before/without being drawn

export default function GuidedSlate({ text, letterId, width, height, onComplete, onMistake }: Props) {
  const viewRef = useRef<HTMLCanvasElement>(null);
  const masks = useRef<HTMLCanvasElement[]>([]); // per-stroke white masks (device px)
  const glyphRef = useRef<HTMLCanvasElement | null>(null); // the whole letter (white)
  const baseRef = useRef<HTMLCanvasElement | null>(null); // grey letter + white done strokes
  const scratchRef = useRef<HTMLCanvasElement | null>(null); // reused for tinting
  const centerlines = useRef<[number, number][][]>([]); // per-stroke path in device px
  const strokeInk = useRef<[number, number][][]>([]); // per-stroke ink points (device px)
  const strokeCells = useRef<Set<number>[]>([]); // validation cells per stroke
  const drawnCells = useRef<Set<number>>(new Set());
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

  // Tint a white mask into `color` at `alpha` and stamp it on `dctx`.
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

  // Base = the whole letter grey, with the already-done strokes painted white.
  const rebuildBase = useCallback(() => {
    const base = baseRef.current;
    const glyph = glyphRef.current;
    if (!base || !glyph) return;
    const bctx = base.getContext("2d")!;
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, base.width, base.height);
    tint(bctx, glyph, C_GREY, 0.9); // the flat grey letter
    const lastDone = doneRef.current ? masks.current.length - 1 : currentRef.current - 1;
    for (let i = 0; i <= lastDone; i++) tint(bctx, masks.current[i], C_DONE, 1);
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
    if (onMistake) onMistake();
  }, [rebuildBase, onMistake]);

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

    // The stroke polylines live in a rough design box; map their COLLECTIVE
    // bounding box onto the glyph's bounding box so the arrows sit on the ink.
    let pMinX = 1e9, pMinY = 1e9, pMaxX = -1e9, pMaxY = -1e9;
    for (const st of strokes)
      for (const [px, py] of st) {
        if (px < pMinX) pMinX = px;
        if (px > pMaxX) pMaxX = px;
        if (py < pMinY) pMinY = py;
        if (py > pMaxY) pMaxY = py;
      }
    const pbw = Math.max(1, pMaxX - pMinX);
    const pbh = Math.max(1, pMaxY - pMinY);
    centerlines.current = strokes.map((st) =>
      st.map(([px, py]) => [
        minx + ((px - pMinX) / pbw) * bw,
        miny + ((py - pMinY) / pbh) * bh,
      ] as [number, number])
    );

    // Assign every glyph pixel to one or more strokes (band around each centre
    // line + nearest fallback) — used for the white "done" fill and coverage.
    const BAND = 17;
    const headline = strokes.length - 1;
    const hasHeadline = strokes.length >= 2;
    const bodyCount = hasHeadline ? headline : strokes.length;
    const maskData: ImageData[] = strokes.map(() => new ImageData(DW, DH));
    const glyphData = new ImageData(DW, DH);
    const sets: Set<number>[] = strokes.map(() => new Set<number>());
    const paint = (s: number, x: number, y: number, al: number) => {
      const md = maskData[s].data;
      const idx = (y * DW + x) * 4;
      md[idx] = 255;
      md[idx + 1] = 255;
      md[idx + 2] = 255;
      md[idx + 3] = Math.max(md[idx + 3], al);
      sets[s].add(Math.floor(y / dpr / ch) * GRID + Math.floor(x / dpr / cw));
    };
    for (let y = 0; y < DH; y++) {
      for (let x = 0; x < DW; x++) {
        const al = data[(y * DW + x) * 4 + 3];
        if (al <= 60) continue;
        const gi = (y * DW + x) * 4;
        glyphData.data[gi] = 255;
        glyphData.data[gi + 1] = 255;
        glyphData.data[gi + 2] = 255;
        glyphData.data[gi + 3] = al;
        const nx = ((x - minx) / bw) * 100;
        const ny = ((y - miny) / bh) * 100;
        if (hasHeadline && ny < 15) {
          paint(headline, x, y, al);
          continue;
        }
        let nearest = 0;
        let nd = Infinity;
        for (let i = 0; i < bodyCount; i++) {
          const d = distToPolyline(nx, ny, strokes[i]);
          if (d < nd) {
            nd = d;
            nearest = i;
          }
          if (d < BAND) paint(i, x, y, al);
        }
        paint(nearest, x, y, al);
      }
    }
    const toCanvas = (imgData: ImageData) => {
      const m = document.createElement("canvas");
      m.width = DW;
      m.height = DH;
      m.getContext("2d")!.putImageData(imgData, 0, 0);
      return m;
    };
    masks.current = maskData.map(toCanvas);
    glyphRef.current = toCanvas(glyphData);
    strokeCells.current = sets;

    // Downsampled ink points per stroke, so arrows can snap onto the real ink.
    const stride = Math.max(3, Math.round(4 * dpr));
    const ink: [number, number][][] = strokes.map(() => []);
    for (let y = 0; y < DH; y += stride)
      for (let x = 0; x < DW; x += stride)
        for (let s = 0; s < strokes.length; s++)
          if (maskData[s].data[(y * DW + x) * 4 + 3] > 60) ink[s].push([x, y]);
    strokeInk.current = ink;

    rebuildBase();

    // animation loop — grey letter + white done strokes + arrows on the current
    // stroke + a fingertip dot.
    const vctx = view.getContext("2d")!;
    vctx.lineCap = "round";
    vctx.lineJoin = "round";
    // Snap (x,y) to the nearest ink point of a stroke, so arrows sit on the ink.
    const snap = (x: number, y: number, pts: [number, number][]): [number, number] => {
      if (!pts || pts.length === 0) return [x, y];
      let bx = x, by = y, bd = Infinity;
      for (const [px, py] of pts) {
        const d = (px - x) * (px - x) + (py - y) * (py - y);
        if (d < bd) {
          bd = d;
          bx = px;
          by = py;
        }
      }
      return [bx, by];
    };
    // Draw STATIC black direction chevrons along a device-px polyline, each
    // snapped onto the current stroke's ink and CLIPPED to the glyph so the
    // arrows sit strictly inside the letter.
    const drawArrows = (
      ctx: CanvasRenderingContext2D,
      poly: [number, number][],
      pts: [number, number][]
    ) => {
      if (poly.length < 2) return;
      const seg: { x0: number; y0: number; dx: number; dy: number; d: number; acc: number }[] = [];
      let total = 0;
      for (let i = 0; i < poly.length - 1; i++) {
        const dx = poly[i + 1][0] - poly[i][0];
        const dy = poly[i + 1][1] - poly[i][1];
        const d = Math.hypot(dx, dy) || 1;
        seg.push({ x0: poly[i][0], y0: poly[i][1], dx, dy, d, acc: total });
        total += d;
      }
      if (total < 4) return;
      const sample = (s: number) => {
        s = Math.max(0, Math.min(total, s));
        for (const g of seg)
          if (s <= g.acc + g.d) {
            const u = (s - g.acc) / g.d;
            return { x: g.x0 + g.dx * u, y: g.y0 + g.dy * u, ux: g.dx / g.d, uy: g.dy / g.d };
          }
        const g = seg[seg.length - 1];
        return { x: g.x0 + g.dx, y: g.y0 + g.dy, ux: g.dx / g.d, uy: g.dy / g.d };
      };
      // Render the chevrons onto the scratch canvas first...
      const sc = scratchRef.current!.getContext("2d")!;
      sc.setTransform(1, 0, 0, 1, 0, 0);
      sc.clearRect(0, 0, DW, DH);
      sc.lineCap = "round";
      sc.lineJoin = "round";
      sc.strokeStyle = "#141414";
      sc.lineWidth = 2.2 * dpr;
      const spacing = 42 * dpr;
      const half = 6.5 * dpr; // half the arrow's shaft length
      const head = 4 * dpr; // arrowhead barb length
      for (let s = spacing * 0.6; s < total - half; s += spacing) {
        const p = sample(s);
        const [sx, sy] = snap(p.x, p.y, pts); // centre the arrow on the actual ink
        const nx = -p.uy, ny = p.ux;
        const tailX = sx - p.ux * half, tailY = sy - p.uy * half;
        const tipX = sx + p.ux * half, tipY = sy + p.uy * half;
        sc.beginPath();
        sc.moveTo(tailX, tailY); // shaft
        sc.lineTo(tipX, tipY);
        sc.moveTo(tipX, tipY); // arrowhead barbs
        sc.lineTo(tipX - p.ux * head + nx * head, tipY - p.uy * head + ny * head);
        sc.moveTo(tipX, tipY);
        sc.lineTo(tipX - p.ux * head - nx * head, tipY - p.uy * head - ny * head);
        sc.stroke();
      }
      // ...then keep only the parts inside the letter, and stamp onto the view.
      sc.globalCompositeOperation = "destination-in";
      if (glyphRef.current) sc.drawImage(glyphRef.current, 0, 0);
      sc.globalCompositeOperation = "source-over";
      ctx.drawImage(scratchRef.current!, 0, 0);
    };
    const loop = () => {
      vctx.setTransform(1, 0, 0, 1, 0, 0);
      vctx.clearRect(0, 0, DW, DH);
      if (baseRef.current) vctx.drawImage(baseRef.current, 0, 0);
      const cur = currentRef.current;
      if (!doneRef.current && cur < centerlines.current.length) {
        drawArrows(vctx, centerlines.current[cur], strokeInk.current[cur] || []);
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

  const advance = useCallback(() => {
    const next = currentRef.current + 1;
    currentRef.current = next;
    drawnCells.current = new Set();
    setCurrent(next);
    if (next >= nStrokes.current) {
      doneRef.current = true;
      rebuildBase();
      setFlash("green");
      window.setTimeout(() => onComplete(), 600);
    } else {
      rebuildBase();
    }
  }, [onComplete, rebuildBase]);

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
    checkCoverage();
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
