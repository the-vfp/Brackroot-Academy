// A character's identity tile — colour + monogram + small symbol. No art needed.
// `veiled` renders the not-yet-met silhouette behind the Wind. Token-driven so
// it follows the day/dusk/night palette.
export default function CharacterCrest({ letter = 'M', color = 'var(--bk-marlow)', symbol = '', size = 56, veiled = false, style }) {
  if (veiled) {
    return (
      <div
        className="bk-pixel"
        style={{
          width: size, height: size, position: 'relative', flexShrink: 0,
          background: 'var(--bk-paper-deep)',
          boxShadow: 'inset 0 0 0 2px var(--bk-border), 0 0 0 2px var(--bk-ink-strong)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden',
          ...style,
        }}
      >
        <div style={{ width: size * 0.55, height: size * 0.62, background: 'var(--bk-border)', clipPath: 'polygon(50% 0,72% 16%,72% 40%,100% 100%,0 100%,28% 40%,28% 16%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,transparent 0 6px,rgba(91,70,54,.07) 6px 12px)' }} />
        <div style={{ position: 'absolute', top: 6, left: 0, right: 0, textAlign: 'center', fontFamily: 'var(--bk-font-body)', fontSize: size * 0.42, color: 'var(--bk-ink-soft)' }}>?</div>
      </div>
    );
  }
  return (
    <div
      className="bk-pixel"
      style={{
        width: size, height: size, position: 'relative', flexShrink: 0,
        background: color,
        boxShadow: 'inset 3px 3px 0 rgba(255,255,255,.22), inset -3px -3px 0 rgba(0,0,0,.28), 0 0 0 3px var(--bk-ink-strong), 4px 4px 0 2px var(--bk-shadow)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--bk-font-body)', fontWeight: 700, fontSize: size * 0.5,
        color: 'var(--bk-surface-edge)',
        ...style,
      }}
    >
      {letter}
      {symbol ? <span style={{ position: 'absolute', bottom: 2, right: 4, fontSize: Math.round(size * 0.24) }}>{symbol}</span> : null}
    </div>
  );
}
