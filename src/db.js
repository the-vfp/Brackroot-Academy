import Dexie from 'dexie';
import { DEFAULT_CATEGORIES } from './data/categories.js';
import { CHARACTER_DEFS } from './data/characters.js';
import { EVENTS } from './data/events.js';

export const db = new Dexie('brackroot-tracker');

db.version(1).stores({
  expenses: '++id, category, date, timestamp',
  state: 'key'
});

db.version(2).stores({
  expenses: '++id, category, date, timestamp',
  state: 'key',
  habits: '++id, sortOrder',
  habitLogs: '++id, date, habitId, [date+habitId]'
});

db.version(3).stores({
  expenses: '++id, category, date, timestamp',
  state: 'key',
  habits: '++id, sortOrder',
  habitLogs: '++id, date, habitId, [date+habitId]',
  meals: '++id, date, timestamp, mealType, source'
});

db.version(4).stores({
  expenses: '++id, category, date, timestamp',
  state: 'key',
  habits: '++id, sortOrder',
  habitLogs: '++id, date, habitId, [date+habitId]',
  meals: '++id, date, timestamp, mealType, source',
  categories: 'id, sortOrder'
});

db.version(5).stores({
  expenses: '++id, category, date, timestamp',
  state: 'key',
  habits: '++id, sortOrder',
  habitLogs: '++id, date, habitId, [date+habitId]',
  meals: '++id, date, timestamp, mealType, source',
  categories: 'id, sortOrder',
  tasks: '++id, completed, buildingTree, timestamp'
});

// v6 — Theme overhaul: unified Stardust pool, characters/interactions/events/challenges.
// User decision: "preserve logs, reset currency" on upgrade.
db.version(6).stores({
  expenses: '++id, category, date, timestamp',
  state: 'key',
  habits: '++id, sortOrder',
  habitLogs: '++id, date, habitId, [date+habitId]',
  meals: '++id, date, timestamp, mealType, source',
  categories: 'id, sortOrder',
  tasks: '++id, completed, timestamp',
  characters: 'id',
  interactions: '++id, characterId, date, timestamp',
  events: 'id, purchasedAt',
  challenges: '++id, status, startedAt'
}).upgrade(async tx => {
  // State: drop silverPerCategory / unlockedBuildings / budgets; reset currency.
  const state = await tx.table('state').get('app');
  await tx.table('state').put({
    key: 'app',
    stardust: 0,
    totalStardustEarned: 0,
    weekStart: state?.weekStart || getWeekStart(),
    habitDay: state?.habitDay,
    dayBoundary: state?.dayBoundary || 0,
    fullDayDates: state?.fullDayDates || [],
    mealStreakWeeks: state?.mealStreakWeeks || []
  });

  // Rename silverEarned → stardustEarned on log records (historical amounts).
  await tx.table('expenses').toCollection().modify(e => {
    if ('silverEarned' in e) { e.stardustEarned = e.silverEarned; delete e.silverEarned; }
  });
  await tx.table('meals').toCollection().modify(m => {
    if ('silverEarned' in m) { m.stardustEarned = m.silverEarned; delete m.silverEarned; }
  });

  // Rename buildingTree → category on habits + tasks (it was always a category id).
  await tx.table('habits').toCollection().modify(h => {
    if ('buildingTree' in h) { h.category = h.buildingTree; delete h.buildingTree; }
  });
  await tx.table('tasks').toCollection().modify(t => {
    if ('buildingTree' in t) { t.category = t.buildingTree; delete t.buildingTree; }
  });

  // Strip building lore from categories — icons and names stay.
  await tx.table('categories').toCollection().modify(c => {
    if ('buildings' in c) delete c.buildings;
  });
});

// v7 — Phase 2: heart events table (scripted narrative on level-up).
// Compound primary key [characterId+level] makes the write idempotent —
// re-firing a level-up never creates duplicates.
db.version(7).stores({
  expenses: '++id, category, date, timestamp',
  state: 'key',
  habits: '++id, sortOrder',
  habitLogs: '++id, date, habitId, [date+habitId]',
  meals: '++id, date, timestamp, mealType, source',
  categories: 'id, sortOrder',
  tasks: '++id, completed, timestamp',
  characters: 'id',
  interactions: '++id, characterId, date, timestamp',
  events: 'id, purchasedAt',
  challenges: '++id, status, startedAt',
  heartEvents: '[characterId+level], characterId, timestamp'
});

