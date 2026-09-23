/**
 * A decorative N/S/E/W compass rose. Purely presentational — knows nothing
 * about any game, the same way `Bar`/`Banner` are generic. Static for now
 * since nothing in this project rotates the camera; if that ever changes,
 * a `headingDeg` prop would rotate the needle/ticks without changing how
 * it's used.
 */
export function Compass({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Compass">
      <circle cx="32" cy="32" r="29" fill="rgba(15,12,10,0.55)" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <line
          key={deg}
          x1="32"
          y1="6"
          x2="32"
          y2={deg % 90 === 0 ? "12" : "10"}
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={deg % 90 === 0 ? 2 : 1}
          transform={`rotate(${deg} 32 32)`}
        />
      ))}
      {/* needle: red tip points N, grey tail points S */}
      <polygon points="32,10 27,32 32,28 37,32" fill="#ef4444" />
      <polygon points="32,54 27,32 32,36 37,32" fill="#d4cfc6" />
      <text x="32" y="21" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff8e7">
        N
      </text>
    </svg>
  );
}
