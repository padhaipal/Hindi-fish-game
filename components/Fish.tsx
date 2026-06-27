"use client";

// ---------------------------------------------------------------------------
// FISH — one swimming fish carrying a single Hindi letter.
// ---------------------------------------------------------------------------
// Structure (important for the animation):
//   button.fish            -> POSITION only (translate), set by PondGame each frame
//     span.fishInner       -> target of shake / splash animations
//       span.fishGraphic   -> the fish BODY; SWIVELS to face its travel direction
//       span.fishLetter    -> the letter; always stays UPRIGHT and centred
//
// The body graphic points to the RIGHT by default. PondGame rotates it to match
// the swim direction (and mirrors it when swimming left so it never goes
// belly-up). The letter is a separate element, so it never rotates.
//
// Movement is driven by the parent via direct DOM refs for smooth, low-cost
// animation. Big, finger-friendly tap target.
// ---------------------------------------------------------------------------

import { FishSpec } from "@/lib/round";

interface FishProps {
  spec: FishSpec;
  // Register the root button (moved every frame) and the graphic (swivelled).
  registerRoot: (id: number, el: HTMLButtonElement | null) => void;
  registerGraphic: (id: number, el: HTMLSpanElement | null) => void;
  onTap: (spec: FishSpec, el: HTMLButtonElement) => void;
}

export default function Fish({
  spec,
  registerRoot,
  registerGraphic,
  onTap,
}: FishProps) {
  // Colour is chosen randomly per fish (see lib/round.ts) so it never hints
  // at which letter the fish carries.
  const color = spec.color;
  return (
    <button
      type="button"
      className="fish"
      aria-label={`fish letter ${spec.char}`}
      ref={(el) => registerRoot(spec.id, el)}
      onPointerDown={(e) => {
        e.preventDefault();
        onTap(spec, e.currentTarget);
      }}
    >
      <span className="fishInner">
        <span
          className="fishGraphic"
          ref={(el) => registerGraphic(spec.id, el)}
          style={{ ["--fish-color" as string]: color }}
        >
          <span className="fTail" />
          <span className="fFin" />
          <span className="fBody" />
          <span className="fEye" />
        </span>
        <span className="fishLetter">{spec.char}</span>
      </span>
    </button>
  );
}