// Initialize default state values if they don't exist
export async function initializeState() {
  const existing = await db.state.get('app');
  if (!existing) {
    await db.state.put({
      key: 'app',
      stardust: 0,
      totalStardustEarned: 0,
      weekStart: getWeekStart(),
      dayBoundary: 0,
      dayRolloverHour: 0,
      fullDayDates: [],
      mealStreakWeeks: []
    });
  } else {
    const currentWeek = getWeekStart();
    const patch = {};
    if (existing.weekStart !== currentWeek) patch.weekStart = currentWeek;
    if (existing.dayRolloverHour === undefined) patch.dayRolloverHour = 0;
    if (Object.keys(patch).length > 0) await db.state.update('app', patch);
  }
}

// Formats a Date as YYYY-MM-DD in LOCAL time. Using toISOString() converts
// to UTC, which flips the date in the evening for negative-offset timezones
// (e.g. Mountain: 6:49 PM Thu local = 00:49 Fri UTC), so we build the string
// by hand from local components. Canonical "today" for anywhere in the app
// that deals with date-stamped records.
export function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Returns the logical "habit day" (YYYY-MM-DD) given an hour-of-day rollover.
// rolloverHour=4 means anything before 4am counts as yesterday's day.
export function getHabitDayFor(rolloverHour = 0) {
  const now = new Date();
  if (now.getHours() < rolloverHour) {
    now.setDate(now.getDate() - 1);
  }
  return localDateString(now);
}

export function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return localDateString(monday);
}

export function getMonthStart() {
  const now = new Date();
  return localDateString(new Date(now.getFullYear(), now.getMonth(), 1));
}

// Migrate from localStorage if old prototype data exists (pre-Dexie).
// Writes v6 shape directly — the "reset currency" rule applies here too.
export async function migrateFromLocalStorage() {
  try {
    const raw = localStorage.getItem('brackroot_tracker');
    if (!raw) return false;

    const old = JSON.parse(raw);
    if (!old.expenses || old.silver === undefined) return false;

    await db.state.put({
      key: 'app',
      stardust: 0,
      totalStardustEarned: 0,
      weekStart: old.weekStart || getWeekStart(),
      dayBoundary: 0,
      fullDayDates: [],
      mealStreakWeeks: []
    });

    if (old.expenses.length > 0) {
      await db.expenses.bulkAdd(old.expenses.map(e => ({
        amount: e.amount,
        category: e.category,
        note: e.note,
        date: e.date,
        timestamp: e.timestamp,
        stardustEarned: e.silverEarned ?? e.stardustEarned ?? 0
      })));
    }

    localStorage.removeItem('brackroot_tracker');
    return true;
  } catch (e) {
    console.error('Migration failed:', e);
    return false;
  }
}

// Default habit definitions
// type: 'daily' = checkbox (once per day), 'repeatable' = counter (multiple per day)
export const DEFAULT_HABITS = [
  { name: 'Drink water', icon: '\u{1F4A7}', category: 'health', type: 'repeatable', sortOrder: 0 },
  { name: 'Walk / steps', icon: '\u{1F6B6}', category: 'transport', type: 'daily', sortOrder: 1 },
  { name: 'Journal', icon: '\u{1F4D3}', category: 'stationery', type: 'daily', sortOrder: 2 },
  { name: 'Read', icon: '\u{1F4D6}', category: 'stationery', type: 'daily', sortOrder: 3 },
  { name: 'Went to bed on time', icon: '\u{1F319}', category: 'bills', type: 'daily', sortOrder: 4 },
  { name: 'Took medication', icon: '\u{1F48A}', category: 'health', type: 'daily', sortOrder: 5 },
  { name: 'Cooked a meal', icon: '\u{1F373}', category: 'groceries', type: 'repeatable', sortOrder: 6 },
  { name: 'Tidied up', icon: '\u{1F9F9}', category: 'bills', type: 'daily', sortOrder: 7 },
  { name: 'Creative writing', icon: '\u2728', category: 'stationery', type: 'daily', sortOrder: 8 },
  { name: 'Went outside', icon: '\u{1F324}', category: 'transport', type: 'daily', sortOrder: 9 },
];

export async function initializeHabits() {
  const count = await db.habits.count();
  if (count === 0) {
    await db.habits.bulkAdd(DEFAULT_HABITS);
  }
}

export async function initializeCategories() {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkAdd(
      DEFAULT_CATEGORIES.map((c, i) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        sortOrder: i
      }))
    );
  }
}

