// The pressed-flower relationship meter. Petals fill as heart events are
// collected; uncollected petals sit faint behind them. Gold center is constant.
export default function Flower({ color = 'var(--bk-marlow)', total = 10, filled = 4, size = 80 }) {
  const R = 7, C = 16;
  const t = Math.max(1, total);
  const f = Math.min(t, Math.max(0, filled));
  const petals = [];
  for (let i = 0; i < t; i++) {
    const th = (i * 2 * Math.PI) / t;
    const cx = Math.round(C + R * Math.sin(th));
    const cy = Math.round(C - R * Math.cos(th));
    petals.push({ x1: cx - 2, y1: cy - 3, x2: cx - 3, y2: cy - 2, x3: cx - 2, y3: cy + 2, op: i < f ? 1 : 0.22 });
  }
  petals.sort((a, b) => a.op - b.op); // faint ghosts first, earned petals on top
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ display: 'block', shapeRendering: 'crispEdges' }}>
      {petals.map((p, i) => (
        <g key={i} fill={color} opacity={p.op}>
          <rect x={p.x1} y={p.y1} width="4" height="1" />
          <rect x={p.x2} y={p.y2} width="6" height="4" />
          <rect x={p.x3} y={p.y3} width="4" height="1" />
        </g>
      ))}
      <g fill="var(--bk-stardust-deep)">
        <rect x="14" y="12" width="4" height="1" />
        <rect x="13" y="13" width="6" height="1" />
        <rect x="12" y="14" width="8" height="4" />
        <rect x="13" y="18" width="6" height="1" />
        <rect x="14" y="19" width="4" height="1" />
      </g>
      <rect x="13" y="14" width="6" height="4" fill="var(--bk-stardust)" />
      <rect x="14" y="15" width="2" height="2" fill="var(--bk-stardust-shimmer)" />
    </svg>
  );
}
