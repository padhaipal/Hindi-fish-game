"use client";

// ---------------------------------------------------------------------------
// MATRA WRITE SLATE — write just the MATRA; the consonant is already in place.
// ---------------------------------------------------------------------------
// The consonant क is drawn on the chalkboard as a solid, locked, non-interactive
// glyph ("already written — don't touch it"). The child then writes ONLY the
// matra onto it, with their finger, and their chalk shows up as real ink (this
// is a free-writing surface, not an order-enforced tracer, so the board never
// looks blank while they work). We judge like the letter free-write Slate:
//   • coverage  — once enough of the matra region has been inked, it flashes
//     green and completes. We WAIT a settle beat after the finger lifts before
//     judging, so a slow child is never cut off mid-matra.
//   • accuracy  — if they scribble far outside the matra (e.g. try to rewrite
//     the whole क), it flashes red and wipes, nudging them to write just the
//     matra. This is generous — small overlaps onto क are fine.
//
//   • guided = true  → the matra is shown as a clearly-defined dashed outline to
//     fill in, and its region is softly highlighted.
//   • guided = false → no outline; just a soft highlight of WHERE the matra goes
//     (so it stays obvious it's only the matra, not the whole letter).
// Both use the same medial-axis matra strokes (lib/matra/matraStrokes.ts).
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { getMatraWrite, type Stroke } from "@/lib/matra/matraStrokes";

interface Props {
  matraId: string;
  guided: boolean;
  width: number;
  height: number;
  onComplete: () => void;
}

type Pt = { x: number; y: number };

const MARGIN = 0.14;
const GUIDE_W_FRAC = 0.12; // consonant / matra guide line width
const GRID = 16; // coverage grid (cells per axis)
const COVER = 0.5; // complete once this fraction of the matra is covered
const SETTLE_MS = 1500; // pause after lifting the finger before we judge

const COL_CONS = "rgba(214, 224, 220, 0.66)"; // consonant, drawn (locked) in place
const COL_MATRA_FILL = "rgba(255, 236, 150, 0.20)"; // soft matra region highlight
const COL_MATRA_EDGE = "rgba(255, 240, 170, 0.9)"; // dashed matra outline (guided)
const COL_GREEN = "rgba(120, 226, 140, 0.97)"; // completed matra, on success
const INK = "#fdf3d0"; // the child's chalk

