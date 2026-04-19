// Interaction tier definitions — cost, RP gain, and level gates.
// Also the pool-resolution logic that translates (character, tier, level) → line.

import { CHARACTER_DEFS } from './characters.js';
import marlowLines from './lines/marlow.js';
import brendanLines from './lines/brendan.js';
import dianaLines from './lines/diana.js';
import peterLines from './lines/peter.js';
import richardLines from './lines/richard.js';
import sophiaLines from './lines/sophia.js';

export const INTERACTION_TIERS = {
  chat:    { id: 'chat',    cost: 25,  rp: 5,  unlockLevel: 1, icon: '\u{1F4AC}', label: 'Chat',     flavor: 'A wave in the hallway. A few words.' },
  hangout: { id: 'hangout', cost: 100, rp: 15, unlockLevel: 4, icon: '\u2615',    label: 'Hang Out', flavor: 'A real exchange. Time together.' },
  bond:    { id: 'bond',    cost: 300, rp: 40, unlockLevel: 7, icon: '\u2728',    label: 'Bond',     flavor: 'The closest thing to a scene. The ones you feel.' },
};

export const TIER_ORDER = ['chat', 'hangout', 'bond'];

const LINE_POOLS_BY_CHARACTER = {
  marlow: marlowLines,
  brendan: brendanLines,
  diana: dianaLines,
  peter: peterLines,
  richard: richardLines,
  sophia: sophiaLines
};

// Map (tier, level) → pool key on the character's line file.
export function poolKeyFor(tier, level) {
  const bracket = level >= 10 ? 'capstone' : level >= 7 ? 'late' : level >= 4 ? 'mid' : 'early';
  const tierKey = tier === 'chat' ? 'Chat' : tier === 'hangout' ? 'Hangout' : 'Bond';
  return bracket + tierKey;
}

// Placeholder line when the pool is empty / not yet written.
// Shows up in the UI as an obvious [stub] so it's clear content is pending.
function placeholderLine(characterId, tier, level) {
  const def = CHARACTER_DEFS[characterId];
  const bracket = level >= 10 ? 'capstone' : level >= 7 ? 'late' : level >= 4 ? 'mid' : 'early';
  const tierLabel = INTERACTION_TIERS[tier].label;
  return `[${def?.name || characterId} \u2014 ${tierLabel} (${bracket}, Lv ${level}) \u2014 line pool to be written]`;
}

// Draw a random line from the appropriate pool for (character, tier, level).
// Falls back to placeholder if the pool isn't populated yet.
export function drawLine(characterId, tier, level) {
  const pools = LINE_POOLS_BY_CHARACTER[characterId];
  const key = poolKeyFor(tier, level);
  const pool = pools?.[key];
  if (!pool || !Array.isArray(pool) || pool.length === 0) {
    return placeholderLine(characterId, tier, level);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// Whether a tier is available at a given relationship level.
export function isTierUnlocked(tier, level) {
  return level >= INTERACTION_TIERS[tier].unlockLevel;
}
