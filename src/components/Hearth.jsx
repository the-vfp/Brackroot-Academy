import { useStore, stardustForDifficulty } from '../store.jsx';
import { CHARACTER_DEFS, getTitle } from '../data/characters.js';
import { colorsFor } from '../data/characterColors.js';
import StardustStar from './StardustStar.jsx';

// In-world flavor lines for under the greeting, chosen by time of day.
const FLAVOR = {
  morning:   ['The courtyard is still cool. The Wind is quiet today.',
              'Dew on the banners. Divines is slow to wake.'],
  afternoon: ['The courtyard is warm. The Wind is quiet today.',
              'Sunlight on old stone. A good hour to be seen.'],
  evening:   ['The lamps are coming on across campus. The Wind stirs.',
              'Long shadows in the cloister. The day softens.'],
  night:     ['The halls are dark and yours. The Wind has gone still.',
              'Everyone is asleep but you. The kitchens are unguarded.'],
};

function phaseOf(hour) {
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

function greetingFor(phase) {
  return phase === 'morning' ? 'Good morning,'
    : phase === 'afternoon' ? 'Good afternoon,'
    : phase === 'evening' ? 'Good evening,'
    : 'Good night,';
}

export default function Hearth({ onNavigate }) {
  const {
    appState, meals, habits, habitLogs, tasks, expenses, heartEvents,
    getHabitDay, getTodayCompletedHabits,
  } = useStore();

  const now = new Date();
  const phase = phaseOf(now.getHours());
  // Deterministic-per-day flavor pick (no Math.random flicker on re-render).
  const flavorPool = FLAVOR[phase];
  const flavor = flavorPool[now.getDate() % flavorPool.length];

  const today = getHabitDay();
  const boundary = appState?.dayBoundary || 0;

  // ── Today's Tally ──
  const mealsToday = meals.filter(m => m.date === today);
  const dailyHabits = habits.filter(h => h.type !== 'repeatable');
  const completedIds = new Set(getTodayCompletedHabits());
  const habitsKept = dailyHabits.filter(h => completedIds.has(h.id)).length;
  const tasksDone = tasks.filter(t => t.completed).length;
  const tasksTotal = tasks.length;

  // Stardust earned today — summed from the day's real entries (bonuses excluded;
  // this is the at-a-glance figure, not the canonical ledger).
  const habitLogsToday = habitLogs.filter(l => l.date === today && l.timestamp >= boundary);
  let earnedToday = 0;
  earnedToday += expenses.filter(e => e.date === today).reduce((s, e) => s + (e.stardustEarned || 0), 0);
  earnedToday += mealsToday.reduce((s, m) => s + (m.stardustEarned || 0), 0);
  earnedToday += habitLogsToday.reduce((s, l) => {
    const h = habits.find(x => x.id === l.habitId);
    return s + stardustForDifficulty(h?.difficulty);
  }, 0);
  earnedToday += tasks.filter(t => t.completed).reduce((s, t) => s + stardustForDifficulty(t.difficulty), 0);

  // ── The letter that's waiting — the most recently unlocked heart event ──
  const latestLetter = heartEvents[0] || null;
  const letterDef = latestLetter ? CHARACTER_DEFS[latestLetter.characterId] : null;
  const letterFirstName = letterDef ? letterDef.name.split(' ')[0] : '';
  const letterTitle = latestLetter ? getTitle(latestLetter.characterId, latestLetter.level) : '';
  const letterColors = latestLetter ? colorsFor(latestLetter.characterId) : null;

  return (
    <div className="tab-view active hearth">
      <h1 className="hearth-greeting">{greetingFor(phase)}<br />Ellene.</h1>
      <p className="hearth-subtitle">{flavor}</p>

      <div className="bk-frame tally-card">
        <div className="tally-label">Today's Tally</div>
        <div className="tally-row">
          <span className="tally-icon">{'\u{1F371}'}</span>
          <span className="tally-name">Meals logged</span>
          <span className="tally-count">{mealsToday.length} / 3</span>
        </div>
        <div className="tally-row">
          <span className="tally-icon">{'✓'}</span>
          <span className="tally-name">Habits kept</span>
          <span className="tally-count">{habitsKept} / {dailyHabits.length}</span>
        </div>
        <div className="tally-row">
          <span className="tally-icon">{'◇'}</span>
          <span className="tally-name">Tasks done</span>
          <span className="tally-count">{tasksDone} / {tasksTotal}</span>
        </div>
        <div className="tally-divider" />
        <div className="tally-earned">
          <span>Earned Today</span>
          <span className="tally-earned-value">
            +{earnedToday} <StardustStar size={15} fill="var(--bk-stardust-deep)" />
          </span>
        </div>
      </div>

      {latestLetter ? (
        <>
          <div className="bk-frame letter-card" style={{ '--bk-frame-band-color': letterColors.base }}>
            <span className="letter-portrait bk-pixel" style={{ background: letterColors.soft }}>{letterDef.portrait}</span>
            <span className="letter-text">
              <span className="letter-label" style={{ color: letterColors.ink }}>A letter is waiting</span>
              <span className="letter-title">{letterFirstName} {'·'} {letterTitle}</span>
            </span>
          </div>
          <div className="hearth-letter-actions">
            <button className="bk-btn bk-btn--indigo" onClick={() => onNavigate && onNavigate('journal')}>
              Read <StardustStar size={15} fill="var(--bk-stardust-shimmer)" />
            </button>
          </div>
        </>
      ) : (
        <div className="hearth-quiet">
          No letters waiting. Spend time with someone on Campus, and a memory will find its way here.
        </div>
      )}
    </div>
  );
}
