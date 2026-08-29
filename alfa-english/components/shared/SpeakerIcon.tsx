// ---------------------------------------------------------------------------
// SPEAKER ICON — a crisp little loudspeaker for every "Listen" button.
// Inherits the button's text colour via `currentColor`.
// ---------------------------------------------------------------------------

export default function SpeakerIcon({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", flex: "0 0 auto" }}
    >
      <path
        d="M4 9.2h3.2L12.2 5v14l-5-4.2H4a1 1 0 0 1-1-1V10.2a1 1 0 0 1 1-1Z"
        fill="currentColor"
      />
      <path d="M15.4 9.2a4 4 0 0 1 0 5.6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M17.8 6.8a7.4 7.4 0 0 1 0 10.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}
