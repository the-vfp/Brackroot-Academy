import { useState } from 'react';
import { useStore } from '../store.jsx';
import { useToast } from './Toast.jsx';
import HabitManager from './HabitManager.jsx';

export default function HabitChecklist() {
  const { habits, toggleHabit, getTodayCompletedHabits, getTodayHabitCounts, getHabitStreak, getHabitDay, startNewDay } = useStore();
  const showToast = useToast();
  const [showManager, setShowManager] = useState(false);

  const completedToday = getTodayCompletedHabits();
  const todayCounts = getTodayHabitCounts();

  // Count unique daily habits completed
  const dailyHabits = habits.filter(h => h.type !== 'repeatable');
  const dailyDone = dailyHabits.filter(h => completedToday.includes(h.id)).length;
  const repeatableTaps = habits
    .filter(h => h.type === 'repeatable')
    .reduce((sum, h) => sum + (todayCounts[h.id] || 0), 0);

  async function handleToggle(habitId) {
    const result = await toggleHabit(habitId);

    if (result.completed) {
      let msg = `+${result.silver} \u{1FA99}`;
      if (result.weeklyStreak) msg += ' \u{1F525} Weekly streak bonus!';
      if (result.fullDayBonus) msg += ' \u2726 Full Day at Brackroot!';
      if (result.unlockedBuilding) msg = `\u{1F3F0} ${result.unlockedBuilding.name} has been erected!`;
      showToast(msg);
    }
  }

  if (showManager) {
    return <HabitManager onBack={() => setShowManager(false)} />;
  }

  const habitDay = getHabitDay();
  const calendarToday = new Date().toISOString().split('T')[0];
  const isOldDay = habitDay !== calendarToday;

  async function handleNewDay() {
    await startNewDay();
    showToast('\u2726 New day at Brackroot!');
  }

  return (
    <div className="tab-view active">
      <div className="section-title">Daily Habits</div>

      <div className="habit-day-bar">
        <span className="habit-day-label">
          {isOldDay
            ? `Tracking: ${new Date(habitDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
            : `Today \u2014 ${new Date(habitDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
        </span>
        <button className={`btn-new-day ${isOldDay ? 'highlight' : ''}`} onClick={handleNewDay}>
          {'\u2726'} New Day
        </button>
      </div>

      <div className="habits-summary">
        <span>
          {dailyDone}/{dailyHabits.length} done
          {repeatableTaps > 0 && ` \u00B7 ${repeatableTaps} extra tap${repeatableTaps !== 1 ? 's' : ''}`}
        </span>
      </div>

      <div className="habit-list">
        {habits.map(habit => {
          const isRepeatable = habit.type === 'repeatable';
          const isDone = !isRepeatable && completedToday.includes(habit.id);
          const count = todayCounts[habit.id] || 0;
          const streak = getHabitStreak(habit.id);

          if (isRepeatable) {
            return (
              <div key={habit.id} className={`habit-item ${count > 0 ? 'completed' : ''}`}>
                <div className="habit-icon">{habit.icon}</div>
                <div className="habit-details">
                  <div className="habit-name">{habit.name}</div>
                  <div className="habit-streak" style={{ color: count > 0 ? 'var(--accent-gold)' : 'var(--text-warm)' }}>
                    {count > 0 ? `${count}\u00D7 today \u00B7 +${count * 10} \u{1FA99}` : 'Tap + each time'}
                  </div>
                </div>
                <button
                  className="habit-plus-btn"
                  onClick={() => handleToggle(habit.id)}
                >
                  +
                </button>
              </div>
            );
          }

          return (
            <button
              key={habit.id}
              className={`habit-item ${isDone ? 'completed' : ''}`}
              onClick={() => handleToggle(habit.id)}
            >
              <div className="habit-check">
                {isDone ? '\u2713' : ''}
              </div>
              <div className="habit-icon">{habit.icon}</div>
              <div className="habit-details">
                <div className="habit-name">{habit.name}</div>
                {streak > 0 && (
                  <div className="habit-streak">
                    {streak >= 7 ? '\u{1F525}' : '\u2726'} {streak} day{streak !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
              <div className="habit-silver">
                {isDone ? `+10 \u{1FA99}` : `10 \u{1FA99}`}
              </div>
            </button>
          );
        })}
      </div>

      {habits.length === 0 && (
        <div className="history-empty">
          No habits yet. Tap below to add some!
        </div>
      )}

      <button
        className="btn-secondary habit-manage-btn"
        onClick={() => setShowManager(true)}
      >
        {'\u2699\uFE0F'} Manage Habits
      </button>
    </div>
  );
}
