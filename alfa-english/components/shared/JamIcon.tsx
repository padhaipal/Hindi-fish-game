// A jar of jam — the ALfA picture for the letter j ("jam"). The strawberry
// emoji read as "strawberry", so this is a clear labelled jam jar instead.
export default function JamIcon({ size = 84 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {/* lid */}
      <rect x="30" y="14" width="40" height="12" rx="4" fill="#c0392b" />
      <rect x="27" y="24" width="46" height="8" rx="4" fill="#e74c3c" />
      {/* glass jar */}
      <rect x="26" y="30" width="48" height="56" rx="10" fill="#f4d9b0" stroke="#d9b48a" strokeWidth="2" />
      {/* jam inside */}
      <rect x="30" y="40" width="40" height="42" rx="7" fill="#c62f4b" />
      <rect x="30" y="40" width="40" height="10" rx="6" fill="#e0466a" />
      {/* white label with JAM */}
      <rect x="34" y="55" width="32" height="20" rx="3" fill="#fffdf5" />
      <text x="50" y="70" textAnchor="middle" fontSize="13" fontWeight="800" fill="#c62f4b" fontFamily="'Baloo 2','Comic Sans MS',sans-serif">
        JAM
      </text>
      {/* little shine */}
      <rect x="32" y="34" width="5" height="46" rx="3" fill="#ffffff55" />
    </svg>
  );
}
