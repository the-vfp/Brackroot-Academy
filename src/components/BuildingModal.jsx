import { TIER_NAMES } from '../data/categories.js';
import { useStore } from '../store.jsx';

export default function BuildingModal({ building, category, tierIndex, onClose }) {
  const { appState } = useStore();
  const currentTier = appState.unlockedBuildings?.[category.id] || 0;
  const isUnlocked = tierIndex < currentTier;
  const isCurrent = tierIndex === currentTier;

  const silverInCategory = appState.silverPerCategory?.[category.id] || 0;
  const pct = isCurrent ? Math.min(100, (silverInCategory / building.cost) * 100) : 0;

  return (
    <div className="modal-overlay show" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal">
        <div style={{ fontSize: 36, marginBottom: 8 }}>{category.icon}</div>
        <h3>{building.name}</h3>
        <div className="modal-tier">{category.name} — Tier {TIER_NAMES[tierIndex]}</div>
        <div className="modal-desc">{building.desc}</div>

        {isCurrent && (
          <>
            <div className="modal-progress-label">Construction Progress</div>
            <div className="modal-progress-bar">
              <div className="modal-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="modal-cost">{silverInCategory} / {building.cost} Silver</div>
          </>
        )}

        {isUnlocked && (
          <div className="modal-cost" style={{ color: 'var(--accent-green-light)' }}>
            {'\u2726'} Erected and thriving
          </div>
        )}

        <button className="modal-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
