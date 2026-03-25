import Dexie from 'dexie';
import { DEFAULT_CATEGORIES } from './data/categories.js';

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

// Initialize default state values if they don't exist
export async function initializeState() {
  const existing = await db.state.get('app');
  if (!existing) {
    await db.state.put({
      key: 'app',
      silver: 0,
      totalSilverEarned: 0,
      silverPerCategory: {},
      budgets: {},
      unlockedBuildings: {},
      weekStart: getWeekStart()
    });
  } else {
    // Check if new week
    const currentWeek = getWeekStart();
    if (existing.weekStart !== currentWeek) {
      await db.state.update('app', { weekStart: currentWeek });
    }

    // Migrate budgets from plain numbers to { amount, period } objects
    if (existing.budgets) {
      const needsMigration = Object.values(existing.budgets).some(v => typeof v === 'number');
      if (needsMigration) {
        const migrated = {};
        for (const [catId, val] of Object.entries(existing.budgets)) {
          migrated[catId] = typeof val === 'number'
            ? { amount: val, period: 'weekly' }
            : val;
        }
        await db.state.update('app', { budgets: migrated });
      }
    }
  }
}

export function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().split('T')[0];
}

export function getMonthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

// Migrate from localStorage if old prototype data exists
export async function migrateFromLocalStorage() {
  try {
    const raw = localStorage.getItem('brackroot_tracker');
    if (!raw) return false;

    const old = JSON.parse(raw);
    if (!old.expenses || old.silver === undefined) return false;

    // Migrate state
    await db.state.put({
      key: 'app',
      silver: old.silver || 0,
      totalSilverEarned: old.totalSilverEarned || 0,
      silverPerCategory: old.silverPerCategory || {},
      budgets: old.budgets || {},
      unlockedBuildings: old.unlockedBuildings || {},
      weekStart: old.weekStart || getWeekStart()
    });

    // Migrate expenses
    if (old.expenses.length > 0) {
      await db.expenses.bulkAdd(old.expenses.map(e => ({
        amount: e.amount,
        category: e.category,
        note: e.note,
        date: e.date,
        timestamp: e.timestamp,
        silverEarned: e.silverEarned
      })));
    }

    // Remove old data
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
  { name: 'Drink water', icon: '\u{1F4A7}', buildingTree: 'health', type: 'repeatable', sortOrder: 0 },
  { name: 'Walk / steps', icon: '\u{1F6B6}', buildingTree: 'transport', type: 'daily', sortOrder: 1 },
  { name: 'Journal', icon: '\u{1F4D3}', buildingTree: 'stationery', type: 'daily', sortOrder: 2 },
  { name: 'Read', icon: '\u{1F4D6}', buildingTree: 'stationery', type: 'daily', sortOrder: 3 },
  { name: 'Went to bed on time', icon: '\u{1F319}', buildingTree: 'bills', type: 'daily', sortOrder: 4 },
  { name: 'Took medication', icon: '\u{1F48A}', buildingTree: 'health', type: 'daily', sortOrder: 5 },
  { name: 'Cooked a meal', icon: '\u{1F373}', buildingTree: 'groceries', type: 'repeatable', sortOrder: 6 },
  { name: 'Tidied up', icon: '\u{1F9F9}', buildingTree: 'bills', type: 'daily', sortOrder: 7 },
  { name: 'Creative writing', icon: '\u2728', buildingTree: 'stationery', type: 'daily', sortOrder: 8 },
  { name: 'Went outside', icon: '\u{1F324}', buildingTree: 'transport', type: 'daily', sortOrder: 9 },
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
        buildings: c.buildings,
        sortOrder: i
      }))
    );
  }
}

