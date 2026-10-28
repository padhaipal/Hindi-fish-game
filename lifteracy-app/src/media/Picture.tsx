// Hand-drawn SVG pictures for the picture step: crisp at any size, nothing to
// download. Add a letter's picture here and point LETTER_MEDIA at its key; a
// photo file in public/media/images would work just as well.
import type { ReactElement } from "react";

function Batakh() {
  // a yellow duckling on water
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="बतख">
      <ellipse cx="100" cy="172" rx="84" ry="12" fill="#8fd3f4" />
      <ellipse cx="96" cy="128" rx="62" ry="40" fill="#ffd23f" stroke="#e0a800" strokeWidth="4" />
      <path d="M50 118 Q30 96 46 92 Q56 104 68 108 Z" fill="#ffd23f" stroke="#e0a800" strokeWidth="4" strokeLinejoin="round" />
      <path d="M80 122 Q100 108 124 124 Q104 140 80 122 Z" fill="#f5b700" stroke="#e0a800" strokeWidth="3" />
      <circle cx="132" cy="72" r="34" fill="#ffd23f" stroke="#e0a800" strokeWidth="4" />
      <circle cx="142" cy="64" r="6" fill="#2b2b2b" />
      <circle cx="144" cy="62" r="2" fill="#fff" />
      <path d="M160 76 Q188 74 190 84 Q176 94 158 88 Z" fill="#ff8c1a" stroke="#d96b00" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="128" cy="84" r="6" fill="#ffb3a7" opacity="0.7" />
    </svg>
  );
}

function Anaar() {
  // a pomegranate with a split showing its seeds
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="अनार">
      <path d="M86 40 L80 22 L92 30 L100 16 L108 30 L120 22 L114 40 Z" fill="#c2185b" stroke="#880e4f" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="100" cy="112" r="72" fill="#e53950" stroke="#9e1b32" strokeWidth="5" />
      <ellipse cx="72" cy="86" rx="16" ry="10" fill="#fff" opacity="0.35" transform="rotate(-30 72 86)" />
      <path d="M112 100 Q150 104 158 140 Q130 170 108 150 Q96 124 112 100 Z" fill="#fde2e4" stroke="#9e1b32" strokeWidth="4" />
      {[
        [124, 116], [138, 122], [146, 136], [120, 132], [134, 140], [118, 146], [130, 154], [144, 150],
      ].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx="6" ry="7" fill="#c2185b" stroke="#880e4f" strokeWidth="1.5" />
      ))}
      <path d="M100 52 Q96 44 100 40" stroke="#880e4f" strokeWidth="4" fill="none" />
    </svg>
  );
}

const PICTURES: Record<string, () => ReactElement> = {
  batakh: Batakh,
  anaar: Anaar,
};

export function Picture({ name }: { name: string }) {
  const Draw = PICTURES[name];
  return Draw ? <Draw /> : <div className="picture-missing">?</div>;
}
