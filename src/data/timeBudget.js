// Time Budget constants + seed defaults. Kept separate from categories.js
// because time categories have a different shape (cap/floor, targetHours,
// floorThreshold) and a different lifecycle (user-managed through Settings,
// no default spending category overlap).

export const WIND_RP_FLOOR = -10;
export const WIND_RP_HIT = 1;
export const WIND_RP_MISS = -2;

// Soft-floor on Wind RP gains: if fewer than this many categories are active
// in a week, the week's hits don't count toward RP. Losses still count.
// Prevents "set one easy budget, farm RP" meta.
export const MIN_ACTIVE_CATEGORIES_FOR_GAIN = 3;

// Minimum time entry increment. Users log in 30-min chunks.
export const HOUR_INCREMENT = 0.5;

// Spec's canonical examples — seeded on first install so the feature has
// something to look at. Fully editable through the Time Categories manager.
export const DEFAULT_TIME_CATEGORIES = [
  { name: 'Gaming',    icon: '\u{1F3AE}', kind: 'cap',   targetHours: 10, floorThreshold: null, sortOrder: 0 },
  { name: 'Scrolling', icon: '\u{1F4F1}', kind: 'cap',   targetHours: 5,  floorThreshold: null, sortOrder: 1 },
  { name: 'Sleep',     icon: '\u{1F319}', kind: 'floor', targetHours: 7,  floorThreshold: 5,    sortOrder: 2 },
];
