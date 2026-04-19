// Character roster. Runtime progression lives in the `characters` Dexie table;
// this file is the static definition (titles, metadata, etc.).

export const CHARACTER_DEFS = {
  marlow: {
    id: 'marlow',
    name: 'Marlow Quillan',
    arcLabel: 'the romance arc',
    defaultLocation: 'Courtyard',
    portrait: '\u{1F58C}\uFE0F',
    silhouette: '\u{1F319}',
    activity: 'Journal',
    activityHabitName: 'Journal',
    unlockEventId: 'wander_divines_at_night',
    unlockHint: 'Wander Divines at Night',
    titles: [
      'Housemates',
      'Sketchbook and Stationery',
      'Bad Influence',
      'Alone Together',
      'Someone Who Stayed',
      'Keeper',
      'The Only One',
      'Soulmates',
      'To Us, Always',
      'Infinity'
    ]
  },
  brendan: {
    id: 'brendan',
    name: 'Brendan Selma',
    arcLabel: 'the partnership arc',
    defaultLocation: 'SGC Office',
    portrait: '\u{1F4DC}',
    silhouette: '\u{1F3DB}\uFE0F',
    activity: 'Tidy up',
    activityHabitName: 'Tidied up',
    unlockEventId: 'sgc_elections',
    unlockHint: 'Complete the SGC Elections challenge',
    titles: [
      'Fellow Freshman',
      'Recognized Competency',
      'Bureaucracy Besties',
      'Selma-Elefante Coalition',
      'Chair and Vice',
      'We Hold the Line',
      'Unmasked',
      'Ours Together',
      'Halcyon Days',
      'The Architect'
    ]
  },
  diana: {
    id: 'diana',
    name: 'Diana Delawarr',
    arcLabel: 'the mentor arc',
    defaultLocation: 'Library',
    portrait: '\u{1F4DA}',
    silhouette: '\u2744\uFE0F',
    activity: 'Read',
    activityHabitName: 'Read',
    unlockEventId: 'establish_sgc_ledger_liaison',
    unlockHint: 'Brendan at Lv 5 + Establish SGC-Ledger Liaison',
    titles: [
      'Ledger-SGC Liaison',
      'Girl Crush',
      'Notice Me, Senpai',
      'Off the Record',
      "People's Princess and the Ice Queen",
      'We Share the Distance',
      'We See Him',
      'The Loneliest Girl',
      'More than Myth',
      'A Dream and a Wish'
    ]
  },
  peter: {
    id: 'peter',
    name: 'Peter Adair',
    arcLabel: 'the warmth arc',
    defaultLocation: 'Dueling Grounds',
    portrait: '\u2694\uFE0F',
    silhouette: '\u{1F31E}',
    activity: 'Walk',
    activityHabitName: 'Walk / steps',
    unlockEventId: 'launch_dueling_reform',
    unlockHint: 'Brendan at Lv 3 + Launch the Dueling Reform Project',
    titles: [
      "Brendan's Friend?",
      'Rascals',
      'A Safe Place',
      'Partners in Crime',
      'All Smiles',
      'The Sun',
      'We Set the Fire',
      'Icarus',
      'A Better Performer',
      'Oathkeeper'
    ]
  },
  richard: {
    id: 'richard',
    name: 'Richard Devereaux',
    arcLabel: 'the perception arc',
    defaultLocation: 'Atrium',
    portrait: '\u{1F3AD}',
    silhouette: '\u{1F578}\uFE0F',
    activity: 'Creative writing',
    activityHabitName: 'Creative writing',
    unlockEventId: 'plan_autumn_masquerade',
    unlockHint: 'Brendan at Lv 2 + Plan the Autumn Masquerade',
    titles: [
      'Fellow Aesthete',
      'Brunch Buddy',
      'Publicist',
      'Silvered Truths',
      'Smiles with Teeth',
      'Lovers in Arms',
      'True Yandere',
      'Mythmaker',
      'Chosen Ones',
      'The Story'
    ]
  },
  sophia: {
    id: 'sophia',
    name: 'Sophia Barnes',
    arcLabel: 'the kinship arc',
    defaultLocation: 'Kitchens',
    portrait: '\u{1F373}',
    silhouette: '\u{1F33E}',
    activity: 'Cook a meal',
    activityHabitName: 'Cooked a meal',
    unlockEventId: 'raid_the_kitchen',
    unlockHint: 'Raid the Kitchen for a Midnight Snack',
    titles: [
      'Housemate',
      'Quiet Girl',
      'Scariest One in the Room',
      'Divines Mascot',
      'Actual Main Character',
      'She Hears It Too',
      'Lovesick Girls',
      'Girl Next Door',
      'The Sovereign',
      'The End'
    ]
  },
  wind: {
    id: 'wind',
    name: 'The Wind',
    arcLabel: 'separate from the relationship track',
    defaultLocation: 'Everywhere',
    portrait: '\u{1F343}',
    silhouette: '\u{1F32C}\uFE0F',
    activity: null,
    activityHabitName: null,
    unlockEventId: null,
    unlockHint: "TBD \u2014 Ellene has plans.",
    titles: null
  }
};

// RP needed to go from level N → level N+1. Index 1..9 used; index 0 and 10 unused.
// L10 is the capstone; once there, no further leveling.
export const RP_THRESHOLDS = [0, 30, 40, 60, 80, 120, 160, 220, 300, 400];

export const MAX_LEVEL = 10;

export function getCharacterDef(id) {
  return CHARACTER_DEFS[id];
}

export function getTitle(characterId, level) {
  const def = CHARACTER_DEFS[characterId];
  if (!def?.titles) return null;
  const idx = Math.min(Math.max(level, 1), 10) - 1;
  return def.titles[idx];
}

export function rpNeededForNextLevel(level) {
  if (level >= MAX_LEVEL) return null;
  return RP_THRESHOLDS[level];
}

export const PLAYABLE_CHARACTER_IDS = ['marlow', 'brendan', 'diana', 'peter', 'richard', 'sophia'];

// Characters in display order on the Map.
export const MAP_ORDER = ['marlow', 'sophia', 'brendan', 'peter', 'richard', 'diana', 'wind'];
