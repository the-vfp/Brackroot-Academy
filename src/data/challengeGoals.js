// Pure goal evaluators for the Challenge system.
//
// No React, no Dexie — every function operates over plain arrays already loaded
// into the store, so this module is trivially testable and portable. The store
// builds a `ctx` and calls evaluateGoal(); nothing here touches the database.
//
// A GOAL targets a SOURCE (a stream of dated events) and applies a SHAPE:
//   streak         — N consecutive days ending today/yesterday (all-time)
//   count          — N events within the window (cumulative; gaps allowed).
//                    Quality-tier ("5 home-cooked meals") and full-day-run
//                    are just `count` over a filtered source.
//   per_day_floor  — hit a per-day bar on ≥N distinct days within the window
//   comeback       — a streak of N days that began after a gap of ≥G days
//   composite      — several sub-goals, all of which must be met (duo/group)
//
// See the vault spec "Feature Spec — Challenges" → Goal Shapes for the intent.
//
// ctx = {
//   habits, habitLogs, meals, tasks,   // store arrays
//   fullDayDates,                      // string[] of 'YYYY-MM-DD'
//   today,                             // 'YYYY-MM-DD' (canonical local today)
//   startDate,                         // 'YYYY-MM-DD' | null — window start
// }
//
// A SOURCE is one of:
//   { type: 'habit',   habitKey?, difficulty? }   — habit completions, filtered by
//                                                   a specific habit key and/or by
//                                                   difficulty tier (e.g. all 'hard'
//                                                   habits). Omit both = every habit.
//   { type: 'meal',    mealSource? }              — meals, optionally by source id
//   { type: 'task',    difficulty? }              — completed tasks, optionally by tier
//   { type: 'fullday' }                           — Full Day bonus dates

// ---- date helpers (string-based, DST-safe via noon anchoring) ----
function toDate(s) {
  return new Date(s + 'T12:00:00');
}
function fmt(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
function addDays(s, n) {
  const d = toDate(s);
  d.setDate(d.getDate() + n);
  return fmt(d);
}
function diffDays(a, b) {
  return Math.round((toDate(a) - toDate(b)) / 86400000);
}

// Resolve a source to an array of 'YYYY-MM-DD' strings, one entry per event
// (a repeatable habit or multiple meals on one day yield multiple entries).
function sourceDates(source, ctx) {
  switch (source.type) {
    case 'habit': {
      let hs = ctx.habits;
      if (source.habitKey) hs = hs.filter(h => h.key === source.habitKey);
      if (source.difficulty) hs = hs.filter(h => (h.difficulty || 'medium') === source.difficulty);
      const ids = new Set(hs.map(h => h.id));
      return ctx.habitLogs.filter(l => ids.has(l.habitId)).map(l => l.date);
    }
    case 'meal': {
      let ms = ctx.meals;
      if (source.mealSource) ms = ms.filter(m => m.source === source.mealSource);
      return ms.map(m => m.date);
    }
    case 'task': {
      let ts = ctx.tasks.filter(t => t.completed && t.completedAt);
      if (source.difficulty) ts = ts.filter(t => (t.difficulty || 'medium') === source.difficulty);
      return ts.map(t => fmt(new Date(t.completedAt)));
    }
    case 'fullday':
      return [...(ctx.fullDayDates || [])];
    default:
      return [];
  }
}

// Keep only dates at/before today, and — when windowing — at/after startDate.
function windowed(dates, ctx, useWindow) {
  return dates.filter(d =>
    d <= ctx.today && (!useWindow || !ctx.startDate || d >= ctx.startDate)
  );
}

// Longest run of consecutive days ending on today or yesterday. Mirrors the
// store's getHabitStreak so a "streak" challenge reads identically.
function computeStreak(dates, today) {
  const uniq = [...new Set(dates)].sort().reverse();
  if (uniq.length === 0) return 0;
  const yesterday = addDays(today, -1);
  if (uniq[0] !== today && uniq[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < uniq.length; i++) {
    if (diffDays(uniq[i - 1], uniq[i]) === 1) streak++;
    else break;
  }
  return streak;
}

// Evaluate a goal against ctx. Returns { current, target, met, unit } — plus
// `parts` for composite goals (the per-sub-goal results, for detailed UIs).
export function evaluateGoal(goal, ctx) {
  switch (goal.shape) {
    case 'streak': {
      const cur = computeStreak(windowed(sourceDates(goal.source, ctx), ctx, false), ctx.today);
      return { current: cur, target: goal.days, met: cur >= goal.days, unit: 'day streak' };
    }
    case 'count': {
      const dates = windowed(sourceDates(goal.source, ctx), ctx, true);
      return { current: dates.length, target: goal.count, met: dates.length >= goal.count, unit: goal.unit || 'logged' };
    }
    case 'per_day_floor': {
      const dates = windowed(sourceDates(goal.source, ctx), ctx, true);
      const perDate = {};
      for (const d of dates) perDate[d] = (perDate[d] || 0) + 1;
      const goodDays = Object.values(perDate).filter(c => c >= goal.perDay).length;
      return { current: goodDays, target: goal.days, met: goodDays >= goal.days, unit: 'days met' };
    }
    case 'comeback': {
      const all = windowed(sourceDates(goal.source, ctx), ctx, false);
      const cur = computeStreak(all, ctx.today);
      let met = cur >= goal.days;
      if (met) {
        // Confirm the run began after a real lapse: the gap between the streak's
        // first day and the previous event before it must be ≥ afterGapDays.
        const uniq = [...new Set(all)].sort().reverse();
        const streakStart = uniq[cur - 1];
        const prior = uniq.slice(cur).find(d => d < streakStart);
        // A comeback requires a REAL lapse: prior activity, then a gap. With no
        // prior event at all, this is a first-time streak, not a return — fail.
        const gap = prior ? diffDays(streakStart, prior) : 0;
        met = gap >= (goal.afterGapDays || 7);
      }
      return { current: cur, target: goal.days, met, unit: 'day streak' };
    }
    case 'composite': {
      const parts = goal.parts.map(p => evaluateGoal(p, ctx));
      const metCount = parts.filter(r => r.met).length;
      return { current: metCount, target: goal.parts.length, met: metCount === goal.parts.length, unit: 'parts', parts };
    }
    default:
      return { current: 0, target: 1, met: false, unit: '' };
  }
}
