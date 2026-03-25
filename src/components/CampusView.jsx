import { useState, useMemo } from 'react';
import { TIER_NAMES } from '../data/categories.js';
import { useStore } from '../store.jsx';
import BuildingModal from './BuildingModal.jsx';

export default function CampusView() {
  const { appState, categories, getWeekExpenses } = useStore();
  const [modal, setModal] = useState(null);

  const weekExpenses = getWeekExpenses();
  const weekTotalSpent = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
  const weekSilverEarned = weekExpenses.reduce((sum, e) => sum + e.silverEarned, 0);

  const weekStart = useMemo(() => {
    if (!appState?.weekStart) return '';
    const ws = new Date(appState.weekStart + 'T00:00:00');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `Week of ${months[ws.getMonth()]} ${ws.getDate()}`;
  }, [appState?.weekStart]);

  // Build the list of building cards to display
  const buildingCards = useMemo(() => {
    const cards = [];
    categories.forEach(cat => {
      const tier = appState?.unlockedBuildings?.[cat.id] || 0;

      for (let i = 0; i < cat.buildings.length; i++) {
        const isUnlocked = i < tier;
        const isCurrent = i === tier;
        if (i > tier) continue; // Only show unlocked + next

        cards.push({ cat, building: cat.buildings[i], index: i, isUnlocked, isCurrent });
      }
    });
    return cards;
  }, [appState, categories]);

  return (
    <div className="tab-view active">
      <div className="week-info">
        <div>
          <div className="week-label">{weekStart}</div>
          <div style={{ fontSize: 11, color: 'var(--text-warm)', marginTop: 2 }}>
            ${weekTotalSpent.toFixed(2)} spent this week
          </div>
        </div>
        <div className="week-total">+{weekSilverEarned} {'\u{1FA99}'}</div>
      </div>

      <div className="campus-grid">
        {buildingCards.map(({ cat, building, index, isUnlocked, isCurrent }) => {
          const silverIn = appState?.silverPerCategory?.[cat.id] || 0;
          const pct = isCurrent ? Math.min(100, (silverIn / building.cost) * 100) : 0;

          return (
            <div
              key={`${cat.id}-${index}`}
              className={`building-card ${isUnlocked ? 'unlocked' : 'locked'}`}
              onClick={() => setModal({ cat, building, index })}
            >
              <div className="tier-badge">
                {isUnlocked ? '\u2726 ' : ''}Tier {TIER_NAMES[index]}
              </div>
              <div className="icon">{cat.icon}</div>
              <div className="b-name">{building.name}</div>
              <div className="b-category">{cat.name}</div>

              {isCurrent && (
                <>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="b-cost">{silverIn} / {building.cost} {'\u{1FA99}'}</div>
                </>
              )}
              {isUnlocked && (
                <div className="b-cost" style={{ color: 'var(--accent-green-light)' }}>
                  {'\u2713'} Erected
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal && (
        <BuildingModal
          building={modal.building}
          category={modal.cat}
          tierIndex={modal.index}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
