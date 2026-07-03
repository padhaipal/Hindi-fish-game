"use client";

// ---------------------------------------------------------------------------
// BLOCK — one letter tile in the Blocks game.
// ---------------------------------------------------------------------------
// Position (x, y) is set by the parent so blocks can SLIDE (CSS transition on
// transform) when gravity pulls them down. Visual state colours the tile:
//   idle     -> grey, selected -> blue ring, correct -> green, wrong -> red.
// ---------------------------------------------------------------------------

import { getLetter } from "@/lib/letters";

export type BlockState = "idle" | "selected" | "correct" | "wrong";

interface BlockProps {
  id: number;
  letterId: string;
  x: number;
  y: number;
  size: number;
  state: BlockState;
  hint?: boolean; // demo highlight (pulsing) for the correct pair
  onTap: (id: number) => void;
}

export default function Block({
  id,
  letterId,
  x,
  y,
  size,
  state,
  hint,
  onTap,
}: BlockProps) {
  return (
    <button
      type="button"
      className={`block block--${state}${hint ? " block--hint" : ""}`}
      aria-label={`block ${getLetter(letterId).char}`}
      style={{
        width: size,
        height: size,
        transform: `translate3d(${x}px, ${y}px, 0)`,
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        onTap(id);
      }}
    >
      <span className="blockLetter">{getLetter(letterId).char}</span>
    </button>
  );
}
