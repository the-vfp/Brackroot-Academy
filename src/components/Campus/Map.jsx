import { useState } from 'react';
import { useStore } from '../../store.jsx';
import { CHARACTER_DEFS, MAP_ORDER, PLAYABLE_CHARACTER_IDS, getTitle } from '../../data/characters.js';
import InteractionModal from './InteractionModal.jsx';

export default function Map() {
  const { getCharacterState } = useStore();
  const [openCharId, setOpenCharId] = useState(null);

  const playableEntries = MAP_ORDER
    .filter(id => PLAYABLE_CHARACTER_IDS.includes(id))
    .map(id => ({ id, def: CHARACTER_DEFS[id], state: getCharacterState(id) }));

  const unlocked = playableEntries.filter(x => x.state?.unlocked);
  const lockedCount = playableEntries.length - unlocked.length;

  const windDef = CHARACTER_DEFS.wind;

  return (
    <>
      <div className="section-title">The Grounds</div>

      {unlocked.length === 0 && (
        <div className="placeholder-card">
          <div className="placeholder-title">The paths are quiet.</div>
          <p className="placeholder-body">
            You don't know anyone yet. Save up Stardust, then head to <em>Events</em>
            to find out who's waiting and where.
          </p>
        </div>
      )}

      {unlocked.length > 0 && (
        <div className="location-list">
          {unlocked.map(({ id, def, state }) => {
            const title = getTitle(id, state.level);
            return (
              <button key={id} className="location-card" onClick={() => setOpenCharId(id)}>
                <div className="location-header">
                  <div className="location-name">The {def.defaultLocation}</div>
                  <div className="location-level">Lv {state.level}/10</div>
                </div>
                <div className="location-body">
                  <div className="location-portrait">{def.portrait}</div>
                  <div className="location-occupant">
                    <div className="location-character-name">{def.name}</div>
                    {title && <div className="location-character-title">{title}</div>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {lockedCount > 0 && (
        <div className="map-hint">
          {lockedCount === 1
            ? 'There is one more path you haven\u2019t walked yet.'
            : `There are ${lockedCount} more paths you haven\u2019t walked yet.`}
          {' '}Check <em>Events</em>.
        </div>
      )}

      <div className="section-title wind-section">The Wind</div>
      <div className="wind-card" aria-disabled>
        <div className="wind-portrait">{windDef.portrait}</div>
        <div className="wind-body">
          <div className="wind-name">Everywhere, and nowhere</div>
          <div className="wind-hint">{windDef.unlockHint}</div>
        </div>
      </div>

      {openCharId && (
        <InteractionModal
          characterId={openCharId}
          onClose={() => setOpenCharId(null)}
        />
      )}
    </>
  );
}
