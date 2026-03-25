import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, initializeState, initializeHabits, initializeCategories, migrateFromLocalStorage, getWeekStart, getMonthStart, exportAllData, importAllData, resetAllData } from './db.js';
import { useFirebaseSync } from './useFirebaseSync.js';

const StoreContext = createContext(null);

const HABIT_SILVER = 10;
const MEAL_SILVER_BASE = 15;
const MEAL_SILVER_HOME_COOKED = 25;
const FULL_DAY_BONUS = 20;
const WEEKLY_STREAK_BONUS = 50;

// Which building tree a meal source feeds into
const MEAL_SOURCE_TREE = {
  home_cooked: 'groceries',
  delivery: 'food_delivery',
  dining_out: 'dining',
  prepped: 'groceries'
};

export function StoreProvider({ children }) {
  const [appState, setAppState] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [meals, setMeals] = useState([]);
  const [categories, setCategories] = useState([]);
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
    setAppState(state);
    setExpenses(allExpenses);
    setHabits(allHabits);
    setHabitLogs(allHabitLogs);
    setMeals(allMeals);
    setCategories(allCategories);
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

  // Calculate silver for an expense
  const calculateSilver = useCallback((amount, categoryId) => {
    let base = 10 + Math.floor(amount);
    const budgetEntry = appState?.budgets?.[categoryId];
    const budgetAmount = budgetEntry?.amount || 0;
    const budgetPeriod = budgetEntry?.period || 'weekly';
    if (budgetAmount > 0) {
      const spent = budgetPeriod === 'monthly'
        ? getMonthSpentByCategory()
        : getWeekSpentByCategory();
      if ((spent[categoryId] || 0) + amount <= budgetAmount) {
        base = base * 2;
      }
    }
    return base;
  }, [appState, getWeekSpentByCategory, getMonthSpentByCategory]);

  // Helper: award silver to a building tree
  const awardSilver = useCallback(async (silver, buildingTree) => {
    const state = await db.state.get('app');
    const newSilverPerCat = { ...state.silverPerCategory };
    newSilverPerCat[buildingTree] = (newSilverPerCat[buildingTree] || 0) + silver;

    // Check for building unlock
    const newUnlocked = { ...state.unlockedBuildings };
    const cat = categories.find(c => c.id === buildingTree);
    let unlockedBuilding = null;

    if (cat) {
      const currentTier = newUnlocked[buildingTree] || 0;
      if (currentTier < cat.buildings.length) {
        const nextBuilding = cat.buildings[currentTier];
        if (newSilverPerCat[buildingTree] >= nextBuilding.cost) {
          newUnlocked[buildingTree] = currentTier + 1;
          newSilverPerCat[buildingTree] -= nextBuilding.cost;
          unlockedBuilding = nextBuilding;
        }
      }
    }

    await db.state.update('app', {
      silver: state.silver + silver,
      totalSilverEarned: state.totalSilverEarned + silver,
      silverPerCategory: newSilverPerCat,
      unlockedBuildings: newUnlocked
    });

    return unlockedBuilding;
  }, [categories]);

  // Log an expense
  const logExpense = useCallback(async (amount, categoryId, note, customDate) => {
    const silver = calculateSilver(amount, categoryId);
    const expense = {
      amount: Math.round(amount * 100) / 100,
      category: categoryId,
      note: note,
      date: customDate || new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
      silverEarned: silver
    };

    await db.expenses.add(expense);
    const unlockedBuilding = await awardSilver(silver, categoryId);

    // Check for Full Day bonus
    const today = new Date().toISOString().split('T')[0];
    const todayHabitLogs = habitLogs.filter(l => l.date === today);
    const hasHabitsToday = todayHabitLogs.length > 0;
    let fullDayBonus = false;

    if (hasHabitsToday) {
      // Check if Full Day bonus already awarded today
      const state = await db.state.get('app');
      const fullDayDates = state.fullDayDates || [];
      if (!fullDayDates.includes(today)) {
        await awardSilver(FULL_DAY_BONUS, categoryId);
        await db.state.update('app', { fullDayDates: [...fullDayDates, today] });
        fullDayBonus = true;
      }
    }

    await loadAll();
    return { silver, unlockedBuilding, fullDayBonus };
  }, [calculateSilver, awardSilver, loadAll, habitLogs]);

  // Set budget for a category
  const setBudget = useCallback(async (categoryId, value, period) => {
    const state = await db.state.get('app');
    const newBudgets = { ...state.budgets };
    const existing = newBudgets[categoryId] || {};
    newBudgets[categoryId] = {
      amount: Math.max(0, parseFloat(value) || 0),
      period: period || existing.period || 'weekly'
    };
    await db.state.update('app', { budgets: newBudgets });
    await loadAll();
  }, [loadAll]);

  // ====== HABIT DAY (user-controlled "today") ======

  // The habit day the user considers "today" — persists until they tap "New Day"
  const getHabitDay = useCallback(() => {
    return appState?.habitDay || new Date().toISOString().split('T')[0];
  }, [appState]);

  // Start a new day — sets habit day to calendar today and marks a boundary timestamp
  // Only habits completed AFTER this boundary count for the current day's view
  const startNewDay = useCallback(async () => {
    const calendarToday = new Date().toISOString().split('T')[0];
    await db.state.update('app', {
      habitDay: calendarToday,
      dayBoundary: Date.now()
    });
    await loadAll();
  }, [loadAll]);

  // ====== HABIT OPERATIONS ======

  // Toggle a daily habit, or add a count for a repeatable habit
  const toggleHabit = useCallback(async (habitId) => {
    const today = getHabitDay();
    const habit = habits.find(h => h.id === habitId);

    // Persist habitDay on first toggle so it sticks
    if (!appState?.habitDay) {
      await db.state.update('app', { habitDay: today });
    }
    const isRepeatable = habit?.type === 'repeatable';

    // For daily habits, check if already done today
    if (!isRepeatable) {
      const existing = await db.habitLogs.where({ date: today, habitId }).first();

      if (existing) {
        // Uncomplete: remove log and deduct silver
        await db.habitLogs.delete(existing.id);
        if (habit) {
          const state = await db.state.get('app');
          const newSilverPerCat = { ...state.silverPerCategory };
          newSilverPerCat[habit.buildingTree] = Math.max(0, (newSilverPerCat[habit.buildingTree] || 0) - HABIT_SILVER);
          await db.state.update('app', {
            silver: Math.max(0, state.silver - HABIT_SILVER),
            totalSilverEarned: Math.max(0, state.totalSilverEarned - HABIT_SILVER),
            silverPerCategory: newSilverPerCat
          });
        }
        await loadAll();
        return { completed: false, silver: 0 };
      }
    }

    // Complete (daily) or add one more (repeatable): add log and award silver
    await db.habitLogs.add({
      habitId,
      date: today,
      timestamp: Date.now()
    });

    let unlockedBuilding = null;
    if (habit) {
      unlockedBuilding = await awardSilver(HABIT_SILVER, habit.buildingTree);
    }

    // Check for Full Day bonus (habits + expenses today)
    const todayExpenses = expenses.filter(e => e.date === today);
    let fullDayBonus = false;
    if (todayExpenses.length > 0) {
      const state = await db.state.get('app');
      const fullDayDates = state.fullDayDates || [];
      if (!fullDayDates.includes(today)) {
        const tree = habit?.buildingTree || 'health';
        await awardSilver(FULL_DAY_BONUS, tree);
        await db.state.update('app', { fullDayDates: [...fullDayDates, today] });
        fullDayBonus = true;
      }
    }

    // Check for weekly streak bonus (daily habits only, first completion per day)
    let weeklyStreak = false;
    if (habit && !isRepeatable) {
      const weekStart = appState.weekStart;
      const logsThisWeek = habitLogs.filter(l => l.habitId === habitId && l.date >= weekStart);
      if (logsThisWeek.length + 1 >= 7) {
        await awardSilver(WEEKLY_STREAK_BONUS, habit.buildingTree);
        weeklyStreak = true;
      }
    }

    await loadAll();
    return { completed: true, silver: HABIT_SILVER, unlockedBuilding, fullDayBonus, weeklyStreak };
  }, [habits, habitLogs, expenses, appState, awardSilver, loadAll, getHabitDay]);

  // Get today's completed habit IDs (for daily habits)
  const getTodayCompletedHabits = useCallback(() => {
    const today = getHabitDay();
    const boundary = appState?.dayBoundary || 0;
    return habitLogs
      .filter(l => l.date === today && l.timestamp >= boundary)
      .map(l => l.habitId);
  }, [habitLogs, getHabitDay, appState]);

  // Get today's count per habit (for repeatable habits)
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

  // Get streak for a habit (consecutive days ending today or yesterday)
  const getHabitStreak = useCallback((habitId) => {
    const logs = habitLogs.filter(l => l.habitId === habitId).map(l => l.date);
    const uniqueDates = [...new Set(logs)].sort().reverse();
    if (uniqueDates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Streak must include today or yesterday
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

  // Add a new habit
  const addHabit = useCallback(async (name, icon, buildingTree, type = 'daily') => {
    const maxOrder = habits.reduce((max, h) => Math.max(max, h.sortOrder || 0), -1);
    await db.habits.add({ name, icon, buildingTree, type, sortOrder: maxOrder + 1 });
    await loadAll();
  }, [habits, loadAll]);

  // Update a habit
  const updateHabit = useCallback(async (id, updates) => {
    await db.habits.update(id, updates);
    await loadAll();
  }, [loadAll]);

  // Delete a habit
  const deleteHabit = useCallback(async (id) => {
    await db.habits.delete(id);
    // Also delete its logs
    await db.habitLogs.where('habitId').equals(id).delete();
    await loadAll();
  }, [loadAll]);

  // ====== CATEGORY OPERATIONS ======

  const addCategory = useCallback(async (name, icon, buildings) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sortOrder || 0), -1);
    await db.categories.add({ id: slug, name, icon, buildings, sortOrder: maxOrder + 1 });
    await loadAll();
  }, [categories, loadAll]);

  const updateCategory = useCallback(async (id, updates) => {
    await db.categories.update(id, updates);
    await loadAll();
  }, [loadAll]);

  const deleteCategory = useCallback(async (id) => {
    await db.categories.delete(id);
    // Clean up expenses, silver, budgets, and buildings for this category
    await db.expenses.where('category').equals(id).delete();
    const state = await db.state.get('app');
    const newSilverPerCat = { ...state.silverPerCategory };
    const newUnlocked = { ...state.unlockedBuildings };
    const newBudgets = { ...state.budgets };
    delete newSilverPerCat[id];
    delete newUnlocked[id];
    delete newBudgets[id];
    await db.state.update('app', {
      silverPerCategory: newSilverPerCat,
      unlockedBuildings: newUnlocked,
      budgets: newBudgets
    });
    await loadAll();
  }, [loadAll]);

  // Delete an expense and deduct the silver it earned
  const deleteExpense = useCallback(async (id) => {
    const expense = await db.expenses.get(id);
    if (!expense) return;

    await db.expenses.delete(id);

    // Deduct silver
    const state = await db.state.get('app');
    const newSilverPerCat = { ...state.silverPerCategory };
    newSilverPerCat[expense.category] = Math.max(0, (newSilverPerCat[expense.category] || 0) - expense.silverEarned);
    await db.state.update('app', {
      silver: Math.max(0, state.silver - expense.silverEarned),
      totalSilverEarned: Math.max(0, state.totalSilverEarned - expense.silverEarned),
      silverPerCategory: newSilverPerCat
    });

    await loadAll();
  }, [loadAll]);

  // Delete a meal and deduct the silver it earned
  const deleteMeal = useCallback(async (id) => {
    const meal = await db.meals.get(id);
    if (!meal) return;

    await db.meals.delete(id);

    // Deduct silver
    const buildingTree = MEAL_SOURCE_TREE[meal.source] || 'groceries';
    const state = await db.state.get('app');
    const newSilverPerCat = { ...state.silverPerCategory };
    newSilverPerCat[buildingTree] = Math.max(0, (newSilverPerCat[buildingTree] || 0) - meal.silverEarned);
    await db.state.update('app', {
      silver: Math.max(0, state.silver - meal.silverEarned),
      totalSilverEarned: Math.max(0, state.totalSilverEarned - meal.silverEarned),
      silverPerCategory: newSilverPerCat
    });

    await loadAll();
  }, [loadAll]);

  // ====== MEAL OPERATIONS ======

  // Log a meal
  const logMeal = useCallback(async (description, mealType, source, customDate) => {
    const silver = source === 'home_cooked' ? MEAL_SILVER_HOME_COOKED : MEAL_SILVER_BASE;
    const buildingTree = MEAL_SOURCE_TREE[source] || 'groceries';
    const today = customDate || new Date().toISOString().split('T')[0];

    const meal = {
      description,
      mealType,
      source,
      date: today,
      timestamp: Date.now(),
      silverEarned: silver
    };

    await db.meals.add(meal);
    const unlockedBuilding = await awardSilver(silver, buildingTree);

    // Check Full Day bonus (meals + expenses + habits)
    const todayExpenses = expenses.filter(e => e.date === today);
    const todayHabits = habitLogs.filter(l => l.date === today);
    let fullDayBonus = false;
    if (todayExpenses.length > 0 && todayHabits.length > 0) {
      const state = await db.state.get('app');
      const fullDayDates = state.fullDayDates || [];
      if (!fullDayDates.includes(today)) {
        await awardSilver(FULL_DAY_BONUS, buildingTree);
        await db.state.update('app', { fullDayDates: [...fullDayDates, today] });
        fullDayBonus = true;
      }
    }

    // Check weekly meal logging streak (logged a meal every day this week)
    let weeklyStreak = false;
    const weekStart = appState.weekStart;
    const mealDatesThisWeek = new Set(
      [...meals.filter(m => m.date >= weekStart).map(m => m.date), today]
    );
    if (mealDatesThisWeek.size >= 7) {
      // Check if already awarded this week
      const state = await db.state.get('app');
      const mealStreakWeeks = state.mealStreakWeeks || [];
      if (!mealStreakWeeks.includes(weekStart)) {
        await awardSilver(WEEKLY_STREAK_BONUS, buildingTree);
        await db.state.update('app', { mealStreakWeeks: [...mealStreakWeeks, weekStart] });
        weeklyStreak = true;
      }
    }

    await loadAll();
    return { silver, unlockedBuilding, fullDayBonus, weeklyStreak };
  }, [expenses, habitLogs, meals, appState, awardSilver, loadAll]);

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
    // Push imported data to cloud before reloading
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
      getWeekExpenses,
      getWeekSpentByCategory,
      getMonthSpentByCategory,
      calculateSilver,
      logExpense,
      deleteExpense,
      deleteMeal,
      setBudget,
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
