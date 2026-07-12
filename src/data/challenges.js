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
// The one gate defined so far: SGC Elections → Brendan's Level 4 heart event
// (canon per Conditional Unlocks; the events.js L5 note was stale, now fixed).
//
// Win condition — "The Campaign": a two-front composite that mirrors running an
// election together (Brendan's competence-as-care, the partnership arc) —
// STRATEGY (journal on 8 days) + LEGWORK (finish 12 tasks). Both must be met.
// Magnitudes are tunable. LIVE: `gatesLevel` now holds the level shut —
// interactions cap RP at the L3→L4 wall until the challenge is claimed, and
// claiming opens L4 + records its heart event (see store `purchaseInteraction`
// / `claimChallenge`). More gates get added here as arcs are written.

export const CHALLENGES = [
  {
    id: 'sgc_elections',
    title: 'SGC Elections',
    blurb: 'Journal on 8 days and finish 12 tasks.',
    characterId: 'brendan',
    gatesLevel: 4,
    goal: {
      shape: 'composite',
      parts: [
        { shape: 'count', source: { type: 'habit', habitKey: 'journal' }, count: 8, unit: 'days journaled' },
        { shape: 'count', source: { type: 'task' }, count: 12, unit: 'tasks done' },
      ],
    },
    requires: [{ type: 'character_level', characterId: 'brendan', level: 3 }],
  },
];

export function getChallenge(id) {
  return CHALLENGES.find(c => c.id === id);
}

export function getChallengesForCharacter(characterId) {
  return CHALLENGES.filter(c => c.characterId === characterId);
}
