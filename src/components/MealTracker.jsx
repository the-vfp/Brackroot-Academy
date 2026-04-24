import { useState } from 'react';
import { useStore } from '../store.jsx';
import { localDateString } from '../db.js';
import { useToast } from './Toast.jsx';

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: '\u{1F373}' },
  { id: 'lunch', label: 'Lunch', icon: '\u{1F96A}' },
  { id: 'dinner', label: 'Dinner', icon: '\u{1F35D}' },
  { id: 'snack', label: 'Snack', icon: '\u{1F36A}' },
];

const MEAL_SOURCES = [
  { id: 'home_cooked', label: 'Home-cooked', icon: '\u{1F468}\u200D\u{1F373}', stardust: 25 },
  { id: 'prepped', label: 'Groceries / Prepped', icon: '\u{1F96C}', stardust: 18 },
  { id: 'dining_out', label: 'Dining Out', icon: '\u{1F37D}\uFE0F', stardust: 12 },
  { id: 'delivery', label: 'Delivery', icon: '\u{1F989}', stardust: 8 },
];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export default function MealTracker() {
  const { meals, logMeal, deleteMeal } = useStore();
  const showToast = useToast();
  const [description, setDescription] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [source, setSource] = useState('home_cooked');
  const [date, setDate] = useState(localDateString());
  const [showHistory, setShowHistory] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!description.trim()) {
      showToast('What did you eat?');
      return;
    }

    const result = await logMeal(description.trim(), mealType, source, date);
    setDescription('');
    setDate(localDateString());

    let msg = `+${result.stardust} \u2728 logged`;
    if (result.weeklyStreak) msg += ' \u{1F525} Weekly meal streak!';
    if (result.fullDayBonus) msg += ' \u2726 Full Day at Brackroot!';
    showToast(msg);
  }

  // Today's meals
  const today = localDateString();
  const todayMeals = meals.filter(m => m.date === today);

  const selectedSource = MEAL_SOURCES.find(s => s.id === source);

  if (showHistory) {
    return (
      <div className="tab-view active">
        <div className="section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Meal History</span>
          <button className="btn-secondary" onClick={() => setShowHistory(false)} style={{ margin: 0, fontSize: 11 }}>
            {'\u2190'} Back
          </button>
        </div>

        {meals.length === 0 ? (
          <div className="history-empty">No meals logged yet...</div>
        ) : (
          meals.slice(0, 50).map(m => (
            <div key={m.id ?? m.timestamp} className="history-item">
              <div className="history-icon">
                {MEAL_TYPES.find(t => t.id === m.mealType)?.icon || '\u{1F37D}\uFE0F'}
              </div>
              <div className="history-details">
                <div className="history-cat">
                  {MEAL_TYPES.find(t => t.id === m.mealType)?.label || m.mealType}
                  {' \u00B7 '}
                  {MEAL_SOURCES.find(s => s.id === m.source)?.label || m.source}
                </div>
                <div className="history-note">{m.description}</div>
              </div>
              <div className="history-meta">
                <div className="history-stardust">+{m.stardustEarned ?? 0} {'\u2728'}</div>
                <div className="history-date">{formatDate(m.date)}</div>
              </div>
              {confirmId === m.id ? (
                <div className="delete-confirm">
                  <button className="delete-confirm-btn" onClick={async () => {
                    await deleteMeal(m.id);
                    setConfirmId(null);
                    showToast(`-${m.stardustEarned ?? 0} \u2728 meal removed`);
                  }}>Delete</button>
                  <button className="delete-cancel-btn" onClick={() => setConfirmId(null)}>Cancel</button>
                </div>
              ) : (
                <button className="delete-btn" onClick={() => setConfirmId(m.id)}>{'\u00D7'}</button>
              )}
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="tab-view active">
      <div className="section-title">Log a Meal</div>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">What did you eat?</label>
          <textarea
            className="form-textarea"
            placeholder="Leftover pasta with pesto..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Meal</label>
          <div className="meal-type-picker">
            {MEAL_TYPES.map(t => (
              <button
                key={t.id}
                type="button"
                className={`meal-type-option ${mealType === t.id ? 'selected' : ''}`}
                onClick={() => setMealType(t.id)}
              >
                <span className="meal-type-icon">{t.icon}</span>
                <span className="meal-type-label">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Source</label>
          <div className="meal-source-picker">
            {MEAL_SOURCES.map(s => (
              <button
                key={s.id}
                type="button"
                className={`meal-source-option ${source === s.id ? 'selected' : ''}`}
                onClick={() => setSource(s.id)}
              >
                <span>{s.icon}</span>
                <span className="meal-source-label">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="meal-stardust-preview">
          {selectedSource?.id === 'home_cooked'
            ? `\u{1F373} Home-cooked bonus: +${selectedSource.stardust} \u2728`
            : `+${selectedSource?.stardust ?? 0} \u2728`
          }
        </div>

        <button type="submit" className="btn-primary">
          {'\u{1F37D}\uFE0F'} Log Meal
        </button>
      </form>

      {/* Today's meals summary */}
      {todayMeals.length > 0 && (
        <>
          <div className="section-title" style={{ fontSize: 14 }}>
            Today ({todayMeals.length} meal{todayMeals.length !== 1 ? 's' : ''})
          </div>
          {todayMeals.map(m => (
            <div key={m.id ?? m.timestamp} className="history-item">
              <div className="history-icon">
                {MEAL_TYPES.find(t => t.id === m.mealType)?.icon || '\u{1F37D}\uFE0F'}
              </div>
              <div className="history-details">
                <div className="history-cat">
                  {MEAL_TYPES.find(t => t.id === m.mealType)?.label || m.mealType}
                </div>
                <div className="history-note">{m.description}</div>
              </div>
              <div className="history-meta">
                <div className="history-stardust">+{m.stardustEarned ?? 0} {'\u2728'}</div>
              </div>
              {confirmId === m.id ? (
                <div className="delete-confirm">
                  <button className="delete-confirm-btn" onClick={async () => {
                    await deleteMeal(m.id);
                    setConfirmId(null);
                    showToast(`-${m.stardustEarned ?? 0} \u2728 meal removed`);
                  }}>Delete</button>
                  <button className="delete-cancel-btn" onClick={() => setConfirmId(null)}>Cancel</button>
                </div>
              ) : (
                <button className="delete-btn" onClick={() => setConfirmId(m.id)}>{'\u00D7'}</button>
              )}
            </div>
          ))}
        </>
      )}

      <button
        className="btn-secondary habit-manage-btn"
        onClick={() => setShowHistory(true)}
      >
        {'\u{1F4DC}'} View All Meals
      </button>
    </div>
  );
}
