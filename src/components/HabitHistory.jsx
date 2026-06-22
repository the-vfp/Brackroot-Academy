import { useState } from 'react';
import { useStore } from '../store.jsx';

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

function HabitHistoryCard({ habit, stats, streak, isRepeatable, todayDate }) {
  const { days, daysTotal, daysHit, avgPerDay, maxCount, bestStreak } = stats;
  const ratePct = daysTotal ? Math.round((daysHit / daysTotal) * 100) : 0;

  return (
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
  );
}

export default function HabitHistory() {
  const { habits, getHabitStats, getHabitStreak, getHabitDay } = useStore();
  const [rangeId, setRangeId] = useState('month');

  const range = RANGES.find(r => r.id === rangeId) || RANGES[2];
  const todayDate = getHabitDay();

  return (
    <div className="tab-view active">
      <div className="section-title">Almanac</div>

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

      {habits.length === 0 && (
        <div className="history-empty">
          No habits yet. Add some on the Habits tab to start building history!
        </div>
      )}

      <div className="hist-card-list">
        {habits.map(habit => {
          const stats = getHabitStats(habit.id, range.days);
          const streak = getHabitStreak(habit.id);
          return (
            <HabitHistoryCard
              key={habit.id}
              habit={habit}
              stats={stats}
              streak={streak}
              isRepeatable={habit.type === 'repeatable'}
              todayDate={todayDate}
            />
          );
        })}
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
