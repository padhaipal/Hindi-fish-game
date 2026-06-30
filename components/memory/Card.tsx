"use client";

// ---------------------------------------------------------------------------
// CARD — one memory card. Face-down shows a "?" back; face-up shows either the
// picture (emoji / lattu) or the Devanagari letter. Flips with a 3D rotate.
// ---------------------------------------------------------------------------

import { getLetter } from "@/lib/letters";
import LattuIcon from "@/components/shared/LattuIcon";

export interface MemCard {
  id: number;
  letterId: string;
  kind: "picture" | "letter";
}

interface CardProps {
  card: MemCard;
  flipped: boolean; // face up (this turn)
  matched: boolean; // matched — fading away
  flash: "green" | "red" | null;
  w: number;
  h: number;
  onTap: (id: number) => void;
}

export default function Card({ card, flipped, matched, flash, w, h, onTap }: CardProps) {
  const up = flipped || matched;
  const cls = [
    "memCard",
    matched ? "matched" : "",
    flash ? `flash-${flash}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={cls}
      style={{ width: w, height: h }}
      aria-label={card.kind === "letter" ? `letter ${getLetter(card.letterId).char}` : "picture card"}
      onPointerDown={(e) => {
        e.preventDefault();
        onTap(card.id);
      }}
    >
      <span className={`memInner ${up ? "up" : ""}`}>
        <span className="memFace memBack">?</span>
        <span className="memFace memFront">
          {card.kind === "letter" ? (
            <span className="memChar">{getLetter(card.letterId).char}</span>
          ) : card.letterId === "la" ? (
            <LattuIcon size={Math.round(w * 0.66)} />
          ) : (
            <span className="memPic">{getLetter(card.letterId).emoji}</span>
          )}
        </span>
      </span>
    </button>
  );
}
