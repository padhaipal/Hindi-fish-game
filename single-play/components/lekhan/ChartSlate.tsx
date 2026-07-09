"use client";

// ---------------------------------------------------------------------------
// CHART SLATE — the trace level (L1) driven by an ALfA stroke-chart image.
// ---------------------------------------------------------------------------
// Shows the letter's stroke-order guide image (the letter drawn with numbered
// direction arrows, cropped from the ALfA chart) on a light card. The child
// traces over the letter with a finger; the parts they trace light up (a clean
// chalk fill, clipped to the letter's ink so it stays neat). Once enough of the
// letter is covered it flashes green and completes. The ↺ button restarts.
//
// No stroke-order enforcement: the numbered arrows in the image are the guide.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useRef, useState } from "react";
import { strokeImageSrc } from "@/lib/lekhan/strokeImages";

interface Props {
  letterId: string;
  width: number;
  height: number;
  onComplete: () => void;
  onMistake?: () => void;
}

const GRID = 22; // coverage grid
const COVER = 0.6; // fraction of the letter's ink that must be traced

export default function ChartSlate({ letterId, width, height, onComplete, onMistake }: Props) {
  const viewRef = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null); // the chart image on white
  const inkRef = useRef<HTMLCanvasElement | null>(null); // white where the letter's ink is
  const revealRef = useRef<HTMLCanvasElement | null>(null); // finger trail
  const scratchRef = useRef<HTMLCanvasElement | null>(null);
  const targetCells = useRef<Set<number>>(new Set());
  const drawnCells = useRef<Set<number>>(new Set());
  const drawing = useRef(false);
  const pointerId = useRef<number | null>(null);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const doneRef = useRef(false);
  const rafRef = useRef(0);
  const [flash, setFlash] = useState<null | "green">(null);
  const [ready, setReady] = useState(false);

  const cw = width / GRID;
  const ch = height / GRID;
  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  const resetAll = useCallback(() => {
    doneRef.current = false;
    drawnCells.current = new Set();
    lastPt.current = null;
    const rv = revealRef.current;
    if (rv) rv.getContext("2d")!.clearRect(0, 0, rv.width, rv.height);
    setFlash(null);
    if (onMistake) onMistake();
  }, [onMistake]);

  useEffect(() => {
    doneRef.current = false;
    drawnCells.current = new Set();
    lastPt.current = null;
    setFlash(null);
    setReady(false);
    const view = viewRef.current;
    if (!view) return;
    const DW = Math.round(width * dpr);
    const DH = Math.round(height * dpr);
    view.width = DW;
    view.height = DH;

    for (const ref of [baseRef, inkRef, revealRef, scratchRef]) {
      const c = document.createElement("canvas");
      c.width = DW;
      c.height = DH;
      ref.current = c;
    }

    const img = new Image();
    img.onload = () => {
      // fit the image into the slate with a small margin
      const margin = 0.08;
      const availW = width * (1 - margin * 2);
      const availH = height * (1 - margin * 2);
      const scale = Math.min(availW / img.width, availH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const ox = (width - w) / 2;
      const oy = (height - h) / 2;

      const bctx = baseRef.current!.getContext("2d")!;
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.fillStyle = "#fbfaf5"; // warm off-white card
      bctx.fillRect(0, 0, width, height);
      bctx.drawImage(img, ox, oy, w, h);

      // classify pixels -> the letter's ink (dark/coloured, NOT the light-blue
      // headline shelf and NOT the near-white paper).
      const data = bctx.getImageData(0, 0, DW, DH).data;
      const inkData = new ImageData(DW, DH);
      const cells = new Set<number>();
      for (let y = 0; y < DH; y++) {
        for (let x = 0; x < DW; x++) {
          const i = (y * DW + x) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const nearWhite = r > 225 && g > 225 && b > 225;
          const bluish = b > 170 && b - r > 30 && g > 150; // the shelf
          if (nearWhite || bluish) continue;
          inkData.data[i] = 255;
          inkData.data[i + 1] = 255;
          inkData.data[i + 2] = 255;
          inkData.data[i + 3] = 255;
          cells.add(Math.floor(y / dpr / ch) * GRID + Math.floor(x / dpr / cw));
        }
      }
      inkRef.current!.getContext("2d")!.putImageData(inkData, 0, 0);
      targetCells.current = cells;
      setReady(true);
    };
    img.onerror = () => setReady(true); // still show the card
    img.src = strokeImageSrc(letterId);

    // render loop: base + the traced-white reveal (clipped to the ink)
    const vctx = view.getContext("2d")!;
    const loop = () => {
      vctx.setTransform(1, 0, 0, 1, 0, 0);
      vctx.clearRect(0, 0, DW, DH);
      if (baseRef.current) vctx.drawImage(baseRef.current, 0, 0);
      // reveal = revealTrail ∩ ink, painted bright
      const sc = scratchRef.current;
      if (sc && revealRef.current && inkRef.current) {
        const s = sc.getContext("2d")!;
        s.setTransform(1, 0, 0, 1, 0, 0);
        s.clearRect(0, 0, DW, DH);
        s.globalCompositeOperation = "source-over";
        s.drawImage(revealRef.current, 0, 0);
        s.globalCompositeOperation = "source-in";
        s.drawImage(inkRef.current, 0, 0);
        s.globalCompositeOperation = "source-in";
        s.fillStyle = "#20b24a"; // traced ink lights up green
        s.fillRect(0, 0, DW, DH);
        s.globalCompositeOperation = "source-over";
        vctx.drawImage(sc, 0, 0);
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letterId, width, height]);

  const onCell = (cell: number) => {
    // count only cells that lie on the letter's ink
    const r = Math.floor(cell / GRID), col = cell % GRID;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr, cc = col + dc;
        if (rr < 0 || cc < 0 || rr >= GRID || cc >= GRID) continue;
        if (targetCells.current.has(rr * GRID + cc)) return true;
      }
    return false;
  };

  const checkCoverage = useCallback(() => {
    if (doneRef.current) return;
    const target = targetCells.current;
    if (target.size === 0) return;
    let cov = 0;
    target.forEach((c) => {
      if (drawnCells.current.has(c)) cov++;
    });
    if (cov / target.size >= COVER) {
      doneRef.current = true;
      setFlash("green");
      window.setTimeout(() => onComplete(), 600);
    }
  }, [onComplete]);

  const toXY = (e: React.PointerEvent) => {
    const r = viewRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const paintReveal = (x: number, y: number) => {
    const rv = revealRef.current;
    if (!rv) return;
    const ctx = rv.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x, y, Math.max(11, width * 0.05), 0, Math.PI * 2);
    ctx.fill();
  };
  const mark = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const cell = Math.floor(y / ch) * GRID + Math.floor(x / cw);
    if (onCell(cell)) {
      drawnCells.current.add(cell);
      paintReveal(x, y);
    }
  };

  const onDown = (e: React.PointerEvent) => {
    if (doneRef.current || !ready) return;
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
    pointerId.current = null;
  };

  return (
    <div
      className={`slate slate--chart ${flash ? `slate--${flash}` : ""}`}
      style={{ width, height, background: "#fbfaf5" }}
      data-text={letterId}
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
