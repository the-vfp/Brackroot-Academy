// Heart event registry: characterId → { level (1..10): string | { text, background } | null }
//
// Per-level value shapes:
//   null                       — to-be-written; UI shows a visible placeholder.
//   "multi-paragraph string"   — text only; no background art.
//   { text, background }       — text + a background key. `background` is a filename
//                                (without extension) under /public/art/backgrounds/.
//                                If the file is missing, the scene falls back to a
//                                cozy gradient.
//
// Ellene writes mostly plain strings; she can upgrade individual events to the
// object shape when she has a background image to associate.

import marlow from './marlow.js';
import brendan from './brendan.js';
import diana from './diana.js';
import peter from './peter.js';
import richard from './richard.js';
import sophia from './sophia.js';

const HEART_EVENTS = {
  marlow,
  brendan,
  diana,
  peter,
  richard,
  sophia
};

// Always returns either null or a normalized { text, background? } object.
export function getHeartEvent(characterId, level) {
  const raw = HEART_EVENTS[characterId]?.[level] ?? null;
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'string') return { text: raw };
  return raw;
}

export function hasHeartEventContent(characterId, level) {
  const ev = getHeartEvent(characterId, level);
  return !!ev?.text;
}