// Export all data as JSON
export async function exportAllData() {
  const appState = await db.state.get('app');
  const expenses = await db.expenses.toArray();
  const habits = await db.habits.toArray();
  const habitLogs = await db.habitLogs.toArray();
  const meals = await db.meals.toArray();
  const categories = await db.categories.toArray();
  return {
    version: 4,
    exportedAt: new Date().toISOString(),
    state: {
      silver: appState.silver,
      totalSilverEarned: appState.totalSilverEarned,
      silverPerCategory: appState.silverPerCategory,
      budgets: appState.budgets,
      unlockedBuildings: appState.unlockedBuildings,
      weekStart: appState.weekStart,
      habitDay: appState.habitDay
    },
    expenses,
    habits,
    habitLogs,
    meals,
    categories
  };
}

// Import data from JSON
export async function importAllData(data) {
  // Support v4, v3, v2, v1, and legacy prototype formats
  let stateData, expenses, habits, habitLogs, meals, categories;

  if (data.version === 4 && data.state) {
    stateData = data.state;
    expenses = data.expenses;
    habits = data.habits;
    habitLogs = data.habitLogs;
    meals = data.meals;
    categories = data.categories;
  } else if (data.version === 3 && data.state) {
    stateData = data.state;
    expenses = data.expenses;
    habits = data.habits;
    habitLogs = data.habitLogs;
    meals = data.meals;
    categories = null;
  } else if (data.version === 2 && data.state) {
    stateData = data.state;
    expenses = data.expenses;
    habits = data.habits;
    habitLogs = data.habitLogs;
    meals = null;
  } else if (data.version === 1 && data.state) {
    stateData = data.state;
    expenses = data.expenses;
    habits = null;
    habitLogs = null;
  } else if (data.expenses && data.silver !== undefined) {
    // Legacy prototype format
    stateData = {
      silver: data.silver,
      totalSilverEarned: data.totalSilverEarned || 0,
      silverPerCategory: data.silverPerCategory || {},
      budgets: data.budgets || {},
      unlockedBuildings: data.unlockedBuildings || {},
      weekStart: data.weekStart || getWeekStart()
    };
    expenses = data.expenses;
    habits = null;
    habitLogs = null;
    meals = null;
  } else {
    throw new Error('Unrecognized data format');
  }

  // Clear existing data
  await db.expenses.clear();
  await db.habitLogs.clear();
  await db.meals.clear();

  // Write state
  await db.state.put({ key: 'app', ...stateData });

  // Write expenses
  if (expenses && expenses.length > 0) {
    await db.expenses.bulkAdd(expenses.map(e => ({
      amount: e.amount,
      category: e.category,
      note: e.note || '',
      date: e.date,
      timestamp: e.timestamp,
      silverEarned: e.silverEarned
    })));
  }

  // Write habits (replace definitions if provided)
  if (habits && habits.length > 0) {
    await db.habits.clear();
    await db.habits.bulkAdd(habits);
  }

  // Write habit logs
  if (habitLogs && habitLogs.length > 0) {
    await db.habitLogs.bulkAdd(habitLogs);
  }

  // Write meals
  if (meals && meals.length > 0) {
    await db.meals.bulkAdd(meals);
  }

  // Write categories (replace if provided)
  if (categories && categories.length > 0) {
    await db.categories.clear();
    await db.categories.bulkAdd(categories);
  }
}

// Reset all data
export async function resetAllData() {
  await db.expenses.clear();
  await db.habitLogs.clear();
  await db.habits.clear();
  await db.meals.clear();
  await db.categories.clear();
  await db.habits.bulkAdd(DEFAULT_HABITS);
  await db.categories.bulkAdd(
    DEFAULT_CATEGORIES.map((c, i) => ({
      id: c.id, name: c.name, icon: c.icon, buildings: c.buildings, sortOrder: i
    }))
  );
  await db.state.put({
    key: 'app',
    silver: 0,
    totalSilverEarned: 0,
    silverPerCategory: {},
    budgets: {},
    unlockedBuildings: {},
    weekStart: getWeekStart()
  });
}
