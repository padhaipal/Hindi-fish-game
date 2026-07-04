// ---------------------------------------------------------------------------
// LETTER PICTURE — one place that turns a letter into its picture.
// ---------------------------------------------------------------------------
// Most letters use an emoji (letter.emoji). A few have no good emoji and are
// drawn as small inline SVGs (letter.icon): the lattu, handcart, damroo, rope,
// thermos and anaar. Every game renders letter pictures through this component
// so the custom art appears everywhere consistently.
// ---------------------------------------------------------------------------
import { Letter } from "@/lib/letters";

export default function LetterPicture({
  letter,
  size = 78,
  className,
  style,
}: {
  letter: Letter;
  size?: number;
  className?: string; // used when we fall back to the emoji <span>
  style?: React.CSSProperties;
}) {
  switch (letter.icon) {
    case "lattu":
      return <LattuIcon size={size} />;
    case "handcart":
      return <HandcartIcon size={size} />;
    case "damroo":
      return <DamrooIcon size={size} />;
    case "rope":
      return <RopeIcon size={size} />;
    case "thermos":
      return <ThermosIcon size={size} />;
    case "anaar":
      return <AnaarIcon size={size} />;
    case "jalebi":
      return <JalebiIcon size={size} />;
    default:
      return (
        <span className={className} style={style}>
          {letter.emoji}
        </span>
      );
  }
}

// ल — traditional wooden spinning top.
export function LattuIcon({ size = 78 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <defs>
        <clipPath id="lp_lattu">
          <path d="M50 18 C 28 20 20 36 22 50 C 24 66 38 80 50 87 C 62 80 76 66 78 50 C 80 36 72 20 50 18 Z" />
        </clipPath>
      </defs>
      <rect x="45" y="9" width="10" height="13" rx="4" fill="#7a4a22" />
      <g clipPath="url(#lp_lattu)">
        <rect x="0" y="0" width="100" height="100" fill="#d2772b" />
        <rect x="0" y="30" width="100" height="8" fill="#f2b134" />
        <rect x="0" y="42" width="100" height="6" fill="#7a1f1f" />
        <rect x="0" y="56" width="100" height="24" fill="#f3ead7" />
      </g>
      <path d="M44 76 L50 96 L56 76 Z" fill="#9aa0a6" />
      <path d="M47 82 L50 96 L53 82 Z" fill="#6b7075" />
    </svg>
  );
}

// ठ — ठेला: a wooden handcart / thela (flat cart on two wheels).
export function HandcartIcon({ size = 78 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {/* cart bed + side rail */}
      <rect x="14" y="46" width="66" height="10" rx="2" fill="#b5793c" />
      <rect x="14" y="40" width="66" height="6" rx="2" fill="#8a5a2b" />
      {/* a couple of goods on top */}
      <circle cx="30" cy="35" r="7" fill="#e6432f" />
      <circle cx="44" cy="35" r="7" fill="#f2b134" />
      <circle cx="58" cy="35" r="7" fill="#4caf50" />
      {/* long handle */}
      <rect x="78" y="44" width="16" height="4" rx="2" fill="#8a5a2b" transform="rotate(-12 78 46)" />
      {/* legs + wheels */}
      <rect x="24" y="56" width="4" height="16" fill="#6b4522" />
      <rect x="64" y="56" width="4" height="16" fill="#6b4522" />
      <circle cx="30" cy="76" r="9" fill="#4a4a4a" />
      <circle cx="30" cy="76" r="3.4" fill="#cfcfcf" />
      <circle cx="64" cy="76" r="9" fill="#4a4a4a" />
      <circle cx="64" cy="76" r="3.4" fill="#cfcfcf" />
    </svg>
  );
}

// ड — डमरू: the small hand drum, wide at both ends and pinched in the middle,
// with two knotted beater cords.
export function DamrooIcon({ size = 78 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {/* body — two cones meeting at a waist */}
      <path d="M28 24 Q50 44 72 24 L72 26 Q54 46 72 74 L72 76 Q50 56 28 76 L28 74 Q46 46 28 26 Z" fill="#c8873f" />
      {/* drum skins (ends) */}
      <ellipse cx="50" cy="24" rx="23" ry="6" fill="#f3ead7" stroke="#a9702f" strokeWidth="2" />
      <ellipse cx="50" cy="76" rx="23" ry="6" fill="#f3ead7" stroke="#a9702f" strokeWidth="2" />
      {/* waist binding */}
      <rect x="43" y="46" width="14" height="8" rx="3" fill="#7a1f1f" />
      {/* two cords + knotted beads */}
      <path d="M50 50 C 70 48 78 40 84 46" stroke="#7a1f1f" strokeWidth="2.5" fill="none" />
      <path d="M50 50 C 70 52 78 60 84 54" stroke="#7a1f1f" strokeWidth="2.5" fill="none" />
      <circle cx="85" cy="46" r="3.2" fill="#e6432f" />
      <circle cx="85" cy="54" r="3.2" fill="#e6432f" />
    </svg>
  );
}

