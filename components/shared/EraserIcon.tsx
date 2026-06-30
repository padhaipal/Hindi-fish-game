// A realistic Indian eraser (the classic white "Nataraj/Apsara"-style rubber
// with a blue paper sleeve and a red stripe) — used as the picture for रबर,
// since no emoji is a real eraser. Drawn as an SVG so it stays crisp.
export default function EraserIcon({ size = 96 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <g transform="rotate(-14 50 50)">
        {/* soft ground shadow */}
        <ellipse cx="50" cy="74" rx="36" ry="6" fill="#00000018" />
        {/* the eraser's thickness (side), drawn behind the top face) */}
        <rect x="14" y="41" width="72" height="28" rx="8" fill="#cdbf9f" />
        {/* top face — off-white rubber */}
        <rect x="14" y="33" width="72" height="30" rx="8" fill="#f6f2e6" />
        {/* a gentle highlight along the top edge */}
        <rect x="18" y="35" width="64" height="9" rx="5" fill="#fffdf7" opacity="0.75" />
        {/* paper sleeve wrapping the middle */}
        <rect x="37" y="31" width="26" height="40" rx="2" fill="#1f50a8" />
        <rect x="37" y="44" width="26" height="6" fill="#e23b3b" />
        <rect x="37" y="52" width="26" height="2.4" fill="#ffffffcc" />
        <rect x="37" y="38" width="26" height="2.4" fill="#ffffff66" />
      </g>
    </svg>
  );
}
