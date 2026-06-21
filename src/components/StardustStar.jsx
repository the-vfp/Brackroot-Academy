// The pixel Stardust star — a 9px diamond. The single recurring gold glyph.
export default function StardustStar({ size = 16, fill = 'var(--bk-stardust)', shimmer = false }) {
  return (
    <span className="star-sprite" aria-hidden="true">
      <svg
        viewBox="0 0 9 9" width={size} height={size}
        style={{ fill, animation: shimmer ? 'bkShimmer 1.6s ease-in-out infinite' : undefined }}
      >
        <rect x="4" y="0" width="1" height="9" />
        <rect x="0" y="4" width="9" height="1" />
        <rect x="3" y="1" width="3" height="7" />
        <rect x="1" y="3" width="7" height="3" />
      </svg>
    </span>
  );
}
