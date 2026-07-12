// Challenge definitions.
//
// A challenge is a KEY, not a reward-dispenser: completing it opens a gated
// relationship level (its heart event plays). Challenges grant NO Stardust and
// NO RP — the unlock is the reward. See the vault spec "Feature Spec — Challenges".
//
// Definition shape:
//   id          unique slug
//   title       in-world name shown on the card
//   blurb       one-line human description of the goal
//   characterId which character this gates (null → calendar/group date)
//   gatesLevel  the level held pending until this completes (RP-then-gate)
//   goal        { shape, source, ... } — evaluated by challengeGoals.js
//   requires    prerequisite gates, same vocabulary as events.js `requires`
//   provisional true while the level/goal are placeholders (shown flagged in UI)
//
// ⚠️ PROVISIONAL CONTENT: the entries below exercise the engine and follow the
// spec's shape→character map, but the exact gated LEVELS and goal MAGNITUDES are
// placeholders — Ellene finalizes them per-arc alongside the heart-event writing.
// They are SAFE to ship because no level-hold is wired into interactions yet:
// completing one records the completion (so event `challenge` gates resolve) but
// does not currently open a level. That activation ships with the scenes.
//
// The canonical gate from Conditional Unlocks — SGC Elections → a Brendan heart
// event — is intentionally omitted until its level is settled (the vault says L4,
// events.js says L5; flagged for Ellene) and its goal is designed.

export const CHALLENGES = [
  {
    id: 'the_nightly_vigil',
    title: 'The Nightly Vigil',
    blurb: 'Journal 7 days running.',
    characterId: 'marlow',
    gatesLevel: 3,
    goal: { shape: 'streak', source: { type: 'habit', habitKey: 'journal' }, days: 7 },
    requires: [{ type: 'character_level', characterId: 'marlow', level: 2 }],
    provisional: true,
  },
  {
    id: 'order_in_the_chamber',
    title: 'Order in the Chamber',
    blurb: 'Tidy up on 6 of 7 days.',
    characterId: 'brendan',
    gatesLevel: 4,
    goal: { shape: 'per_day_floor', source: { type: 'habit', habitKey: 'tidy' }, perDay: 1, days: 6 },
    requires: [{ type: 'character_level', characterId: 'brendan', level: 3 }],
    provisional: true,
  },
  {
    id: 'the_midnight_kitchen',
    title: 'The Midnight Kitchen',
    blurb: 'Cook 10 meals.',
    characterId: 'sophia',
    gatesLevel: 3,
    goal: { shape: 'count', source: { type: 'habit', habitKey: 'cook' }, count: 10, unit: 'meals' },
    requires: [{ type: 'character_level', characterId: 'sophia', level: 2 }],
    provisional: true,
  },
  {
    id: 'the_set_reading',
    title: 'The Set Reading',
    blurb: 'Log 3 Hard tasks.',
    characterId: 'diana',
    gatesLevel: 5,
    goal: { shape: 'count', source: { type: 'task', difficulty: 'hard' }, count: 3, unit: 'hard tasks' },
    requires: [{ type: 'character_level', characterId: 'diana', level: 4 }],
    provisional: true,
  },
];

export function getChallenge(id) {
  return CHALLENGES.find(c => c.id === id);
}

export function getChallengesForCharacter(characterId) {
  return CHALLENGES.filter(c => c.characterId === characterId);
}
