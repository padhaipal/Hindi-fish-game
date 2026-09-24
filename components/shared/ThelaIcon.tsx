// A traditional Indian हाथ-ठेला (wooden hand-cart / barrow) — used as the
// picture for ठ (ठेला), since the only cart emoji is a Western shopping trolley.
// A flat wooden tray on two big wheels, piled with fruit, with a push handle.
export default function ThelaIcon({ size = 78 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {/* goods piled on the tray */}
      <circle cx="34" cy="45" r="9" fill="#e8563f" />
      <circle cx="50" cy="43" r="10" fill="#f2a93b" />
      <circle cx="65" cy="46" r="8.5" fill="#8bc34a" />
      <circle cx="43" cy="48" r="7.5" fill="#f6c945" />
      {/* wooden tray / platform */}
      <rect x="18" y="54" width="60" height="9" rx="2" fill="#b0742f" />
      <rect x="18" y="54" width="60" height="3" rx="1.5" fill="#c98a45" />
      {/* legs + the long push handle going up to the right */}
      <rect x="24" y="63" width="5" height="14" rx="2" fill="#8a5a24" />
      <rect x="67" y="63" width="5" height="14" rx="2" fill="#8a5a24" />
      <rect
        x="74"
        y="34"
        width="5"
        height="30"
        rx="2.5"
        fill="#8a5a24"
        transform="rotate(20 76 49)"
      />
      {/* two large cart wheels */}
      <g>
        <circle cx="35" cy="80" r="12" fill="#3a3f45" />
        <circle cx="35" cy="80" r="4.5" fill="#c7ccd1" />
        <circle cx="66" cy="80" r="12" fill="#3a3f45" />
        <circle cx="66" cy="80" r="4.5" fill="#c7ccd1" />
      </g>
    </svg>
  );
}
