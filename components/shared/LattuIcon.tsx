// A traditional Indian lattu (wooden spinning top) — used as the picture for ल
// (लट्टू), since no emoji is a real lattu. Shared by the games.
export default function LattuIcon({ size = 78 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <defs>
        <clipPath id="lattuBodyShared">
          <path d="M50 18 C 28 20 20 36 22 50 C 24 66 38 80 50 87 C 62 80 76 66 78 50 C 80 36 72 20 50 18 Z" />
        </clipPath>
      </defs>
      <rect x="45" y="9" width="10" height="13" rx="4" fill="#7a4a22" />
      <g clipPath="url(#lattuBodyShared)">
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