// Seed per-character progression rows on first boot. Idempotent — skips
// characters that already have a row (so new characters can be added later
// without disturbing existing progress).
export async function initializeCharacters() {
  const existing = await db.characters.toArray();
  const existingIds = new Set(existing.map(c => c.id));
  const toAdd = Object.values(CHARACTER_DEFS)
    .filter(def => !existingIds.has(def.id))
    .map(def => ({
      id: def.id,
      unlocked: false,
      level: 1,
      rpTowardNext: 0,
      totalRpEarned: 0,
      lastInteractionDate: null
    }));
  if (toAdd.length > 0) {
    await db.characters.bulkAdd(toAdd);
  }
}

// Heal state where a character-unlock event was purchased but the character
// row is missing its `unlocked: true` flag. This happens when Firestore data
// from before the character system gets imported (importAllData clears the
// characters table, then never repopulates it since the payload has no
// characters field). Runs during init and after any import.
export async function reconcileCharactersFromEvents() {
  const purchased = await db.events.toArray();
  for (const row of purchased) {
    const def = EVENTS.find(e => e.id === row.id);
    if (def?.unlocks?.type === 'character') {
      const charId = def.unlocks.characterId;
      const char = await db.characters.get(charId);
      if (char && !char.unlocked) {
        await db.characters.update(charId, { unlocked: true });
      }
    }
  }
}

// Export all data as JSON (v7).
export async function exportAllData() {
  const appState = await db.state.get('app');
  const expenses = await db.expenses.toArray();
  const habits = await db.habits.toArray();
  const habitLogs = await db.habitLogs.toArray();
  const meals = await db.meals.toArray();
  const categories = await db.categories.toArray();
  const tasks = await db.tasks.toArray();
  const characters = await db.characters.toArray();
  const interactions = await db.interactions.toArray();
  const events = await db.events.toArray();
  const challenges = await db.challenges.toArray();
  const heartEvents = await db.heartEvents.toArray();
  return {
    version: 7,
    exportedAt: new Date().toISOString(),
    state: {
      stardust: appState.stardust || 0,
      totalStardustEarned: appState.totalStardustEarned || 0,
      weekStart: appState.weekStart,
      habitDay: appState.habitDay,
      dayBoundary: appState.dayBoundary || 0,
      fullDayDates: appState.fullDayDates || [],
      mealStreakWeeks: appState.mealStreakWeeks || []
    },
    expenses,
    habits,
    habitLogs,
    meals,
    categories,
    tasks,
    characters,
    interactions,
    events,
    challenges,
    heartEvents
  };
}

// Helpers to normalize v1–v5 payloads to v6 shape.
function transformExpensesToV6(list) {
  if (!list) return null;
  return list.map(e => ({
    amount: e.amount,
    category: e.category,
    note: e.note || '',
    date: e.date,
    timestamp: e.timestamp,
    stardustEarned: e.stardustEarned ?? e.silverEarned ?? 0
  }));
}
function transformMealsToV6(list) {
  if (!list) return null;
  return list.map(m => ({
    description: m.description,
    mealType: m.mealType,
    source: m.source,
    date: m.date,
    timestamp: m.timestamp,
    stardustEarned: m.stardustEarned ?? m.silverEarned ?? 0
  }));
}
function transformHabitsToV6(list) {
  if (!list) return null;
  return list.map(h => {
    const { buildingTree, ...rest } = h;
    return { ...rest, category: rest.category ?? buildingTree };
  });
}
function transformTasksToV6(list) {
  if (!list) return null;
  return list.map(t => {
    const { buildingTree, ...rest } = t;
    return { ...rest, category: rest.category ?? buildingTree };
  });
}
function transformCategoriesToV6(list) {
  if (!list) return null;
  return list.map(c => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    sortOrder: c.sortOrder
  }));
}

