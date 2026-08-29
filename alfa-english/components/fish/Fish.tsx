"use client";

// ---------------------------------------------------------------------------
// FISH — one swimming fish carrying a single lowercase letter.
// ---------------------------------------------------------------------------
// Structure (important for the animation):
//   button.fish            -> POSITION only (translate), set by FishGame per frame
//     span.fishInner       -> target of shake / splash animations
//       span.fishGraphic   -> the fish BODY; SWIVELS to face its travel direction
//       span.fishLetter    -> the letter; always stays UPRIGHT and centred
//
// The body points RIGHT by default; FishGame rotates it to match the swim
// direction (mirroring when swimming left so it never goes belly-up). The letter
// is a separate element, so it never rotates.
//
// Movement is driven by the parent via direct DOM refs, so we never re-render on
// every frame — important for smoothness on low-end phones.
// ---------------------------------------------------------------------------

import { FishSpec } from "@/lib/fish/round";

interface FishProps {
  spec: FishSpec;
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
          style={{ ["--fish-color" as string]: spec.color }}
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