// र — रस्सी: a coil of rope.
export function RopeIcon({ size = 78 }: { size?: number }) {
  const strand = { fill: "none", stroke: "#c9a24a", strokeWidth: 7, strokeLinecap: "round" as const };
  const strand2 = { fill: "none", stroke: "#a9812f", strokeWidth: 2, strokeLinecap: "round" as const, strokeDasharray: "3 4" };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {/* three concentric coils */}
      <ellipse cx="50" cy="52" rx="34" ry="24" {...strand} />
      <ellipse cx="50" cy="52" rx="34" ry="24" {...strand2} />
      <ellipse cx="50" cy="52" rx="23" ry="15.5" {...strand} />
      <ellipse cx="50" cy="52" rx="23" ry="15.5" {...strand2} />
      <ellipse cx="50" cy="52" rx="12" ry="7.5" {...strand} />
      {/* a loose end hanging off */}
      <path d="M80 44 C 90 40 92 60 86 70" {...strand} />
    </svg>
  );
}

// थ — थर्मस: a vacuum flask with a cup lid.
export function ThermosIcon({ size = 78 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {/* body */}
      <rect x="34" y="26" width="32" height="60" rx="9" fill="#2e8b9e" />
      <rect x="34" y="26" width="10" height="60" rx="5" fill="#57b3c4" opacity="0.7" />
      {/* cup lid */}
      <rect x="32" y="14" width="36" height="16" rx="5" fill="#e0552f" />
      <rect x="35" y="11" width="30" height="6" rx="3" fill="#b83f20" />
      {/* label band */}
      <rect x="34" y="52" width="32" height="14" fill="#f3ead7" />
      <rect x="34" y="56" width="32" height="3" fill="#e0552f" />
    </svg>
  );
}

// ज — जलेबी: the coiled orange sweet, drawn as interlocking glossy loops.
export function JalebiIcon({ size = 78 }: { size?: number }) {
  const coil = { fill: "none", stroke: "#ef8a17", strokeWidth: 9, strokeLinecap: "round" as const };
  const gloss = { fill: "none", stroke: "#ffc04d", strokeWidth: 3, strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {/* outer scalloped ring */}
      <path
        d="M50 20 C 70 20 82 34 80 52 C 78 70 64 82 48 80 C 32 78 20 66 22 50 C 24 36 34 28 46 30 C 58 32 66 42 64 54 C 62 64 52 70 44 66"
        {...coil}
      />
      {/* inner loop */}
      <path d="M44 66 C 38 62 38 52 46 48 C 54 44 60 50 58 56" {...coil} />
      {/* highlight */}
      <path
        d="M50 24 C 67 24 78 36 76 51 C 74 66 62 76 49 74"
        {...gloss}
      />
    </svg>
  );
}

// अ — अनार: a pomegranate with its little crown, cut to show seeds.
export function AnaarIcon({ size = 78 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {/* fruit body */}
      <circle cx="50" cy="56" r="30" fill="#c62f36" />
      <path d="M50 26 C 34 30 30 44 32 54 C 36 44 44 38 50 38 C 56 38 64 44 68 54 C 70 44 66 30 50 26 Z" fill="#a51f2a" opacity="0.5" />
      {/* crown */}
      <path d="M50 26 L44 14 L50 20 L56 14 Z" fill="#7d1f24" />
      {/* opened patch of seeds */}
      <clipPath id="lp_anaarCut"><circle cx="58" cy="60" r="15" /></clipPath>
      <g clipPath="url(#lp_anaarCut)">
        <rect x="40" y="44" width="34" height="34" fill="#f2d6cf" />
        <circle cx="52" cy="54" r="3" fill="#e23b3b" />
        <circle cx="60" cy="52" r="3" fill="#e23b3b" />
        <circle cx="66" cy="58" r="3" fill="#e23b3b" />
        <circle cx="54" cy="62" r="3" fill="#e23b3b" />
        <circle cx="62" cy="64" r="3" fill="#e23b3b" />
        <circle cx="58" cy="70" r="3" fill="#e23b3b" />
        <circle cx="68" cy="68" r="3" fill="#e23b3b" />
      </g>
    </svg>
  );
}