// Import data from JSON (accepts v1–v7 payloads).
export async function importAllData(data) {
  let stateData, expenses, habits, habitLogs, meals, categories, tasks;
  let characters = null, interactions = null, events = null, challenges = null, heartEvents = null;
  const version = data.version;

  if ((version === 7 || version === 6) && data.state) {
    // v6/v7: round-trip — preserve stardust as stored.
    stateData = {
      stardust: data.state.stardust || 0,
      totalStardustEarned: data.state.totalStardustEarned || 0,
      weekStart: data.state.weekStart || getWeekStart(),
      habitDay: data.state.habitDay,
      dayBoundary: data.state.dayBoundary || 0,
      fullDayDates: data.state.fullDayDates || [],
      mealStreakWeeks: data.state.mealStreakWeeks || []
    };
    expenses = data.expenses;
    habits = data.habits;
    habitLogs = data.habitLogs;
    meals = data.meals;
    categories = data.categories;
    tasks = data.tasks;
    characters = data.characters || null;
    interactions = data.interactions || null;
    events = data.events || null;
    challenges = data.challenges || null;
    heartEvents = data.heartEvents || null;
  } else if ((version === 5 || version === 4 || version === 3 || version === 2 || version === 1) && data.state) {
    // Pre-v6: drop silverPerCategory / budgets / unlockedBuildings; reset currency.
    stateData = {
      stardust: 0,
      totalStardustEarned: 0,
      weekStart: data.state.weekStart || getWeekStart(),
      habitDay: data.state.habitDay,
      dayBoundary: data.state.dayBoundary || 0,
      fullDayDates: data.state.fullDayDates || [],
      mealStreakWeeks: data.state.mealStreakWeeks || []
    };
    expenses = transformExpensesToV6(data.expenses);
    habits = transformHabitsToV6(data.habits);
    habitLogs = data.habitLogs || null;
    meals = transformMealsToV6(data.meals);
    categories = transformCategoriesToV6(data.categories);
    tasks = transformTasksToV6(data.tasks);
  } else if (data.expenses && data.silver !== undefined) {
    // Legacy prototype format (pre-Dexie).
    stateData = {
      stardust: 0,
      totalStardustEarned: 0,
      weekStart: data.weekStart || getWeekStart(),
      dayBoundary: 0,
      fullDayDates: [],
      mealStreakWeeks: []
    };
    expenses = transformExpensesToV6(data.expenses);
    habits = null;
    habitLogs = null;
    meals = null;
    categories = null;
    tasks = null;
  } else {
    throw new Error('Unrecognized data format');
  }

  // Clear existing data
  await db.expenses.clear();
  await db.habitLogs.clear();
  await db.meals.clear();
  await db.tasks.clear();
  await db.characters.clear();
  await db.interactions.clear();
  await db.events.clear();
  await db.challenges.clear();
  await db.heartEvents.clear();

  // Write state
  await db.state.put({ key: 'app', ...stateData });

  if (expenses && expenses.length > 0) await db.expenses.bulkAdd(expenses);
  if (habits && habits.length > 0) {
    await db.habits.clear();
    await db.habits.bulkAdd(habits);
  }
  if (habitLogs && habitLogs.length > 0) await db.habitLogs.bulkAdd(habitLogs);
  if (meals && meals.length > 0) await db.meals.bulkAdd(meals);
  if (categories && categories.length > 0) {
    await db.categories.clear();
    await db.categories.bulkAdd(categories);
  }
  if (tasks && tasks.length > 0) await db.tasks.bulkAdd(tasks);
  if (characters && characters.length > 0) await db.characters.bulkAdd(characters);
  if (interactions && interactions.length > 0) await db.interactions.bulkAdd(interactions);
  if (events && events.length > 0) await db.events.bulkAdd(events);
  if (challenges && challenges.length > 0) await db.challenges.bulkAdd(challenges);
  if (heartEvents && heartEvents.length > 0) await db.heartEvents.bulkAdd(heartEvents);

  // Repair: if the imported payload predates the character system, the table is
  // empty after clear(). Re-seed defaults and reconcile any purchased unlock events.
  await initializeCharacters();
  await reconcileCharactersFromEvents();
}

// Reset all data
export async function resetAllData() {
  await db.expenses.clear();
  await db.habitLogs.clear();
  await db.habits.clear();
  await db.meals.clear();
  await db.categories.clear();
  await db.tasks.clear();
  await db.characters.clear();
  await db.interactions.clear();
  await db.events.clear();
  await db.challenges.clear();
  await db.heartEvents.clear();
  await db.habits.bulkAdd(DEFAULT_HABITS);
  await db.categories.bulkAdd(
    DEFAULT_CATEGORIES.map((c, i) => ({
      id: c.id, name: c.name, icon: c.icon, sortOrder: i
    }))
  );
  await db.state.put({
    key: 'app',
    stardust: 0,
    totalStardustEarned: 0,
    weekStart: getWeekStart(),
    dayBoundary: 0,
    fullDayDates: [],
    mealStreakWeeks: []
  });
}
