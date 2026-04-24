import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, initializeState, initializeHabits, initializeCategories, initializeCharacters, reconcileCharactersFromEvents, migrateFromLocalStorage, getWeekStart, getMonthStart, getHabitDayFor, localDateString, exportAllData, importAllData, resetAllData } from './db.js';
import { useFirebaseSync } from './useFirebaseSync.js';
import { CHARACTER_DEFS, RP_THRESHOLDS, MAX_LEVEL, getTitle } from './data/characters.js';
import { INTERACTION_TIERS, drawLine, isTierUnlocked } from './data/interactions.js';
import { EVENTS, getEvent } from './data/events.js';
import { getHeartEvent } from './data/heartEvents/index.js';

const StoreContext = createContext(null);

const EXPENSE_STARDUST = 10;
const MEAL_STARDUST_BY_SOURCE = {
  home_cooked: 25,
  prepped: 18,
  dining_out: 12,
  delivery: 8,
};
const MEAL_STARDUST_FALLBACK = 15;
const FULL_DAY_BONUS = 20;
const WEEKLY_STREAK_BONUS = 50;

// Habits + tasks earn the same Stardust at the same difficulty tier. Default
// is Medium (10) to preserve the pre-difficulty earning rate.
export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'];
const STARDUST_BY_DIFFICULTY = { easy: 5, medium: 10, hard: 20 };

export function stardustForDifficulty(difficulty) {
  return STARDUST_BY_DIFFICULTY[difficulty] ?? STARDUST_BY_DIFFICULTY.medium;
}

export function stardustForMealSource(source) {
  return MEAL_STARDUST_BY_SOURCE[source] ?? MEAL_STARDUST_FALLBACK;
}

