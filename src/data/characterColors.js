// Per-character colour triads (CSS custom-property refs) + per-location washes.
// Shared by the Journal cards and the heart-event VN overlay so they agree.
// Pale leads (Diana, Richard) carry an -ink so their type stays AA-readable on cream.

export const CHARACTER_COLORS = {
  marlow:  { base: 'var(--bk-marlow)',  soft: 'var(--bk-marlow-soft)',  ink: 'var(--bk-marlow-deep)' },
  brendan: { base: 'var(--bk-brendan)', soft: 'var(--bk-brendan-soft)', ink: 'var(--bk-brendan-deep)' },
  diana:   { base: 'var(--bk-diana)',   soft: 'var(--bk-diana-soft)',   ink: 'var(--bk-diana-ink)' },
  peter:   { base: 'var(--bk-peter)',   soft: 'var(--bk-peter-soft)',   ink: 'var(--bk-peter-deep)' },
  richard: { base: 'var(--bk-richard)', soft: 'var(--bk-richard-soft)', ink: 'var(--bk-richard-ink)' },
  sophia:  { base: 'var(--bk-sophia)',  soft: 'var(--bk-sophia-soft)',  ink: 'var(--bk-sophia-deep)' },
  // The Wind borrows Diana's moonlit periwinkle.
  wind:    { base: 'var(--bk-diana)',   soft: 'var(--bk-diana-soft)',   ink: 'var(--bk-diana-ink)' },
};

export function colorsFor(characterId) {
  return CHARACTER_COLORS[characterId] || CHARACTER_COLORS.marlow;
}

// Character.defaultLocation → the asset-free VN backdrop wash for that place.
export const LOCATION_WASH = {
  'Library':         'var(--bk-loc-library)',
  'Courtyard':       'var(--bk-loc-courtyard)',
  'Kitchens':        'var(--bk-loc-kitchens)',
  'Gardens':         'var(--bk-loc-gardens)',
  'SGC Office':      'var(--bk-loc-office)',
  'Dueling Grounds': 'var(--bk-loc-grounds)',
};

export function washFor(location) {
  return LOCATION_WASH[location] || 'var(--bk-loc-office)';
}

// ── Wax seals ──────────────────────────────────────────────────────────────
// Each relationship's seal = Ellene's symbol + the character's *relational*
// symbol (what they are to her). Brendan's is the north star, not his crown;
// the others currently default to their personal symbol.
export const ELLENE_SYMBOL = '\u{1F418}'; // 🐘 Elefante

export const SEAL_SYMBOL = {
  marlow:  '\u{1F5DD}️', // 🗝️ key — the Keeper
  brendan: '✦',          // ✦ north star — relational, not the crown
  diana:   '\u{1F319}',       // 🌙 crescent — Dreamstride
  peter:   '\u{1FA78}',       // 🩸 drop of blood
  richard: '\u{1FA9E}',       // 🪞 mirror — the mythmaker
  sophia:  '\u{1F56F}️', // 🕯️ candle
};

export function sealSymbolFor(characterId) {
  return SEAL_SYMBOL[characterId] || '✦';
}

// Seal-wax colour (brief, option b): Brendan's pairing = Ellene's indigo wax;
// every other pairing takes that character's own hue.
export function sealWaxFor(characterId) {
  if (characterId === 'brendan') return 'var(--bk-indigo)';
  return CHARACTER_COLORS[characterId]?.base || 'var(--bk-marlow)';
}
