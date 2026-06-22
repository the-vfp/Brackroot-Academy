import { useState } from 'react';
import { useStore } from '../store.jsx';
import { useToast } from './Toast.jsx';
import { DEFAULT_ICON, DifficultyPicker, TypePicker } from './HabitFields.jsx';

const RANGES = [
  { id: 'week',  label: 'Week',    days: 7 },
  { id: '2week', label: '2 weeks', days: 14 },
  { id: 'month', label: 'Month',   days: 30 },
  { id: 'all',   label: 'All',     days: null },
];

// Map a day's tap count to a 0..4 intensity bucket, relative to the habit's
// busiest day in the window. Daily habits (max 1) always render at full green.
function intensity(count, maxCount) {
  if (count <= 0) return 0;
  if (maxCount <= 1) return 4;
  const ratio = count / maxCount;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

export default function HabitDetail({ habitId, onClose }) {
  const {
    habits, updateHabit, deleteHabit,
    getHabitStats, getHabitStreak, getHabitDay,
  } = useStore();
  const showToast = useToast();

  const habit = habits.find(h => h.id === habitId);

  const [name, setName] = useState(habit?.name ?? '');
  const [icon, setIcon] = useState(habit?.icon || DEFAULT_ICON);
  const [type, setType] = useState(habit?.type || 'daily');
  const [difficulty, setDifficulty] = useState(habit?.difficulty || 'medium');
  const [rangeId, setRangeId] = useState('month');

  // The habit was deleted out from under us (or never existed) — bail to the list.
  if (!habit) {
    onClose();
    return null;
  }

  const isRepeatable = type === 'repeatable';
  const range = RANGES.find(r => r.id === rangeId) || RANGES[2];
  const stats = getHabitStats(habit.id, range.days);
  const streak = getHabitStreak(habit.id);
  const todayDate = getHabitDay();
  const { days, daysTotal, daysHit, avgPerDay, maxCount, bestStreak } = stats;
  const ratePct = daysTotal ? Math.round((daysHit / daysTotal) * 100) : 0;

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast('Habit needs a name.');
      return;
    }
    const safeIcon = (icon || DEFAULT_ICON).trim() || DEFAULT_ICON;
    await updateHabit(habit.id, { name: trimmed, icon: safeIcon, type, difficulty });
    showToast('Habit updated');
    onClose();
  }

  async function handleDelete() {
    if (confirm(`Remove "${habit.name}"? Its streak history will also be deleted.`)) {
      await deleteHabit(habit.id);
      showToast('Habit removed');
      onClose();
    }
  }

  return (
    <div className="tab-view active habit-detail">
      <div className="habit-detail-bar">
        <button className="btn-secondary" onClick={onClose} style={{ margin: 0 }}>{'←'} Back</button>
      </div>

      <div className="section-title">Edit Habit</div>
      <div className="habit-detail-edit">
        <div className="habit-add-row">
          <input
            type="text"
            className="form-input habit-add-emoji"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
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
            className="form-input habit-edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Habit name"
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          />
        </div>
        <TypePicker value={type} onChange={setType} />
        <DifficultyPicker value={difficulty} onChange={setDifficulty} />
        <div className="habit-edit-actions">
          <button className="btn-primary" onClick={handleSave}>Save</button>
          <button className="btn-secondary btn-danger" onClick={handleDelete} style={{ margin: 0 }}>
            {'\u{1F5D1}'} Delete
          </button>
        </div>
      </div>

      <div className="section-title">History</div>
      <div className="hist-range">
        {RANGES.map(r => (
          <button
            key={r.id}
            className={`hist-range-btn ${rangeId === r.id ? 'active' : ''}`}
            onClick={() => setRangeId(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="hist-card">
        <div className="hist-card-head">
          <span className="habit-icon">{habit.icon}</span>
          <span className="hist-card-name">{habit.name}</span>
          {streak > 0 && (
            <span className="hist-streak-badge">
              {streak >= 7 ? '\u{1F525}' : '✦'} {streak} day{streak !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="hist-heatmap">
          {days.map(({ date, count }) => {
            const lvl = intensity(count, maxCount);
            const isToday = date === todayDate;
            const cls = `hist-cell hm-${lvl}${isToday && count === 0 ? ' hm-today' : ''}`;
            const label = `${date}: ${count === 0 ? 'none' : isRepeatable ? `${count}×` : 'done'}`;
            return <span key={date} className={cls} title={label} />;
          })}
        </div>

        <div className="hist-stats">
          <div className="hist-stat">
            <span className="hist-stat-num">{daysHit}/{daysTotal}</span>
            <span className="hist-stat-label">days hit</span>
          </div>
          {isRepeatable ? (
            <div className="hist-stat">
              <span className="hist-stat-num">{avgPerDay.toFixed(1)}{'×'}</span>
              <span className="hist-stat-label">avg / day</span>
            </div>
          ) : (
            <div className="hist-stat">
              <span className="hist-stat-num">{ratePct}%</span>
              <span className="hist-stat-label">done rate</span>
            </div>
          )}
          <div className="hist-stat">
            <span className="hist-stat-num">{bestStreak}</span>
            <span className="hist-stat-label">best streak</span>
          </div>
        </div>
      </div>

      <div className="hist-legend">
        <span className="hist-legend-label">Less</span>
        <span className="hist-cell hm-0" />
        <span className="hist-cell hm-1" />
        <span className="hist-cell hm-2" />
        <span className="hist-cell hm-3" />
        <span className="hist-cell hm-4" />
        <span className="hist-legend-label">More</span>
      </div>
    </div>
  );
}
