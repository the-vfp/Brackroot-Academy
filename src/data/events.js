// Narrative events. Purchasing one spends Stardust and runs its `unlocks` effect.
// Gate types:
//   { type: 'character_level', characterId, level }   — char must be at given level
//   { type: 'event',           eventId }              — another event must be purchased
//   { type: 'challenge',       challengeId }          — challenge must be completed
//
// For character-unlock events, the payoff IS the character's Level 1 heart event.
// The event's `flavor` field stays null — purchasing the event fires the L1 heart
// event directly. Future milestone/story events can use `flavor` for their own
// ceremony text.

export const EVENTS = [
  {
    id: 'wander_divines_at_night',
    title: 'Wander Divines at Night',
    cost: 50,
    unlocks: { type: 'character', characterId: 'marlow' },
    requires: [],
    flavor: null
  },
  {
    id: 'raid_the_kitchen',
    title: 'Raid the Kitchen for a Midnight Snack',
    cost: 150,
    unlocks: { type: 'character', characterId: 'sophia' },
    requires: [],
    flavor: null
  },
  {
    id: 'plan_autumn_masquerade',
    title: 'Plan the Autumn Masquerade',
    cost: 200,
    unlocks: { type: 'character', characterId: 'richard' },
    requires: [{ type: 'character_level', characterId: 'brendan', level: 2 }],
    flavor: null
  },
  {
    id: 'launch_dueling_reform',
    title: 'Launch the Dueling Reform Project',
    cost: 300,
    unlocks: { type: 'character', characterId: 'peter' },
    requires: [{ type: 'character_level', characterId: 'brendan', level: 3 }],
    flavor: null
  },
  {
    id: 'establish_sgc_ledger_liaison',
    title: 'Establish SGC-Ledger Liaison',
    cost: 500,
    unlocks: { type: 'character', characterId: 'diana' },
    requires: [{ type: 'character_level', characterId: 'brendan', level: 5 }],
    flavor: null
  }
  // Note: Brendan's unlock is via the "SGC Elections" challenge (Phase 4),
  // not an event. It's not listed here.
];

export function getEvent(id) {
  return EVENTS.find(e => e.id === id);
}
