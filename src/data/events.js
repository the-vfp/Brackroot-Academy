// Narrative events. Purchasing one spends Stardust and runs its `unlocks` effect.
// Gate types:
//   { type: 'character_level', characterId, level }   — char must be at given level
//   { type: 'event',           eventId }              — another event must be purchased
//   { type: 'challenge',       challengeId }          — challenge must be completed

export const EVENTS = [
  {
    id: 'wander_divines_at_night',
    title: 'Wander Divines at Night',
    cost: 50,
    unlocks: { type: 'character', characterId: 'marlow' },
    requires: [],
    flavor: `It's late enough that the main campus paths are empty. You take the long way back to your room, cutting through the Divines courtyard because it's there and you can.

The common room windows are lit. You stop before you can think about why you're stopping.

Inside, a boy is sprawled across a couch that looks older than both of you, sketchbook balanced on one knee, one hand held out loose and gesturing at whatever he's drawing. There's a lantern on the table. A paper crane someone else folded. Dust in the light.

He looks up. Sees you through the window. Doesn't look surprised.

Just raises an eyebrow. Like: *well?*

You push the door open.`
  },
  {
    id: 'raid_the_kitchen',
    title: 'Raid the Kitchen for a Midnight Snack',
    cost: 150,
    unlocks: { type: 'character', characterId: 'sophia' },
    requires: [],
    flavor: `[Sophia unlock vignette \u2014 to be written]`
  },
  {
    id: 'plan_autumn_masquerade',
    title: 'Plan the Autumn Masquerade',
    cost: 200,
    unlocks: { type: 'character', characterId: 'richard' },
    requires: [{ type: 'character_level', characterId: 'brendan', level: 2 }],
    flavor: `[Richard unlock vignette \u2014 to be written]`
  },
  {
    id: 'launch_dueling_reform',
    title: 'Launch the Dueling Reform Project',
    cost: 300,
    unlocks: { type: 'character', characterId: 'peter' },
    requires: [{ type: 'character_level', characterId: 'brendan', level: 3 }],
    flavor: `[Peter unlock vignette \u2014 to be written]`
  },
  {
    id: 'establish_sgc_ledger_liaison',
    title: 'Establish SGC-Ledger Liaison',
    cost: 500,
    unlocks: { type: 'character', characterId: 'diana' },
    requires: [{ type: 'character_level', characterId: 'brendan', level: 5 }],
    flavor: `[Diana unlock vignette \u2014 to be written]`
  }
  // Note: Brendan's unlock is via the "SGC Elections" challenge (Phase 4),
  // not an event. It's not listed here.
];

export function getEvent(id) {
  return EVENTS.find(e => e.id === id);
}
