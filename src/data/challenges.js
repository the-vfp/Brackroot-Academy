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
// The CHARACTER and LEVEL are settled; the GOAL below is a PLACEHOLDER — what
// "running the elections" actually requires you to log is still Ellene's call,
// so `provisional: true` flags it in the UI. Safe to ship because no level-hold
// is wired into interactions yet: completing it records the completion (so the
// event `challenge` gate resolves) but does not yet open L4. That activation
// ships with the scene. More gates get added here as arcs are written.

export const CHALLENGES = [
  {
    id: 'sgc_elections',
    title: 'SGC Elections',
    blurb: 'Placeholder goal — keep order on 6 of 7 days.',
    characterId: 'brendan',
    gatesLevel: 4,
    // PLACEHOLDER: Brendan's mapped shape (per-day-floor on `tidy`) stands in
    // until the real win-condition for the elections is designed.
    goal: { shape: 'per_day_floor', source: { type: 'habit', habitKey: 'tidy' }, perDay: 1, days: 6 },
    requires: [{ type: 'character_level', characterId: 'brendan', level: 3 }],
    provisional: true,
  },
];

export function getChallenge(id) {
  return CHALLENGES.find(c => c.id === id);
}

export function getChallengesForCharacter(characterId) {
  return CHALLENGES.filter(c => c.characterId === characterId);
}