export function StoreProvider({ children }) {
  const [appState, setAppState] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [meals, setMeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [events, setEvents] = useState([]);
  const [heartEvents, setHeartEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load state from IndexedDB
  const loadAllBase = useCallback(async () => {
    const state = await db.state.get('app');
    const allExpenses = await db.expenses.orderBy('timestamp').reverse().toArray();
    const allHabits = await db.habits.toArray();
    allHabits.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const allHabitLogs = await db.habitLogs.toArray();
    const allMeals = await db.meals.orderBy('timestamp').reverse().toArray();
    const allCategories = await db.categories.toArray();
    allCategories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    const allTasks = await db.tasks.orderBy('timestamp').reverse().toArray();
    const allCharacters = await db.characters.toArray();
    const allInteractions = await db.interactions.orderBy('timestamp').reverse().toArray();
    const allEvents = await db.events.toArray();
    const allHeartEvents = await db.heartEvents.orderBy('timestamp').reverse().toArray();
    setAppState(state);
    setExpenses(allExpenses);
    setHabits(allHabits);
    setHabitLogs(allHabitLogs);
    setMeals(allMeals);
    setCategories(allCategories);
    setTasks(allTasks);
    setCharacters(allCharacters);
    setInteractions(allInteractions);
    setEvents(allEvents);
    setHeartEvents(allHeartEvents);
  }, []);

  // Firebase sync hook (uses loadAllBase for cloud → local pulls)
  const {
    currentUser, syncStatus, signIn, signOut,
    syncToFirestore, syncNow, pullFromFirestore
  } = useFirebaseSync(loadAllBase);

  // Wrapped loadAll: reload from IndexedDB, then queue cloud sync
  const loadAll = useCallback(async () => {
    await loadAllBase();
    syncToFirestore();
  }, [loadAllBase, syncToFirestore]);

  // Initialize on mount
  useEffect(() => {
    async function init() {
      await migrateFromLocalStorage();
      await initializeState();
      await initializeHabits();
      await initializeCategories();
      await initializeCharacters();
      await reconcileCharactersFromEvents();
      await rolloverIfNeeded();
      await loadAllBase();
      setLoading(false);
    }
    init();
  }, [loadAllBase]);

  // Re-check rollover whenever the tab regains focus/visibility — catches the
  // case where the app stays open across the configured rollover hour.
  useEffect(() => {
    if (loading) return;
    function recheck() { rolloverIfNeeded().then(loadAllBase); }
    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) recheck(); });
    return () => {
      window.removeEventListener('focus', recheck);
    };
  }, [loading, loadAllBase]);

  // Get expenses for the current week
  const getWeekExpenses = useCallback(() => {
    if (!appState) return [];
    return expenses.filter(e => e.date >= appState.weekStart);
  }, [expenses, appState]);

  // Get spending per category for current week
  const getWeekSpentByCategory = useCallback(() => {
    const spent = {};
    categories.forEach(c => { spent[c.id] = 0; });
    getWeekExpenses().forEach(e => {
      spent[e.category] = (spent[e.category] || 0) + e.amount;
    });
    return spent;
  }, [getWeekExpenses, categories]);

  // Get expenses for the current calendar month
  const getMonthExpenses = useCallback(() => {
    const monthStart = getMonthStart();
    return expenses.filter(e => e.date >= monthStart);
  }, [expenses]);

  // Get spending per category for current month
  const getMonthSpentByCategory = useCallback(() => {
    const spent = {};
    categories.forEach(c => { spent[c.id] = 0; });
    getMonthExpenses().forEach(e => {
      spent[e.category] = (spent[e.category] || 0) + e.amount;
    });
    return spent;
  }, [getMonthExpenses, categories]);

  // Stardust earned for an expense: flat 10, regardless of amount. Tying
  // earning to the dollar value broke the relationship economy — a single
  // $500 expense would nearly level a character.
  const calculateStardust = useCallback(() => {
    return EXPENSE_STARDUST;
  }, []);

  // Award stardust to the unified pool.
  const awardStardust = useCallback(async (amount) => {
    const state = await db.state.get('app');
    await db.state.update('app', {
      stardust: (state.stardust || 0) + amount,
      totalStardustEarned: (state.totalStardustEarned || 0) + amount
    });
  }, []);

  // Log an expense
  const logExpense = useCallback(async (amount, categoryId, note, customDate) => {
    const stardust = calculateStardust();
    const expense = {
      amount: Math.round(amount * 100) / 100,
      category: categoryId,
      note: note,
      date: customDate || localDateString(),
      timestamp: Date.now(),
      stardustEarned: stardust
    };

    await db.expenses.add(expense);
    await awardStardust(stardust);

    // Full Day bonus (habits + expenses logged the same day).
    const today = localDateString();
    const todayHabitLogs = habitLogs.filter(l => l.date === today);
    let fullDayBonus = false;
    if (todayHabitLogs.length > 0) {
      const state = await db.state.get('app');
      const fullDayDates = state.fullDayDates || [];
      if (!fullDayDates.includes(today)) {
        await awardStardust(FULL_DAY_BONUS);
        await db.state.update('app', { fullDayDates: [...fullDayDates, today] });
        fullDayBonus = true;
      }
    }

    await loadAll();
    return { stardust, fullDayBonus };
  }, [calculateStardust, awardStardust, loadAll, habitLogs]);

  // ====== HABIT DAY (user-controlled "today") ======

  const getHabitDay = useCallback(() => {
    return appState?.habitDay || getHabitDayFor(appState?.dayRolloverHour ?? 0);
  }, [appState]);

  // Roll the day over: stamp new habitDay + dayBoundary, sweep completed
  // one-off tasks, and re-arm any recurring tasks whose pattern includes the
  // new day. Filter-based update/delete because Dexie doesn't index booleans
  // cleanly.
  async function rolloverTo(newDay) {
    await db.state.update('app', {
      habitDay: newDay,
      dayBoundary: Date.now()
    });
    // Sweep completed one-off tasks (recurring tasks survive — they get re-armed)
    await db.tasks.filter(t => t.completed === true && !t.recurrence).delete();
    // Re-arm recurring tasks whose weekly pattern includes today's day-of-week
    const dow = new Date(newDay + 'T12:00:00').getDay();
    await db.tasks
      .filter(t =>
        t.completed === true &&
        t.recurrence?.type === 'weekly' &&
        Array.isArray(t.recurrence.days) &&
        t.recurrence.days.includes(dow)
      )
      .modify({ completed: false, completedAt: null });
  }

  // Check whether the configured rollover hour has passed since habitDay was
  // stamped, and roll if so. Runs on mount + window focus.
  async function rolloverIfNeeded() {
    const state = await db.state.get('app');
    if (!state) return;
    const hour = state.dayRolloverHour ?? 0;
    const currentDay = getHabitDayFor(hour);
    if (state.habitDay !== currentDay) {
      await rolloverTo(currentDay);
    }
  }

  const startNewDay = useCallback(async () => {
    const hour = appState?.dayRolloverHour ?? 0;
    await rolloverTo(getHabitDayFor(hour));
    await loadAll();
  }, [loadAll, appState]);

  const setDayRolloverHour = useCallback(async (hour) => {
    const h = Math.max(0, Math.min(23, Number(hour) || 0));
    await db.state.update('app', { dayRolloverHour: h });
    // Re-evaluate: the new hour may flip the current day immediately.
    await rolloverIfNeeded();
    await loadAll();
  }, [loadAll]);

  // ====== HABIT OPERATIONS ======

  const toggleHabit = useCallback(async (habitId) => {
    const today = getHabitDay();
    const habit = habits.find(h => h.id === habitId);
    const earn = stardustForDifficulty(habit?.difficulty);

    if (!appState?.habitDay) {
      await db.state.update('app', { habitDay: today });
    }
    const isRepeatable = habit?.type === 'repeatable';

    if (!isRepeatable) {
      const existing = await db.habitLogs.where({ date: today, habitId }).first();

      if (existing) {
        // Uncomplete: remove log and deduct stardust
        await db.habitLogs.delete(existing.id);
        const state = await db.state.get('app');
        await db.state.update('app', {
          stardust: Math.max(0, (state.stardust || 0) - earn),
          totalStardustEarned: Math.max(0, (state.totalStardustEarned || 0) - earn)
        });
        await loadAll();
        return { completed: false, stardust: 0 };
      }
    }

    await db.habitLogs.add({
      habitId,
      date: today,
      timestamp: Date.now()
    });

    await awardStardust(earn);

    // Full Day bonus (habits + expenses the same day).
    const todayExpenses = expenses.filter(e => e.date === today);
    let fullDayBonus = false;
    if (todayExpenses.length > 0) {
      const state = await db.state.get('app');
      const fullDayDates = state.fullDayDates || [];
      if (!fullDayDates.includes(today)) {
        await awardStardust(FULL_DAY_BONUS);
        await db.state.update('app', { fullDayDates: [...fullDayDates, today] });
        fullDayBonus = true;
      }
    }

    // Weekly streak bonus (daily habits only, first completion per day).
    let weeklyStreak = false;
    if (habit && !isRepeatable) {
      const weekStart = appState.weekStart;
      const logsThisWeek = habitLogs.filter(l => l.habitId === habitId && l.date >= weekStart);
      if (logsThisWeek.length + 1 >= 7) {
        await awardStardust(WEEKLY_STREAK_BONUS);
        weeklyStreak = true;
      }
    }

    await loadAll();
    return { completed: true, stardust: earn, fullDayBonus, weeklyStreak };
  }, [habits, habitLogs, expenses, appState, awardStardust, loadAll, getHabitDay]);

  const getTodayCompletedHabits = useCallback(() => {
    const today = getHabitDay();
    const boundary = appState?.dayBoundary || 0;
    return habitLogs
      .filter(l => l.date === today && l.timestamp >= boundary)
      .map(l => l.habitId);
  }, [habitLogs, getHabitDay, appState]);

  const getTodayHabitCounts = useCallback(() => {
    const today = getHabitDay();
    const boundary = appState?.dayBoundary || 0;
    const counts = {};
    habitLogs
      .filter(l => l.date === today && l.timestamp >= boundary)
      .forEach(l => {
        counts[l.habitId] = (counts[l.habitId] || 0) + 1;
      });
    return counts;
  }, [habitLogs, getHabitDay, appState]);

  const getHabitStreak = useCallback((habitId) => {
    const logs = habitLogs.filter(l => l.habitId === habitId).map(l => l.date);
    const uniqueDates = [...new Set(logs)].sort().reverse();
    if (uniqueDates.length === 0) return 0;

    const today = localDateString();
    const yd = new Date();
    yd.setDate(yd.getDate() - 1);
    const yesterday = localDateString(yd);

    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const curr = new Date(uniqueDates[i - 1] + 'T00:00:00');
      const prev = new Date(uniqueDates[i] + 'T00:00:00');
      const diffDays = (curr - prev) / 86400000;
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [habitLogs]);

  const addHabit = useCallback(async (name, icon, category, type = 'daily', difficulty = 'medium') => {
    const maxOrder = habits.reduce((max, h) => Math.max(max, h.sortOrder || 0), -1);
    await db.habits.add({ name, icon, category, type, difficulty, sortOrder: maxOrder + 1 });
    await loadAll();
  }, [habits, loadAll]);

  const updateHabit = useCallback(async (id, updates) => {
    await db.habits.update(id, updates);
    await loadAll();
  }, [loadAll]);

  const deleteHabit = useCallback(async (id) => {
    await db.habits.delete(id);
    await db.habitLogs.where('habitId').equals(id).delete();
    await loadAll();
  }, [loadAll]);

  // ====== CATEGORY OPERATIONS ======

  const addCategory = useCallback(async (name, icon) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sortOrder || 0), -1);
    await db.categories.add({ id: slug, name, icon, sortOrder: maxOrder + 1 });
    await loadAll();
  }, [categories, loadAll]);

  const updateCategory = useCallback(async (id, updates) => {
    await db.categories.update(id, updates);
    await loadAll();
  }, [loadAll]);

  const deleteCategory = useCallback(async (id) => {
    await db.categories.delete(id);
    await db.expenses.where('category').equals(id).delete();
    await loadAll();
  }, [loadAll]);

  // Delete an expense and deduct the stardust it earned.
  const deleteExpense = useCallback(async (id) => {
    const expense = await db.expenses.get(id);
    if (!expense) return;

    await db.expenses.delete(id);

    const earned = expense.stardustEarned ?? 0;
    const state = await db.state.get('app');
    await db.state.update('app', {
      stardust: Math.max(0, (state.stardust || 0) - earned),
      totalStardustEarned: Math.max(0, (state.totalStardustEarned || 0) - earned)
    });

    await loadAll();
  }, [loadAll]);

  // Delete a meal and deduct the stardust it earned.
  const deleteMeal = useCallback(async (id) => {
    const meal = await db.meals.get(id);
    if (!meal) return;

    await db.meals.delete(id);

    const earned = meal.stardustEarned ?? 0;
    const state = await db.state.get('app');
    await db.state.update('app', {
      stardust: Math.max(0, (state.stardust || 0) - earned),
      totalStardustEarned: Math.max(0, (state.totalStardustEarned || 0) - earned)
    });

    await loadAll();
  }, [loadAll]);

  // ====== TASK OPERATIONS ======

  const addTask = useCallback(async (text, difficulty = 'medium', schedule = null) => {
    // schedule is { dueDate?: 'YYYY-MM-DD', recurrence?: {type:'weekly', days:number[]} }
    // Mutually exclusive — recurrence wins if both set.
    const { dueDate = null, recurrence = null } = schedule || {};
    await db.tasks.add({
      text,
      difficulty,
      dueDate: recurrence ? null : dueDate,
      recurrence,
      completed: false,
      timestamp: Date.now(),
      completedAt: null
    });
    await loadAll();
  }, [loadAll]);

  const completeTask = useCallback(async (id) => {
    const task = await db.tasks.get(id);
    if (!task || task.completed) return null;

    const earn = stardustForDifficulty(task.difficulty);
    await db.tasks.update(id, { completed: true, completedAt: Date.now() });
    await awardStardust(earn);
    await loadAll();
    return { stardust: earn };
  }, [awardStardust, loadAll]);

  const uncheckTask = useCallback(async (id) => {
    const task = await db.tasks.get(id);
    if (!task || !task.completed) return null;

    const refund = stardustForDifficulty(task.difficulty);
    await db.tasks.update(id, { completed: false, completedAt: null });
    const state = await db.state.get('app');
    await db.state.update('app', {
      stardust: Math.max(0, (state.stardust || 0) - refund),
      totalStardustEarned: Math.max(0, (state.totalStardustEarned || 0) - refund)
    });
    await loadAll();
    return { stardust: refund };
  }, [loadAll]);

  const deleteTask = useCallback(async (id) => {
    await db.tasks.delete(id);
    await loadAll();
  }, [loadAll]);

  const updateTask = useCallback(async (id, updates) => {
    await db.tasks.update(id, updates);
    await loadAll();
  }, [loadAll]);

  // ====== MEAL OPERATIONS ======

  const logMeal = useCallback(async (description, mealType, source, customDate) => {
    const stardust = stardustForMealSource(source);
    const today = customDate || localDateString();

    const meal = {
      description,
      mealType,
      source,
      date: today,
      timestamp: Date.now(),
      stardustEarned: stardust
    };

    await db.meals.add(meal);
    await awardStardust(stardust);

    // Full Day bonus (expenses + habits + meal all today).
    const todayExpenses = expenses.filter(e => e.date === today);
    const todayHabits = habitLogs.filter(l => l.date === today);
    let fullDayBonus = false;
    if (todayExpenses.length > 0 && todayHabits.length > 0) {
      const state = await db.state.get('app');
      const fullDayDates = state.fullDayDates || [];
      if (!fullDayDates.includes(today)) {
        await awardStardust(FULL_DAY_BONUS);
        await db.state.update('app', { fullDayDates: [...fullDayDates, today] });
        fullDayBonus = true;
      }
    }

    // Weekly meal logging streak (a meal every day this week).
    let weeklyStreak = false;
    const weekStart = appState.weekStart;
    const mealDatesThisWeek = new Set(
      [...meals.filter(m => m.date >= weekStart).map(m => m.date), today]
    );
    if (mealDatesThisWeek.size >= 7) {
      const state = await db.state.get('app');
      const mealStreakWeeks = state.mealStreakWeeks || [];
      if (!mealStreakWeeks.includes(weekStart)) {
        await awardStardust(WEEKLY_STREAK_BONUS);
        await db.state.update('app', { mealStreakWeeks: [...mealStreakWeeks, weekStart] });
        weeklyStreak = true;
      }
    }

    await loadAll();
    return { stardust, fullDayBonus, weeklyStreak };
  }, [expenses, habitLogs, meals, appState, awardStardust, loadAll]);

  // ====== CHARACTER + INTERACTION OPERATIONS ======

  const getCharacterState = useCallback((id) => {
    return characters.find(c => c.id === id);
  }, [characters]);

  const isCharacterUnlocked = useCallback((id) => {
    return !!getCharacterState(id)?.unlocked;
  }, [getCharacterState]);

  // Gating for an interaction tier. Returns { ok: bool, reason?: string }.
  const canInteract = useCallback((characterId, tier) => {
    const char = getCharacterState(characterId);
    if (!char) return { ok: false, reason: 'Character not initialized.' };
    if (!char.unlocked) return { ok: false, reason: 'Character not unlocked yet.' };
    if (!isTierUnlocked(tier, char.level)) {
      const unlockLv = INTERACTION_TIERS[tier].unlockLevel;
      return { ok: false, reason: `Unlocks at Level ${unlockLv}.` };
    }
    const today = localDateString();
    if (char.lastInteractionDate === today) {
      return { ok: false, reason: 'You\u2019ve already spent time with them today.' };
    }
    const cost = INTERACTION_TIERS[tier].cost;
    if ((appState?.stardust || 0) < cost) {
      return { ok: false, reason: `Need ${cost} \u2728 (you have ${appState?.stardust || 0}).` };
    }
    return { ok: true };
  }, [getCharacterState, appState]);

  const purchaseInteraction = useCallback(async (characterId, tier) => {
    const gate = canInteract(characterId, tier);
    if (!gate.ok) return { ok: false, reason: gate.reason };

    const char = await db.characters.get(characterId);
    const tierDef = INTERACTION_TIERS[tier];
    const today = localDateString();
    const line = drawLine(characterId, tier, char.level);

    // Deduct Stardust
    const state = await db.state.get('app');
    await db.state.update('app', {
      stardust: Math.max(0, (state.stardust || 0) - tierDef.cost)
    });

    // Determine level-up BEFORE writing the log row, so we can store levelAtTime
    const levelAtTime = char.level;
    let newLevel = char.level;
    let newRp = char.rpTowardNext + tierDef.rp;
    let leveledUp = false;
    let heartEvent = null;
    let newTitle = null;

    if (char.level < MAX_LEVEL) {
      const threshold = RP_THRESHOLDS[char.level];
      if (newRp >= threshold) {
        leveledUp = true;
        newLevel = char.level + 1;
        newRp = newRp - threshold; // carry overflow into next level
        newTitle = getTitle(characterId, newLevel);
        // Persist heart event row (idempotent via compound key).
        await db.heartEvents.put({
          characterId,
          level: newLevel,
          timestamp: Date.now()
        });
        const he = getHeartEvent(characterId, newLevel);
        heartEvent = {
          characterId,
          level: newLevel,
          title: newTitle,
          text: he?.text ?? null,
          background: he?.background ?? null
        };
      }
    } else {
      // At MAX_LEVEL — RP goes to totalRpEarned only; rpTowardNext stays at 0.
      newRp = 0;
    }

    // Write interaction log.
    await db.interactions.add({
      characterId,
      tier,
      date: today,
      timestamp: Date.now(),
      cost: tierDef.cost,
      rpGained: tierDef.rp,
      line,
      levelAtTime
    });

    // Update character row.
    await db.characters.update(characterId, {
      level: newLevel,
      rpTowardNext: newRp,
      totalRpEarned: (char.totalRpEarned || 0) + tierDef.rp,
      lastInteractionDate: today
    });

    await loadAll();
    return {
      ok: true,
      line,
      tier,
      cost: tierDef.cost,
      rpGained: tierDef.rp,
      leveledUp,
      newLevel,
      newTitle,
      heartEvent
    };
  }, [canInteract, loadAll]);

  // ====== EVENT OPERATIONS ======

  const isEventPurchased = useCallback((eventId) => {
    return events.some(e => e.id === eventId);
  }, [events]);

  const canPurchaseEvent = useCallback((eventId) => {
    const ev = getEvent(eventId);
    if (!ev) return { ok: false, reason: 'Event not found.' };
    if (isEventPurchased(eventId)) return { ok: false, reason: 'Already purchased.' };
    if ((appState?.stardust || 0) < ev.cost) {
      return { ok: false, reason: `Need ${ev.cost} \u2728.` };
    }
    for (const gate of ev.requires || []) {
      if (gate.type === 'character_level') {
        const char = getCharacterState(gate.characterId);
        if (!char || char.level < gate.level) {
          const def = CHARACTER_DEFS[gate.characterId];
          return { ok: false, reason: `Requires ${def?.name || gate.characterId} at Lv ${gate.level}.` };
        }
      } else if (gate.type === 'event') {
        if (!isEventPurchased(gate.eventId)) {
          const req = getEvent(gate.eventId);
          return { ok: false, reason: `Requires: ${req?.title || gate.eventId}.` };
        }
      } else if (gate.type === 'challenge') {
        // Phase 4 territory — treat as locked for now.
        return { ok: false, reason: 'Requires a challenge (Phase 4).' };
      }
    }
    return { ok: true };
  }, [appState, getCharacterState, events, isEventPurchased]);

  const purchaseEvent = useCallback(async (eventId) => {
    const gate = canPurchaseEvent(eventId);
    if (!gate.ok) return { ok: false, reason: gate.reason };

    const ev = getEvent(eventId);
    const state = await db.state.get('app');

    await db.state.update('app', {
      stardust: Math.max(0, (state.stardust || 0) - ev.cost)
    });

    await db.events.put({ id: ev.id, purchasedAt: Date.now() });

    // Character-unlock events are played as the character's Level 1 heart event —
    // the unlock IS the meeting. We persist an L1 heartEvents row so the Journal
    // can replay it, and return the heart event so the EventModal can show it.
    let heartEvent = null;
    if (ev.unlocks?.type === 'character') {
      const characterId = ev.unlocks.characterId;
      await db.characters.update(characterId, { unlocked: true });
      await db.heartEvents.put({
        characterId,
        level: 1,
        timestamp: Date.now()
      });
      const he = getHeartEvent(characterId, 1);
      heartEvent = {
        characterId,
        level: 1,
        title: getTitle(characterId, 1),
        text: he?.text ?? null,
        background: he?.background ?? null
      };
    }

    await loadAll();
    return { ok: true, event: ev, heartEvent };
  }, [canPurchaseEvent, loadAll]);

  // Heart event lookup for Journal replay — returns normalized { text, background } or null.
  const getHeartEventContent = useCallback((characterId, level) => {
    return getHeartEvent(characterId, level);
  }, []);

  const getInteractionsForCharacter = useCallback((characterId) => {
    return interactions.filter(i => i.characterId === characterId);
  }, [interactions]);

  const getHeartEventsForCharacter = useCallback((characterId) => {
    return heartEvents.filter(h => h.characterId === characterId)
      .sort((a, b) => a.level - b.level);
  }, [heartEvents]);

  // Export data
  const handleExport = useCallback(async () => {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brackroot-tracker-${localDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Import data
  const handleImport = useCallback(async (file) => {
    const text = await file.text();
    const data = JSON.parse(text);
    await importAllData(data);
    if (currentUser) await syncNow();
    await loadAllBase();
  }, [loadAllBase, currentUser, syncNow]);

  // Reset
  const handleReset = useCallback(async () => {
    await resetAllData();
    await loadAll();
  }, [loadAll]);

  if (loading) return null;

  return (
    <StoreContext.Provider value={{
      appState,
      expenses,
      meals,
      habits,
      habitLogs,
      categories,
      tasks,
      characters,
      interactions,
      events,
      heartEvents,
      getWeekExpenses,
      getWeekSpentByCategory,
      getMonthSpentByCategory,
      calculateStardust,
      logExpense,
      deleteExpense,
      deleteMeal,
      toggleHabit,
      getTodayCompletedHabits,
      getTodayHabitCounts,
      getHabitStreak,
      addHabit,
      updateHabit,
      deleteHabit,
      addCategory,
      updateCategory,
      deleteCategory,
      getHabitDay,
      startNewDay,
      setDayRolloverHour,
      logMeal,
      addTask,
      completeTask,
      uncheckTask,
      deleteTask,
      updateTask,
      getCharacterState,
      isCharacterUnlocked,
      canInteract,
      purchaseInteraction,
      canPurchaseEvent,
      isEventPurchased,
      purchaseEvent,
      getHeartEventContent,
      getInteractionsForCharacter,
      getHeartEventsForCharacter,
      handleExport,
      handleImport,
      handleReset,
      currentUser,
      syncStatus,
      signIn,
      signOut,
      pullFromFirestore
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
