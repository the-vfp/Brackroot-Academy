// Heart event registry: characterId → { level (1..10): string | null }
// null entries render a "[to be written]" placeholder in the UI.

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

export function getHeartEvent(characterId, level) {
  const events = HEART_EVENTS[characterId];
  return events?.[level] ?? null;
}

export function hasHeartEventContent(characterId, level) {
  return !!getHeartEvent(characterId, level);
}
