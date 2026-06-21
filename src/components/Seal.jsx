import { sealWaxFor, sealSymbolFor, ELLENE_SYMBOL } from '../data/characterColors.js';

// The per-relationship wax seal: Ellene's symbol + the character's, pressed into
// wax in the pairing's relational colour. `sealed` = earned (the flower is at
// full bloom / the relationship is capstoned); otherwise a faint impression.
export default function Seal({ characterId, sealed = false, size = 60 }) {
  const wax = sealWaxFor(characterId);
  const symbol = sealSymbolFor(characterId);
  return (
    <div
      className={'wax-seal bk-pixel ' + (sealed ? 'wax-seal--sealed' : 'wax-seal--unsealed')}
      style={{ width: size, height: size, '--wax': wax }}
      role="img"
      aria-label={sealed ? 'Your seal, sealed' : 'Your seal, not yet sealed'}
    >
      <span className="wax-seal-glyphs" style={{ fontSize: Math.round(size * 0.32) }}>
        <span className="wax-seal-glyph">{ELLENE_SYMBOL}</span>
        <span className="wax-seal-glyph">{symbol}</span>
      </span>
    </div>
  );
}
