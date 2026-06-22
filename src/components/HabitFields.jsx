import { DIFFICULTY_LEVELS, stardustForDifficulty } from '../store.jsx';

export const DEFAULT_ICON = '✨';
export const DIFFICULTY_LABELS = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export function DifficultyPicker({ value, onChange, className = '' }) {
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
          <span className="difficulty-value">{stardustForDifficulty(d)} {'✨'}</span>
        </button>
      ))}
    </div>
  );
}

export function TypePicker({ value, onChange }) {
  return (
    <div className="habit-type-picker">
      <button
        type="button"
        className={`habit-type-option ${value === 'daily' ? 'selected' : ''}`}
        onClick={() => onChange('daily')}
      >
        <span>{'✓'}</span> Daily
        <span className="habit-type-desc">Once per day</span>
      </button>
      <button
        type="button"
        className={`habit-type-option ${value === 'repeatable' ? 'selected' : ''}`}
        onClick={() => onChange('repeatable')}
      >
        <span>+</span> Repeatable
        <span className="habit-type-desc">Multiple per day</span>
      </button>
    </div>
  );
}
