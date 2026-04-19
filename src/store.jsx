import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, initializeState, initializeHabits, initializeCategories, initializeCharacters, migrateFromLocalStorage, getWeekStart, getMonthStart, exportAllData, importAllData, resetAllData } from './db.js';
import { useFirebaseSync } from './useFirebaseSync.js';
import { CHARACTER_DEFS, RP_THRESHOLDS, MAX_LEVEL, getTitle } from './data/characters.js';
import { INTERACTION_TIERS, drawLine, isTierUnlocked } from './data/interactions.js';
import { EVENTS, getEvent } from './data/events.js';
import { getHeartEvent } from './data/heartEvents/index.js';

const StoreContext = createContext(null);

const HABIT_STARDUST = 10;
const MEAL_STARDUST_BASE = 15;
const MEAL_STARDUST_HOME_COOKED = 25;
const FULL_DAY_BONUS = 20;
const WEEKLY_STREAK_BONUS = 50;
const TASK_STARDUST = 10;

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
      await loadAllBase();
      setLoading(false);
    }
    init();
  }, [loadAllBase]);

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

  // Stardust earned for an expense: flat 10 + floor(amount).
  const calculateStardust = useCallback((amount) => {
    return 10 + Math.floor(amount);
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
    const stardust = calculateStardust(amount);
    const expense = {
      amount: Math.round(amount * 100) / 100,
      category: categoryId,
      note: note,
      date: customDate || new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      stardustEarned: stardust
    };

    await db.expenses.add(expense);
    await awardStardust(stardust);

    // Full Day bonus (habits + expenses logged the same day).
    const today = new Date().toISOString().split('T')[0];
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
    return appState?.habitDay || new Date().toISOString().split('T')[0];
  }, [appState]);

  const startNewDay = useCallback(async () => {
    const calendarToday = new Date().toISOString().split('T')[0];
    await db.state.update('app', {
      habitDay: calendarToday,
      dayBoundary: Date.now()
    });
    await loadAll();
  }, [loadAll]);

  // ====== HABIT OPERATIONS ======

  const toggleHabit = useCallback(async (habitId) => {
    const today = getHabitDay();
    const habit = habits.find(h => h.id === habitId);

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
          stardust: Math.max(0, (state.stardust || 0) - HABIT_STARDUST),
          totalStardustEarned: Math.max(0, (state.totalStardustEarned || 0) - HABIT_STARDUST)
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

    await awardStardust(HABIT_STARDUST);

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
    return { completed: true, stardust: HABIT_STARDUST, fullDayBonus, weeklyStreak };
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

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

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

  const addHabit = useCallback(async (name, icon, category, type = 'daily') => {
    const maxOrder = habits.reduce((max, h) => Math.max(max, h.sortOrder || 0), -1);
    await db.habits.add({ name, icon, category, type, sortOrder: maxOrder + 1 });
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

  const addTask = useCallback(async (text, category) => {
    await db.tasks.add({
      text,
      category,
      completed: false,
      timestamp: Date.now(),
      completedAt: null
    });
    await loadAll();
  }, [loadAll]);

  const completeTask = useCallback(async (id) => {
    const task = await db.tasks.get(id);
    if (!task || task.completed) return null;

    await db.tasks.update(id, { completed: true, completedAt: Date.now() });
    await awardStardust(TASK_STARDUST);
    await loadAll();
    return { stardust: TASK_STARDUST };
  }, [awardStardust, loadAll]);

  const deleteTask = useCallback(async (id) => {
    await db.tasks.delete(id);
    await loadAll();
  }, [loadAll]);

  const clearCompletedTasks = useCallback(async () => {
    await db.tasks.where('completed').equals(1).delete();
    await loadAll();
  }, [loadAll]);

  // ====== MEAL OPERATIONS ======

  const logMeal = useCallback(async (description, mealType, source, customDate) => {
    const stardust = source === 'home_cooked' ? MEAL_STARDUST_HOME_COOKED : MEAL_STARDUST_BASE;
    const today = customDate || new Date().toISOString().split('T')[0];

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
    const today = new Date().toISOString().split('T')[0];
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
    const today = new Date().toISOString().split('T')[0];
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
        heartEvent = {
          characterId,
          level: newLevel,
          title: newTitle,
          text: getHeartEvent(characterId, newLevel)
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

    if (ev.unlocks?.type === 'character') {
      await db.characters.update(ev.unlocks.characterId, { unlocked: true });
    }

    await loadAll();
    return { ok: true, event: ev };
  }, [canPurchaseEvent, loadAll]);

  // Heart event lookup helpers (for Journal replay).
  const getHeartEventText = useCallback((characterId, level) => {
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
    a.download = `brackroot-tracker-${new Date().toISOString().split('T')[0]}.json`;
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
      logMeal,
      addTask,
      completeTask,
      deleteTask,
      clearCompletedTasks,
      getCharacterState,
      isCharacterUnlocked,
      canInteract,
      purchaseInteraction,
      canPurchaseEvent,
      isEventPurchased,
      purchaseEvent,
      getHeartEventText,
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
