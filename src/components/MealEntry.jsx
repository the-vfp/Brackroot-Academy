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

export default function MealEntry() {
  const { logMeal } = useStore();
  const showToast = useToast();
  const [description, setDescription] = useState('');
  const [mealType, setMealType] = useState('lunch');
  const [source, setSource] = useState('home_cooked');
  const [date, setDate] = useState(localDateString());

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

  const selectedSource = MEAL_SOURCES.find(s => s.id === source);

  return (
    <>
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
    </>
  );
}
