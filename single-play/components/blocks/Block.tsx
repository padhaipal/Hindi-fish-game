"use client";

// ---------------------------------------------------------------------------
// BLOCK — one letter "candy" gem in the Blocks game.
// ---------------------------------------------------------------------------
// An outer CELL is positioned (and SLIDES via a transform transition when
// gravity pulls it down); the inner GEM handles its own scale/pop/shake so the
// two transforms don't fight. Each letter has its own bright candy colour.
//   idle -> gem, selected -> raised + ring + order number, correct -> pop,
//   wrong -> red shake.
//
// The gem is purely visual — pointer/swipe handling lives on the board itself
// (see BlocksGame.tsx), which is why `.blockCell` sets `pointer-events: none`.
// ---------------------------------------------------------------------------

import { getLetter } from "@/lib/letters";

export type BlockState = "idle" | "selected" | "correct" | "wrong";

// A small, harmonious set of soft candy tones. Kept deliberately short (and
// gently desaturated) so a full board reads as one cheerful palette rather than
// a clashing rainbow. Each letter is hashed to one of these.
const CANDY = [
  "#ef8b7d", // soft coral
  "#f3b45e", // warm honey
  "#7cc98d", // soft green
  "#6bb6e0", // sky blue
  "#b192dd", // soft lavender
];
function candy(letterId: string): string {
  let h = 0;
  for (let i = 0; i < letterId.length; i++) h = (h * 31 + letterId.charCodeAt(i)) >>> 0;
  return CANDY[h % CANDY.length];
}

interface BlockProps {
  id: number;
  letterId: string;
  x: number;
  y: number;
  size: number;
  state: BlockState;
  order?: number; // 1-based position in the current selection (0 = not selected)
  hint?: boolean;
}

export default function Block({
  letterId,
  x,
  y,
  size,
  state,
  order = 0,
  hint,
}: BlockProps) {
  return (
    <div
      className="blockCell"
      style={{ width: size, height: size, transform: `translate3d(${x}px, ${y}px, 0)` }}
    >
      <span
        className={`block block--${state}${hint ? " block--hint" : ""}`}
        aria-label={`block ${getLetter(letterId).char}`}
        style={{ ["--candy"]: candy(letterId) } as React.CSSProperties}
      >
        <span className="blockLetter">{getLetter(letterId).char}</span>
        {order > 0 && <span className="blockOrder">{order}</span>}
      </span>
    </div>
  );
}