function strokePath(ctx: CanvasRenderingContext2D, pts: Pt[], lw: number): void {
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (pts.length === 1) {
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, lw / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  if (pts.length === 2) ctx.lineTo(pts[1].x, pts[1].y);
  else {
    for (let i = 1; i < pts.length - 1; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2;
      const yc = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
    }
    ctx.quadraticCurveTo(pts[pts.length - 2].x, pts[pts.length - 2].y, pts[pts.length - 1].x, pts[pts.length - 1].y);
  }
  ctx.stroke();
}

export default function MatraWriteSlate({ matraId, guided, width, height, onComplete }: Props) {
  const guideRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLCanvasElement>(null);

  const consRef = useRef<Pt[][]>([]);
  const matraRef = useRef<Pt[][]>([]);
  const matraBox = useRef<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const targetCells = useRef<Set<number>>(new Set());
  const accOn = useRef<Uint8Array | null>(null); // 1 where drawing is allowed
  const drawnPts = useRef<Pt[]>([]);
  const drawnCells = useRef<Set<number>>(new Set());

  const drawingRef = useRef(false);
  const lastPt = useRef<Pt | null>(null);
  const pointerId = useRef<number | null>(null);
  const doneRef = useRef(false);
  const settleTimer = useRef<number | null>(null);
  const [flash, setFlash] = useState<null | "red" | "green">(null);

  const minDim = Math.min(width, height);
  const guideW = minDim * GUIDE_W_FRAC;
  const cw = width / GRID;
  const ch = height / GRID;
  const accTol = Math.round(minDim * (guided ? 0.06 : 0.1));
  const OFF_MAX = guided ? 0.34 : 0.46;
  const inkW = Math.max(9, minDim * 0.05);

  const clearSettle = () => {
    if (settleTimer.current) {
      window.clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  };

  const wipeInk = useCallback(() => {
    const c = inputRef.current;
    if (c) c.getContext("2d")!.clearRect(0, 0, width, height);
    drawnPts.current = [];
    drawnCells.current = new Set();
    lastPt.current = null;
  }, [width, height]);

  // ---- draw the (static) guide layer: locked क + matra hint / green -------
  const renderGuide = useCallback(() => {
    const c = guideRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    // soft highlight of the matra region (both modes) — "the matra goes HERE".
    const box = matraBox.current;
    if (box) {
      const pad = guideW * 0.75;
      const x = box.x0 - pad;
      const y = box.y0 - pad;
      const w = box.x1 - box.x0 + pad * 2;
      const h = box.y1 - box.y0 + pad * 2;
      const r = Math.min(w, h) * 0.32;
      ctx.fillStyle = "rgba(255, 236, 150, 0.10)";
      ctx.strokeStyle = "rgba(255, 236, 150, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // the consonant क — already written, locked, not to be traced.
    ctx.strokeStyle = COL_CONS;
    ctx.fillStyle = COL_CONS;
    for (const s of consRef.current) strokePath(ctx, s, guideW);

    // the matra: green once solved; else a fill-in outline (guided) only.
    if (doneRef.current) {
      ctx.strokeStyle = COL_GREEN;
      ctx.fillStyle = COL_GREEN;
      for (const s of matraRef.current) strokePath(ctx, s, guideW * 0.9);
    } else if (guided) {
      ctx.strokeStyle = COL_MATRA_FILL;
      ctx.fillStyle = COL_MATRA_FILL;
      for (const s of matraRef.current) strokePath(ctx, s, guideW);
      ctx.strokeStyle = COL_MATRA_EDGE;
      ctx.fillStyle = COL_MATRA_EDGE;
      ctx.setLineDash([4, 6]);
      for (const s of matraRef.current) strokePath(ctx, s, Math.max(2, guideW * 0.14));
      ctx.setLineDash([]);
    }
  }, [width, height, guideW, guided]);

  // ---- (re)build everything when the matra / size changes -----------------
  useEffect(() => {
    doneRef.current = false;
    setFlash(null);
    clearSettle();

    const g = guideRef.current;
    const inp = inputRef.current;
    if (!g || !inp) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    for (const c of [g, inp]) {
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
      const ctx = c.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const data = getMatraWrite(matraId);
    const all: Stroke[] = [...data.consonant, ...data.matra];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of all) for (const [x, y] of s) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    const bw = Math.max(1e-3, maxX - minX);
    const bh = Math.max(1e-3, maxY - minY);
    const scale = Math.min((width * (1 - 2 * MARGIN)) / bw, (height * (1 - 2 * MARGIN)) / bh);
    const offX = (width - bw * scale) / 2;
    const offY = (height - bh * scale) / 2;
    const map = ([x, y]: number[]): Pt => ({ x: offX + (x - minX) * scale, y: offY + (y - minY) * scale });

    consRef.current = data.consonant.map((s) => s.map(map));
    const matra = data.matra.map((s) => s.map(map));
    matraRef.current = matra;

    // matra bounding box (for the highlight)
    let mx0 = Infinity, my0 = Infinity, mx1 = -Infinity, my1 = -Infinity;
    for (const s of matra) for (const p of s) {
      if (p.x < mx0) mx0 = p.x; if (p.x > mx1) mx1 = p.x;
      if (p.y < my0) my0 = p.y; if (p.y > my1) my1 = p.y;
    }
    matraBox.current = Number.isFinite(mx0) ? { x0: mx0, y0: my0, x1: mx1, y1: my1 } : null;

    // rasterise the matra to (1) coverage cells and (2) the accuracy "on" mask.
    const off = document.createElement("canvas");
    off.width = width;
    off.height = height;
    const octx = off.getContext("2d")!;
    octx.lineCap = "round";
    octx.lineJoin = "round";
    octx.strokeStyle = "#000";
    octx.fillStyle = "#000";

    // (1) coverage: matra drawn at roughly its written thickness -> grid cells.
    octx.clearRect(0, 0, width, height);
    for (const s of matra) strokePath(octx, s, guideW * 0.9);
    const core = octx.getImageData(0, 0, width, height).data;
    const cells = new Set<number>();
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        if (core[(y * width + x) * 4 + 3] > 80) cells.add(Math.floor(y / ch) * GRID + Math.floor(x / cw));
      }
    }
    targetCells.current = cells;

    // (2) accuracy: matra grown by accTol -> the region drawing is allowed in.
    octx.clearRect(0, 0, width, height);
    for (const s of matra) strokePath(octx, s, guideW + accTol * 2);
    const grown = octx.getImageData(0, 0, width, height).data;
    const mask = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) mask[i] = grown[i * 4 + 3] > 40 ? 1 : 0;
    accOn.current = mask;

    wipeInk();
    renderGuide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matraId, width, height, guided]);

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

  const succeed = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    setFlash("green");
    renderGuide(); // paint the matra green
    window.setTimeout(() => onComplete(), 640);
  }, [onComplete, renderGuide]);

  const reject = useCallback(() => {
    setFlash("red");
    window.setTimeout(() => {
      wipeInk();
      setFlash(null);
    }, 460);
  }, [wipeInk]);

  const validate = useCallback(() => {
    if (doneRef.current) return;
    const pts = drawnPts.current;
    const mask = accOn.current;
    if (pts.length < 4 || !mask) return;

    // accuracy — how much ink fell outside the matra's allowed region
    let offCount = 0;
    for (const p of pts) {
      const xi = Math.round(p.x);
      const yi = Math.round(p.y);
      if (xi < 0 || yi < 0 || xi >= width || yi >= height || !mask[yi * width + xi]) offCount++;
    }
    if (offCount / pts.length > OFF_MAX) {
      reject();
      return;
    }

    // coverage — did they ink enough of the matra?
    let cov = 0;
    targetCells.current.forEach((c) => {
      if (nearDrawn(c)) cov++;
    });
    if (targetCells.current.size > 0 && cov / targetCells.current.size >= COVER) succeed();
    // else: accurate but not finished — wait quietly for more strokes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, OFF_MAX, reject, succeed]);

  // ---- drawing ------------------------------------------------------------
  const toXY = (e: React.PointerEvent): Pt => {
    const r = inputRef.current!.getBoundingClientRect();
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
    clearSettle();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointerId.current = e.pointerId;
    drawingRef.current = true;
    const p = toXY(e);
    lastPt.current = p;
    addPoint(p.x, p.y);
    const ctx = inputRef.current!.getContext("2d")!;
    ctx.strokeStyle = INK;
    ctx.lineWidth = inkW;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + 0.1, p.y + 0.1);
    ctx.stroke();
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || e.pointerId !== pointerId.current) return;
    const p = toXY(e);
    const last = lastPt.current;
    const ctx = inputRef.current!.getContext("2d")!;
    ctx.beginPath();
    if (last) ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    if (last) {
      const steps = Math.max(1, Math.ceil(Math.hypot(p.x - last.x, p.y - last.y) / 3));
      for (let i = 1; i <= steps; i++) addPoint(last.x + ((p.x - last.x) * i) / steps, last.y + ((p.y - last.y) * i) / steps);
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
    clearSettle();
    settleTimer.current = window.setTimeout(() => validate(), SETTLE_MS);
  };

  const clear = useCallback(() => {
    clearSettle();
    doneRef.current = false;
    setFlash(null);
    wipeInk();
    renderGuide();
  }, [wipeInk, renderGuide]);

  return (
    <div className={`slate ${flash ? `slate--${flash}` : ""}`} style={{ width, height }}>
      <canvas ref={guideRef} className="slateGuide" style={{ width, height }} />
      <canvas
        ref={inputRef}
        className="slateCanvas"
        style={{ width, height }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      <button type="button" className="slateClear" onClick={clear} aria-label="फिर से">
        ↺
      </button>
    </div>
  );
}
