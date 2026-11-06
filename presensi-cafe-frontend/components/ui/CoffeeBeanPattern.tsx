/**
 * Tekstur sprig daun berulang, sangat samar, dipakai sebagai lapisan
 * dekoratif nuansa cafe & resto (bukan literal kopi) di atas background polos.
 */
export default function CoffeeBeanPattern({ className = "", opacity = 0.05 }: { className?: string; opacity?: number }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="botanical-sprig" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
          <path
            d="M14 60c0-18 8-32 8-32M22 28c-6-2-11-8-11-8M22 28c2-6 1-13 1-13M22 28c6 0 12-4 12-4M22 28c-2 6-2 13 4 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="58" cy="52" r="3" fill="currentColor" />
          <circle cx="66" cy="44" r="2" fill="currentColor" />
          <circle cx="50" cy="42" r="2" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#botanical-sprig)" />
    </svg>
  );
}
