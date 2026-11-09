// An अनार (pomegranate) — the picture for अ. There is no pomegranate emoji and
// 🍎 reads as an apple, so we draw one: a whole fruit with its tall, spiky
// crown, plus a cut-open half packed with shiny red seeds (the giveaway that
// it's an anaar, not a seb). Shared by the games.

// Seeds inside the cut half (centres), packed in rows.
const SEEDS: [number, number][] = [
  [62, 58], [69, 56], [76, 58], [83, 61],
  [58, 65], [65, 64], [72, 64], [79, 66], [86, 68],
  [60, 72], [67, 71], [74, 72], [81, 74],
  [64, 79], [71, 79], [78, 80],
];

export default function AnaarIcon({ size = 78 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {/* ---- whole fruit (back) ---- */}
      {/* crown: short neck + flared spiky sepals */}
      <path d="M33 22 L37 30 L47 30 L51 22 Z" fill="#8e1d26" />
      <path d="M30 14 L35 25 L38 16 L42 26 L46 16 L49 25 L54 14 L50 29 L34 29 Z" fill="#a8232d" />
      <circle cx="42" cy="54" r="28" fill="#c8303a" />
      {/* slightly angular, ridged sides */}
      <path d="M42 26 C 30 34 26 50 28 66" stroke="#a51f2a" strokeWidth="2" fill="none" opacity="0.6" />
      <path d="M42 26 C 54 34 58 46 58 56" stroke="#a51f2a" strokeWidth="2" fill="none" opacity="0.6" />
      {/* shine */}
      <ellipse cx="30" cy="44" rx="5" ry="9" fill="#fff" opacity="0.28" transform="rotate(20 30 44)" />

      {/* ---- cut half (front) ---- */}
      <ellipse cx="72" cy="68" rx="24" ry="20" fill="#b3232e" />
      <ellipse cx="72" cy="68" rx="20.5" ry="16.5" fill="#f5e0cf" />
      {/* pale membranes between seed pockets */}
      <path d="M72 52 L72 84 M53 68 L91 68" stroke="#ead0bb" strokeWidth="2" />
      {SEEDS.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3.4" fill="#d81e3a" />
          <circle cx={x - 1} cy={y - 1.2} r="1" fill="#fff" opacity="0.75" />
        </g>
      ))}
    </svg>
  );
}
