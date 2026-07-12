import { useState } from 'react';
import { useStore } from '../../store.jsx';
import { useToast } from '../Toast.jsx';
import { CHARACTER_DEFS, RP_THRESHOLDS, MAX_LEVEL, getTitle } from '../../data/characters.js';
import { INTERACTION_TIERS, TIER_ORDER } from '../../data/interactions.js';

export default function InteractionModal({ characterId, onClose }) {
  const { getCharacterState, canInteract, purchaseInteraction } = useStore();
  const showToast = useToast();
  const [result, setResult] = useState(null);

  const def = CHARACTER_DEFS[characterId];
  const state = getCharacterState(characterId);
  if (!def || !state) return null;

  const title = getTitle(characterId, state.level);
  const threshold = state.level < MAX_LEVEL ? RP_THRESHOLDS[state.level] : null;
  const rpPct = threshold ? Math.min(100, (state.rpTowardNext / threshold) * 100) : 100;

  async function handleTier(tierId) {
    const r = await purchaseInteraction(characterId, tierId);
    if (!r.ok) {
      showToast(r.reason);
      return;
    }
    setResult(r);
    if (r.leveledUp) {
      showToast(`\u2728 Lv ${r.newLevel} \u2014 ${r.newTitle}`);
    }
  }

  function handleDismissLine() {
    // Heart events no longer auto-open — a level-up records the event, which
    // then waits as a letter on the Hearth for the player to open when they like.
    setResult(null);
    onClose();
  }

  // Line result view (small modal).
  if (result) {
    const isLong = result.tier !== 'chat';
    return (
      <div className="modal-overlay" onClick={handleDismissLine}>
        <div className={`modal interaction-line-modal ${isLong ? 'long' : ''}`} onClick={e => e.stopPropagation()}>
          <div className="interaction-line-speaker">{def.name}</div>
          <div className="interaction-line-body">{result.line}</div>
          <div className="interaction-line-meta">
            {INTERACTION_TIERS[result.tier].icon} {INTERACTION_TIERS[result.tier].label}
            {' \u00b7 '}
            {'\u2728'} -{result.cost}
            {' \u00b7 '}
            +{result.rpGained} RP
          </div>
          <button className="modal-close" onClick={handleDismissLine}>
            {result.leveledUp ? '\u2728 A letter is waiting \u2014 Close' : 'Close'}
          </button>
        </div>
      </div>
    );
  }

  // Tier selection view.
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal interaction-modal" onClick={e => e.stopPropagation()}>
        <div className="interaction-header">
          <div className="interaction-portrait">{def.portrait}</div>
          <div className="interaction-header-text">
            <div className="interaction-char-name">{def.name}</div>
            {title && <div className="interaction-char-title">{title}</div>}
            <div className="interaction-char-location">{def.defaultLocation}</div>
          </div>
        </div>

        <div className="interaction-progress-wrap">
          <div className="interaction-progress-label">
            Lv {state.level}/{MAX_LEVEL}
            {threshold && ` \u00b7 ${state.rpTowardNext}/${threshold} RP`}
            {!threshold && ' \u00b7 Capstone'}
          </div>
          <div className="interaction-progress-bar">
            <div className="interaction-progress-fill" style={{ width: `${rpPct}%` }} />
          </div>
        </div>

        <div className="interaction-tiers">
          {TIER_ORDER.map(tierId => {
            const tier = INTERACTION_TIERS[tierId];
            const gate = canInteract(characterId, tierId);
            return (
              <button
                key={tierId}
                className={`interaction-tier-btn ${gate.ok ? '' : 'locked'}`}
                onClick={() => handleTier(tierId)}
                disabled={!gate.ok}
              >
                <div className="tier-icon">{tier.icon}</div>
                <div className="tier-label">{tier.label}</div>
                <div className="tier-cost">{tier.cost} {'\u2728'} {'\u00b7'} +{tier.rp} RP</div>
                {!gate.ok && <div className="tier-reason">{gate.reason}</div>}
              </button>
            );
          })}
        </div>

        <button className="modal-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
