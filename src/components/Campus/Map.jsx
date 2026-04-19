import { useState } from 'react';
import { useStore } from '../../store.jsx';
import { CHARACTER_DEFS, MAP_ORDER, getTitle } from '../../data/characters.js';
import InteractionModal from './InteractionModal.jsx';

export default function Map() {
  const { getCharacterState } = useStore();
  const [openCharId, setOpenCharId] = useState(null);

  return (
    <>
      <div className="section-title">The Campus</div>
      <div className="character-grid">
        {MAP_ORDER.map(id => {
          const def = CHARACTER_DEFS[id];
          const state = getCharacterState(id);
          const unlocked = !!state?.unlocked;
          const isWind = id === 'wind';
          const title = unlocked && state ? getTitle(id, state.level) : null;

          return (
            <button
              key={id}
              className={`character-card ${unlocked ? 'unlocked' : 'locked'} ${isWind ? 'wind' : ''}`}
              onClick={() => {
                if (isWind) return; // Wind has no interactions (TBD)
                setOpenCharId(id);
              }}
              disabled={isWind}
            >
              <div className="character-portrait">
                {unlocked ? def.portrait : def.silhouette}
              </div>
              <div className="character-card-body">
                <div className="character-name">
                  {unlocked ? def.name : '???'}
                </div>
                {unlocked && title && (
                  <div className="character-title">{title}</div>
                )}
                {!unlocked && (
                  <div className="character-hint">{def.unlockHint}</div>
                )}
                {unlocked && state && (
                  <div className="character-level">Lv {state.level}/10 {'\u00b7'} {def.defaultLocation}</div>
                )}
                {isWind && (
                  <div className="character-hint">{def.unlockHint}</div>
                )}
              </div>
            </button>
          );
        })}
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
