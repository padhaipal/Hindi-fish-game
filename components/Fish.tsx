"use client";

// ---------------------------------------------------------------------------
// FISH — one swimming fish carrying a single Hindi letter.
// ---------------------------------------------------------------------------
// Movement (the transform) is driven by the parent PondGame via a direct DOM
// ref for smooth, low-cost animation. This component only renders the fish
// shape + letter and reports taps. Big, finger-friendly tap target.
// ---------------------------------------------------------------------------

import { FishSpec } from "@/lib/round";

// A cheerful palette; each fish picks a colour from its letter id so the same
// letter is always the same colour (gentle visual consistency for kids).
const FISH_COLORS = [
  "#ff8a3d",
  "#ff5da2",
  "#7c5cff",
  "#2ec4b6",
  "#ffb703",
  "#4ea8de",
  "#ef476f",
  "#06d6a0",
];

function colorFor(letterId: string): string {
  let sum = 0;
  for (let i = 0; i < letterId.length; i++) sum += letterId.charCodeAt(i);
  return FISH_COLORS[sum % FISH_COLORS.length];
}

interface FishProps {
  spec: FishSpec;
  registerRef: (id: number, el: HTMLButtonElement | null) => void;
  onTap: (spec: FishSpec, el: HTMLButtonElement) => void;
}

export default function Fish({ spec, registerRef, onTap }: FishProps) {
  return (
    <button
      type="button"
      className="fish"
      aria-label={`fish letter ${spec.char}`}
      ref={(el) => registerRef(spec.id, el)}
      style={{ ["--fish-color" as string]: colorFor(spec.letterId) }}
      onPointerDown={(e) => {
        e.preventDefault();
        onTap(spec, e.currentTarget);
      }}
    >
      <span className="fishBody">
        <span className="fishEye" />
        <span className="fishLetter">{spec.char}</span>
      </span>
    </button>
  );
}
