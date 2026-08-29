"use client";

// ---------------------------------------------------------------------------
// CARD — one memory card. Face-down shows a "?" back; face-up shows either the
// PICTURE (the letter's ALfA emoji) or the lowercase LETTER (blue if a vowel,
// red if a consonant). Flips with a 3D rotate (see .memInner in globals.css).
// ---------------------------------------------------------------------------

import { getLetter } from "@/lib/letters";
import LetterPicture from "@/components/shared/LetterPicture";

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

// ALfA convention: vowels are blue, consonants are red.
const VOWEL_COLOR = "#2f80ed";
const CONSONANT_COLOR = "#e5484d";

export default function Card({ card, flipped, matched, flash, w, h, onTap }: CardProps) {
  const letter = getLetter(card.letterId);
  const up = flipped || matched;
  const cls = ["memCard", matched ? "matched" : "", flash ? `flash-${flash}` : ""]
    .filter(Boolean)
    .join(" ");

  // Keep the blue/red letter colour only while it is a plain face-up card; let
  // the CSS turn the text white during the green/red flash and the matched fade.
  const charColor = flash || matched ? undefined : letter.vowel ? VOWEL_COLOR : CONSONANT_COLOR;

  return (
    <button
      type="button"
      className={cls}
      style={{ width: w, height: h }}
      aria-label={card.kind === "letter" ? `letter ${letter.char}` : `picture ${letter.word}`}
      onPointerDown={(e) => {
        e.preventDefault();
        onTap(card.id);
      }}
    >
      <span className={`memInner ${up ? "up" : ""}`}>
        <span className="memFace memBack">?</span>
        <span className="memFace memFront">
          {card.kind === "letter" ? (
            <span className="memChar" style={charColor ? { color: charColor } : undefined}>
              {letter.char}
            </span>
          ) : (
            <LetterPicture letter={letter} size={Math.round(w * 0.66)} className="memPic" />
          )}
        </span>
      </span>
    </button>
  );
}
