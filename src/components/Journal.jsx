import { useState } from 'react';
import { useStore } from '../store.jsx';
import { CHARACTER_DEFS, RP_THRESHOLDS, MAX_LEVEL, PLAYABLE_CHARACTER_IDS, getTitle } from '../data/characters.js';
import { INTERACTION_TIERS } from '../data/interactions.js';
import HeartEventOverlay from './HeartEventOverlay.jsx';

function formatDate(ts) {
  const d = new Date(ts);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

export default function Journal() {
  const {
    getCharacterState,
    getInteractionsForCharacter,
    getHeartEventsForCharacter,
    getHeartEventContent
  } = useStore();

  const [expandedId, setExpandedId] = useState(null);
  const [replay, setReplay] = useState(null);

  const unlocked = PLAYABLE_CHARACTER_IDS
    .map(id => ({ id, def: CHARACTER_DEFS[id], state: getCharacterState(id) }))
    .filter(x => x.state?.unlocked);

  if (unlocked.length === 0) {
    return (
      <div className="tab-view active">
        <div className="section-title">{'\u{1F4D6}'} Journal</div>
        <div className="placeholder-card">
          <div className="placeholder-title">No one to write about yet.</div>
          <p className="placeholder-body">
            Unlock a character through an Event, and the Journal starts filling itself.
          </p>
        </div>
      </div>
    );
  }

  function openReplay(characterId, level) {
    const he = getHeartEventContent(characterId, level);
    setReplay({
      characterId,
      level,
      title: getTitle(characterId, level),
      text: he?.text ?? null,
      background: he?.background ?? null
    });
  }

  return (
    <div className="tab-view active">
      <div className="section-title">{'\u{1F4D6}'} Journal</div>

      {unlocked.map(({ id, def, state }) => {
        const title = getTitle(id, state.level);
        const threshold = state.level < MAX_LEVEL ? RP_THRESHOLDS[state.level] : null;
        const rpPct = threshold ? Math.min(100, (state.rpTowardNext / threshold) * 100) : 100;
        const expanded = expandedId === id;
        const interactions = getInteractionsForCharacter(id);
        const heartEvts = getHeartEventsForCharacter(id);

        return (
          <div key={id} className={`journal-card ${expanded ? 'expanded' : ''}`}>
            <button className="journal-card-header" onClick={() => setExpandedId(expanded ? null : id)}>
              <div className="journal-portrait">{def.portrait}</div>
              <div className="journal-heading">
                <div className="journal-name">{def.name}</div>
                <div className="journal-title">{title}</div>
                <div className="journal-level">
                  Lv {state.level}/{MAX_LEVEL}
                  {threshold && ` \u00b7 ${state.rpTowardNext}/${threshold} RP`}
                  {!threshold && ' \u00b7 Capstone'}
                </div>
                <div className="journal-progress-bar">
                  <div className="journal-progress-fill" style={{ width: `${rpPct}%` }} />
                </div>
              </div>
              <div className="journal-chevron">{expanded ? '\u2303' : '\u2304'}</div>
            </button>

            {expanded && (
              <div className="journal-card-body">
                {heartEvts.length > 0 && (
                  <>
                    <div className="journal-subhead">Heart Events</div>
                    <div className="journal-heart-list">
                      {heartEvts.map(h => (
                        <button
                          key={h.level}
                          className="journal-heart-item"
                          onClick={() => openReplay(id, h.level)}
                        >
                          <span className="journal-heart-level">Lv {h.level}</span>
                          <span className="journal-heart-title">{getTitle(id, h.level)}</span>
                          <span className="journal-heart-date">{formatDate(h.timestamp)}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {interactions.length > 0 && (
                  <>
                    <div className="journal-subhead">Recent Interactions</div>
                    <div className="journal-interaction-list">
                      {interactions.slice(0, 20).map(i => (
                        <div key={i.id} className="journal-interaction-item">
                          <span className="journal-interaction-tier">
                            {INTERACTION_TIERS[i.tier].icon} {INTERACTION_TIERS[i.tier].label}
                          </span>
                          <span className="journal-interaction-line">{i.line}</span>
                          <span className="journal-interaction-date">{formatDate(i.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {heartEvts.length === 0 && interactions.length === 0 && (
                  <div className="history-empty">No memories yet. Go say hi.</div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {replay && (
        <HeartEventOverlay
          characterId={replay.characterId}
          level={replay.level}
          title={replay.title}
          text={replay.text}
          background={replay.background}
          onClose={() => setReplay(null)}
        />
      )}
    </div>
  );
}
