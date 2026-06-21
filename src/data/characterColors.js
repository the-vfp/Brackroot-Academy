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
