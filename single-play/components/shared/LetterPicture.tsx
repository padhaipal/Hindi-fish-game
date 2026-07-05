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
    case "fruits":
      return <FruitsIcon size={size} />;
    case "gamla":
      return <GamlaIcon size={size} />;
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
  // A traditional Indian steel vacuum flask ("Eagle"/Milton style): a stainless
  // body with a coloured band, a domed steel cup screwed on top, and a carry loop.
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {/* steel body */}
      <rect x="33" y="30" width="34" height="58" rx="9" fill="#c9ced6" />
      <rect x="37" y="32" width="8" height="54" rx="4" fill="#eef1f5" opacity="0.85" />
      {/* maroon decorative band */}
      <rect x="33" y="53" width="34" height="16" fill="#7d1f2b" />
      <rect x="33" y="55" width="34" height="2.5" fill="#a8384a" />
      <rect x="33" y="63" width="34" height="2.5" fill="#5c1420" />
      {/* neck ring */}
      <rect x="35" y="27" width="30" height="6" rx="3" fill="#9aa1ac" />
      {/* domed steel cup lid */}
      <path d="M37 28 Q37 14 50 12 Q63 14 63 28 Z" fill="#b7bdc7" />
      <path d="M42 18 Q45 15 50 15" stroke="#eef1f5" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* carry loop */}
      <path d="M45 12 Q50 4 55 12" stroke="#8a919c" strokeWidth="3" fill="none" />
    </svg>
  );
}

// फ / फल — a little cluster of different fruits (apple, banana, orange, grapes).
export function FruitsIcon({ size = 78 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {/* banana behind */}
      <path d="M14 56 Q30 80 68 70 Q54 78 34 76 Q20 72 14 56 Z" fill="#f4c430" />
      <path d="M14 56 Q30 80 68 70" stroke="#d9a400" strokeWidth="1.5" fill="none" />
      {/* grapes top-right */}
      <g fill="#8e44ad">
        <circle cx="60" cy="22" r="4" /><circle cx="68" cy="22" r="4" />
        <circle cx="56" cy="29" r="4" /><circle cx="64" cy="29" r="4" /><circle cx="72" cy="29" r="4" />
        <circle cx="60" cy="36" r="4" /><circle cx="68" cy="36" r="4" />
      </g>
      {/* orange */}
      <circle cx="68" cy="52" r="13" fill="#ff9f1c" />
      <circle cx="68" cy="41" r="2" fill="#3aa03a" />
      {/* apple front */}
      <circle cx="39" cy="53" r="17" fill="#e0402e" />
      <ellipse cx="33" cy="47" rx="4" ry="6" fill="#ff8a72" opacity="0.6" />
      <path d="M39 37 Q42 31 47 31" stroke="#7a4a22" strokeWidth="3" fill="none" />
      <path d="M46 30 Q54 28 54 36 Q46 38 46 30 Z" fill="#3aa03a" />
    </svg>
  );
}

// ग / गमला — a potted plant with a red arrow pointing at the POT (not the plant).
export function GamlaIcon({ size = 78 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {/* plant */}
      <path d="M50 46 Q40 26 32 32 Q40 36 44 48 Z" fill="#3aa03a" />
      <path d="M50 46 Q60 24 68 32 Q60 36 56 48 Z" fill="#46b846" />
      <path d="M50 48 L50 30" stroke="#3aa03a" strokeWidth="3" fill="none" />
      {/* terracotta pot */}
      <rect x="31" y="49" width="38" height="7" rx="2" fill="#d97b4a" />
      <path d="M34 56 L66 56 L61 80 L39 80 Z" fill="#c86b3c" />
      <path d="M34 56 L66 56 L61 80 L39 80 Z" fill="none" stroke="#a9531f" strokeWidth="1" />
      {/* red arrow pointing at the pot */}
      <path d="M93 68 L72 66" stroke="#e23b3b" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M72 66 L82 61 L81 72 Z" fill="#e23b3b" />
    </svg>
  );
}

// हल — a traditional Indian ox-drawn wooden plough (a humped zebu bull + हल).
export function PloughIcon({ size = 78 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {/* ground */}
      <line x1="4" y1="82" x2="96" y2="82" stroke="#b98a4a" strokeWidth="2" />
      {/* zebu bull, facing left */}
      <ellipse cx="32" cy="55" rx="19" ry="11" fill="#a5855f" />
      <path d="M21 47 Q30 30 41 45 Q32 43 21 47 Z" fill="#8a6b4a" /> {/* hump */}
      <path d="M14 51 Q6 49 8 59 L19 61 Q21 55 19 50 Z" fill="#8a6b4a" /> {/* head */}
      <path d="M11 59 Q9 67 16 64 Z" fill="#8a6b4a" /> {/* dewlap */}
      <path d="M9 49 Q2 41 8 38" stroke="#4a3826" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M13 48 Q9 39 15 38" stroke="#4a3826" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M18 50 Q15 46 13 50 Z" fill="#6d4f34" /> {/* ear */}
      <circle cx="12" cy="54" r="1.5" fill="#2c2016" />
      <rect x="19" y="64" width="4" height="17" fill="#7a5c3e" />
      <rect x="27" y="64" width="4" height="17" fill="#8a6b4a" />
      <rect x="38" y="64" width="4" height="17" fill="#6d4f34" />
      <rect x="44" y="64" width="4" height="17" fill="#7a5c3e" />
      <path d="M51 51 q7 6 3 20" stroke="#7a5c3e" strokeWidth="2" fill="none" /> {/* tail */}
      {/* wooden yoke on the neck */}
      <rect x="15" y="44" width="22" height="3.6" rx="1.6" fill="#6b4522" transform="rotate(6 26 46)" />
      {/* beam back to the plough */}
      <line x1="41" y1="53" x2="82" y2="72" stroke="#7a4a22" strokeWidth="4" strokeLinecap="round" />
      {/* plough handle + share */}
      <line x1="82" y1="72" x2="90" y2="51" stroke="#6b4522" strokeWidth="4" strokeLinecap="round" />
      <path d="M82 71 L93 82 L86 84 L76 76 Z" fill="#5b4630" />
    </svg>
  );
}

// मटर — an open pea pod showing the peas.
export function PeasIcon({ size = 78 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {/* pod, opened */}
      <path d="M18 62 Q30 34 60 28 Q84 24 89 37 Q84 45 70 47 Q48 51 34 65 Q24 69 18 62 Z" fill="#4f9e28" />
      <path d="M25 59 Q35 40 60 34 Q79 31 85 38" stroke="#8ed14f" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* peas in the pod */}
      <circle cx="40" cy="53" r="7" fill="#9ad84f" stroke="#4f9e28" strokeWidth="1.2" />
      <circle cx="53" cy="47" r="7" fill="#9ad84f" stroke="#4f9e28" strokeWidth="1.2" />
      <circle cx="66" cy="42" r="7" fill="#9ad84f" stroke="#4f9e28" strokeWidth="1.2" />
      <circle cx="38" cy="51" r="1.8" fill="#eaffcf" />
      <circle cx="51" cy="45" r="1.8" fill="#eaffcf" />
      <circle cx="64" cy="40" r="1.8" fill="#eaffcf" />
      <path d="M89 37 q6 -2 6 -9" stroke="#4f9e28" strokeWidth="2" fill="none" />
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
