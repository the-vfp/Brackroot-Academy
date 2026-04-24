import { useState } from 'react';
import { useStore, DIFFICULTY_LEVELS, stardustForDifficulty } from '../store.jsx';
import { localDateString } from '../db.js';
import { useToast } from './Toast.jsx';
import { useLongPress } from '../hooks/useLongPress.js';

const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const DEFAULT_ICON = '\u2728';

function DifficultyPicker({ value, onChange, className = '' }) {
  return (
    <div className={`difficulty-picker ${className}`}>
      {DIFFICULTY_LEVELS.map(d => (
        <button
          key={d}
          type="button"
          className={`difficulty-option ${value === d ? 'selected' : ''}`}
          onClick={() => onChange(d)}
        >
          <span className="difficulty-label">{DIFFICULTY_LABELS[d]}</span>
          <span className="difficulty-value">{stardustForDifficulty(d)} {'\u2728'}</span>
        </button>
      ))}
    </div>
  );
}

function DailyHabitRow({ habit, isDone, streak, earn, onTap, onLongPress }) {
  const handlers = useLongPress(onLongPress, onTap);
  return (
    <div
      className={`habit-item ${isDone ? 'completed' : ''}`}
      role="button"
      tabIndex={0}
      {...handlers}
    >
      <div className="habit-check">{isDone ? '\u2713' : ''}</div>
      <div className="habit-icon">{habit.icon}</div>
      <div className="habit-details">
        <div className="habit-name">{habit.name}</div>
        {streak > 0 && (
          <div className="habit-streak">
            {streak >= 7 ? '\u{1F525}' : '\u2726'} {streak} day{streak !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      <div className="habit-stardust">
        {isDone ? `+${earn} \u2728` : `${earn} \u2728`}
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
          {count > 0 ? `${count}\u00D7 today \u00B7 +${count * earn} \u2728` : `Tap + each time \u00B7 ${earn} \u2728`}
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
    habits, toggleHabit, addHabit, updateHabit, deleteHabit,
    getTodayCompletedHabits, getTodayHabitCounts, getHabitStreak,
    getHabitDay, startNewDay
  } = useStore();
  const showToast = useToast();

  // Inline add state — emoji + name + difficulty (defaults: daily, ✨).
  // Long-press the new row afterwards to switch to repeatable.
  const [newIcon, setNewIcon] = useState(DEFAULT_ICON);
  const [newName, setNewName] = useState('');
  const [newDifficulty, setNewDifficulty] = useState('medium');

  // Inline edit state
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState(DEFAULT_ICON);
  const [editType, setEditType] = useState('daily');
  const [editDifficulty, setEditDifficulty] = useState('medium');

  async function handleAdd(e) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    const safeIcon = (newIcon || DEFAULT_ICON).trim() || DEFAULT_ICON;
    await addHabit(trimmed, safeIcon, null, 'daily', newDifficulty);
    setNewName('');
    setNewIcon(DEFAULT_ICON);
    showToast('Habit added!');
  }

  const completedToday = getTodayCompletedHabits();
  const todayCounts = getTodayHabitCounts();

  const dailyHabits = habits.filter(h => h.type !== 'repeatable');
  const dailyDone = dailyHabits.filter(h => completedToday.includes(h.id)).length;
  const repeatableTaps = habits
    .filter(h => h.type === 'repeatable')
    .reduce((sum, h) => sum + (todayCounts[h.id] || 0), 0);

  async function handleToggle(habit) {
    if (editing === habit.id) return;
    const result = await toggleHabit(habit.id);

    if (result.completed) {
      let msg = `+${result.stardust} \u2728`;
      if (result.weeklyStreak) msg += ' \u{1F525} Weekly streak bonus!';
      if (result.fullDayBonus) msg += ' \u2726 Full Day at Brackroot!';
      showToast(msg);
    }
  }

  function startEdit(e, habit) {
    if (e) e.stopPropagation();
    setEditing(habit.id);
    setEditName(habit.name);
    setEditIcon(habit.icon || DEFAULT_ICON);
    setEditType(habit.type || 'daily');
    setEditDifficulty(habit.difficulty || 'medium');
  }

  function cancelEdit(e) {
    if (e) e.stopPropagation();
    setEditing(null);
  }

  async function saveEdit(e, habit) {
    if (e) e.stopPropagation();
    const trimmed = editName.trim();
    if (!trimmed) {
      showToast('Habit needs a name.');
      return;
    }
    const safeIcon = (editIcon || DEFAULT_ICON).trim() || DEFAULT_ICON;
    await updateHabit(habit.id, {
      name: trimmed,
      icon: safeIcon,
      type: editType,
      difficulty: editDifficulty
    });
    setEditing(null);
    showToast('Habit updated');
  }

  async function handleDelete(e, habit) {
    e.stopPropagation();
    if (confirm(`Remove "${habit.name}"? Its streak history will also be deleted.`)) {
      await deleteHabit(habit.id);
      showToast('Habit removed');
      if (editing === habit.id) setEditing(null);
    }
  }

  const habitDay = getHabitDay();
  const calendarToday = localDateString();
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
          if (editing === habit.id) {
            return (
              <div key={habit.id} className="habit-item habit-edit-item" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  className="form-input habit-edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Habit name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(null, habit);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                />
                <input
                  type="text"
                  className="form-input emoji-input"
                  value={editIcon}
                  onChange={(e) => setEditIcon(e.target.value)}
                  placeholder="Tap to open your emoji keyboard"
                  maxLength={8}
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <div className="habit-type-picker">
                  <button
                    type="button"
                    className={`habit-type-option ${editType === 'daily' ? 'selected' : ''}`}
                    onClick={() => setEditType('daily')}
                  >
                    <span>{'\u2713'}</span> Daily
                    <span className="habit-type-desc">Once per day</span>
                  </button>
                  <button
                    type="button"
                    className={`habit-type-option ${editType === 'repeatable' ? 'selected' : ''}`}
                    onClick={() => setEditType('repeatable')}
                  >
                    <span>+</span> Repeatable
                    <span className="habit-type-desc">Multiple per day</span>
                  </button>
                </div>
                <DifficultyPicker value={editDifficulty} onChange={setEditDifficulty} />
                <div className="habit-edit-actions">
                  <button className="btn-primary" onClick={(e) => saveEdit(e, habit)}>
                    Save
                  </button>
                  <button className="btn-secondary" onClick={cancelEdit} style={{ margin: 0 }}>
                    Cancel
                  </button>
                  <button className="btn-secondary btn-danger" onClick={(e) => handleDelete(e, habit)} style={{ margin: 0 }}>
                    {'\u{1F5D1}'}
                  </button>
                </div>
              </div>
            );
          }

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
                onLongPress={() => startEdit(null, habit)}
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
              onLongPress={() => startEdit(null, habit)}
            />
          );
        })}
      </div>

      {habits.length === 0 && (
        <div className="history-empty">
          No habits yet. Add one below!
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
