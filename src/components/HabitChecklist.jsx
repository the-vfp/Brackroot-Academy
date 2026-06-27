import { useState } from 'react';
import { useStore, stardustForDifficulty } from '../store.jsx';
import { localDateString } from '../db.js';
import { useToast } from './Toast.jsx';
import { useLongPress } from '../hooks/useLongPress.js';
import { DEFAULT_ICON, DifficultyPicker, TypePicker } from './HabitFields.jsx';
import HabitDetail from './HabitDetail.jsx';

function DailyHabitRow({ habit, isDone, streak, earn, onTap, onLongPress }) {
  const handlers = useLongPress(onLongPress, onTap);
  return (
    <div
      className={`habit-item ${isDone ? 'completed' : ''}`}
      role="button"
      tabIndex={0}
      {...handlers}
    >
      <div className="habit-check">{isDone ? '✓' : ''}</div>
      <div className="habit-icon">{habit.icon}</div>
      <div className="habit-details">
        <div className="habit-name">{habit.name}</div>
        {streak > 0 && (
          <div className="habit-streak">
            {streak >= 7 ? '\u{1F525}' : '✦'} {streak} day{streak !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      <div className="habit-stardust">
        {isDone ? `+${earn} ✨` : `${earn} ✨`}
      </div>
    </div>
  );
}

function RepeatableHabitRow({ habit, count, earn, onIncrement, onLongPress }) {
  const handlers = useLongPress(onLongPress);
  return (
    <div
      className={`habit-item ${count > 0 ? 'completed' : ''}`}
      {...handlers}
    >
      <div className="habit-icon">{habit.icon}</div>
      <div className="habit-details">
        <div className="habit-name">{habit.name}</div>
        <div className="habit-streak" style={{ color: count > 0 ? 'var(--accent-gold)' : 'var(--text-warm)' }}>
          {count > 0 ? `${count}× today · +${count * earn} ✨` : `Tap + each time · ${earn} ✨`}
        </div>
      </div>
      <button className="habit-plus-btn" onClick={onIncrement}>
        +
      </button>
    </div>
  );
}

export default function HabitChecklist() {
  const {
    habits, toggleHabit, addHabit,
    getTodayCompletedHabits, getTodayHabitCounts, getHabitStreak,
    getHabitDay, startNewDay
  } = useStore();
  const showToast = useToast();

  // Inline add state — emoji + name + type + difficulty (defaults: daily, Medium, ✨).
  const [newIcon, setNewIcon] = useState(DEFAULT_ICON);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('daily');
  const [newDifficulty, setNewDifficulty] = useState('medium');

  // When set, the per-habit detail page (edit + history) replaces the list.
  const [detailId, setDetailId] = useState(null);
  // Archived habits are hidden behind a disclosure so the daily list stays clean.
  const [showArchived, setShowArchived] = useState(false);

  async function handleAdd(e) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    const safeIcon = (newIcon || DEFAULT_ICON).trim() || DEFAULT_ICON;
    await addHabit(trimmed, safeIcon, null, newType, newDifficulty);
    setNewName('');
    setNewIcon(DEFAULT_ICON);
    setNewType('daily');
    showToast('Habit added!');
  }

  if (detailId != null) {
    return <HabitDetail habitId={detailId} onClose={() => setDetailId(null)} />;
  }

  const completedToday = getTodayCompletedHabits();
  const todayCounts = getTodayHabitCounts();

  // Only active (non-archived) habits show in the daily list. Archived habits
  // keep their history but drop out of the day-to-day checklist.
  const activeHabits = habits.filter(h => h.active !== false);
  const archivedHabits = habits.filter(h => h.active === false);

  const dailyHabits = activeHabits.filter(h => h.type !== 'repeatable');
  const dailyDone = dailyHabits.filter(h => completedToday.includes(h.id)).length;
  const repeatableTaps = activeHabits
    .filter(h => h.type === 'repeatable')
    .reduce((sum, h) => sum + (todayCounts[h.id] || 0), 0);

  async function handleToggle(habit) {
    const result = await toggleHabit(habit.id);

    if (result.completed) {
      let msg = `+${result.stardust} ✨`;
      if (result.weeklyStreak) msg += ' \u{1F525} Weekly streak bonus!';
      if (result.fullDayBonus) msg += ' ✦ Full Day at Brackroot!';
      showToast(msg);
    }
  }

  const habitDay = getHabitDay();
  const calendarToday = localDateString();
  const isOldDay = habitDay !== calendarToday;

  async function handleNewDay() {
    await startNewDay();
    showToast('✦ New day at Brackroot!');
  }

  return (
    <div className="tab-view active">
      <div className="section-title">Daily Habits</div>

      <div className="habit-day-bar">
        <span className="habit-day-label">
          {isOldDay
            ? `Tracking: ${new Date(habitDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
            : `Today — ${new Date(habitDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
        </span>
        <button className={`btn-new-day ${isOldDay ? 'highlight' : ''}`} onClick={handleNewDay}>
          {'✦'} New Day
        </button>
      </div>

      <div className="habits-summary">
        <span>
          {dailyDone}/{dailyHabits.length} done
          {repeatableTaps > 0 && ` · ${repeatableTaps} extra tap${repeatableTaps !== 1 ? 's' : ''}`}
        </span>
      </div>

      {activeHabits.length > 0 && (
        <div className="habit-hint">Hold a habit to edit it & see its history</div>
      )}

      <div className="habit-list">
        {activeHabits.map(habit => {
          const isRepeatable = habit.type === 'repeatable';
          const isDone = !isRepeatable && completedToday.includes(habit.id);
          const count = todayCounts[habit.id] || 0;
          const streak = getHabitStreak(habit.id);
          const earn = stardustForDifficulty(habit.difficulty);

          if (isRepeatable) {
            return (
              <RepeatableHabitRow
                key={habit.id}
                habit={habit}
                count={count}
                earn={earn}
                onIncrement={() => handleToggle(habit)}
                onLongPress={() => setDetailId(habit.id)}
              />
            );
          }

          return (
            <DailyHabitRow
              key={habit.id}
              habit={habit}
              isDone={isDone}
              streak={streak}
              earn={earn}
              onTap={() => handleToggle(habit)}
              onLongPress={() => setDetailId(habit.id)}
            />
          );
        })}
      </div>

      {activeHabits.length === 0 && (
        <div className="history-empty">
          No habits yet. Add one below!
        </div>
      )}

      {archivedHabits.length > 0 && (
        <div className="habit-archived">
          <button
            type="button"
            className="habit-archived-toggle"
            onClick={() => setShowArchived(s => !s)}
          >
            {showArchived ? '▾' : '▸'} Archived ({archivedHabits.length})
          </button>
          {showArchived && (
            <div className="habit-list habit-list-archived">
              {archivedHabits.map(habit => (
                <div
                  key={habit.id}
                  className="habit-item habit-item-archived"
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailId(habit.id)}
                  style={{ opacity: 0.55 }}
                >
                  <div className="habit-icon">{habit.icon}</div>
                  <div className="habit-details">
                    <div className="habit-name">{habit.name}</div>
                    <div className="habit-streak">Tap to restore or view history</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <form className="task-add-form habit-add-form" onSubmit={handleAdd}>
        <div className="habit-add-row">
          <input
            type="text"
            className="form-input habit-add-emoji"
            value={newIcon}
            onChange={e => setNewIcon(e.target.value)}
            placeholder={DEFAULT_ICON}
            maxLength={8}
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Habit emoji"
          />
          <input
            type="text"
            className="task-input"
            placeholder="New habit..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
        </div>
        <TypePicker value={newType} onChange={setNewType} />
        <DifficultyPicker
          value={newDifficulty}
          onChange={setNewDifficulty}
          className="task-difficulty-picker"
        />
        <button type="submit" className="btn-primary task-add-btn" disabled={!newName.trim()}>
          Add Habit
        </button>
      </form>
    </div>
  );
}
