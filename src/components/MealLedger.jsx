import { useState } from 'react';
import { useStore } from '../store.jsx';
import { useToast } from './Toast.jsx';
import GroupedLedger from './GroupedLedger.jsx';

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: '\u{1F373}' },
  { id: 'lunch', label: 'Lunch', icon: '\u{1F96A}' },
  { id: 'dinner', label: 'Dinner', icon: '\u{1F35D}' },
  { id: 'snack', label: 'Snack', icon: '\u{1F36A}' },
];

const MEAL_SOURCES = [
  { id: 'home_cooked', label: 'Home-cooked' },
  { id: 'prepped', label: 'Groceries / Prepped' },
  { id: 'dining_out', label: 'Dining Out' },
  { id: 'delivery', label: 'Delivery' },
];

export default function MealLedger() {
  const { meals, deleteMeal } = useStore();
  const showToast = useToast();
  const [confirmId, setConfirmId] = useState(null);

  return (
    <GroupedLedger
      items={meals}
      getDate={m => m.date}
      getKey={m => m.id ?? m.timestamp}
      emptyMessage="No meals logged yet..."
      title="Meal History"
      renderItem={m => (
        <div className="history-item">
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
      )}
    />
  );
}
