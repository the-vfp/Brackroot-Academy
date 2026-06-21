import { useState } from 'react';
import { useStore } from '../store.jsx';
import { CHARACTER_DEFS, RP_THRESHOLDS, MAX_LEVEL, PLAYABLE_CHARACTER_IDS, getTitle } from '../data/characters.js';
import { INTERACTION_TIERS } from '../data/interactions.js';
import HeartEventOverlay from './HeartEventOverlay.jsx';
import CharacterCrest from './CharacterCrest.jsx';
import Flower from './Flower.jsx';

// Per-character colour triads (fill · deep outline/text · soft tint · AA ink).
// Pale leads (Diana, Richard) carry an -ink so their type stays readable on cream.
const CHAR_COLORS = {
  marlow:  { base: 'var(--bk-marlow)',  soft: 'var(--bk-marlow-soft)',  ink: 'var(--bk-marlow-deep)' },
  brendan: { base: 'var(--bk-brendan)', soft: 'var(--bk-brendan-soft)', ink: 'var(--bk-brendan-deep)' },
  diana:   { base: 'var(--bk-diana)',   soft: 'var(--bk-diana-soft)',   ink: 'var(--bk-diana-ink)' },
  peter:   { base: 'var(--bk-peter)',   soft: 'var(--bk-peter-soft)',   ink: 'var(--bk-peter-deep)' },
  richard: { base: 'var(--bk-richard)', soft: 'var(--bk-richard-soft)', ink: 'var(--bk-richard-ink)' },
  sophia:  { base: 'var(--bk-sophia)',  soft: 'var(--bk-sophia-soft)',  ink: 'var(--bk-sophia-deep)' },
};

function formatDate(ts) {
  const d = new Date(ts);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}

// A row of level pips — small pixel hearts, filled up to the current level.
function HeartPips({ level, color }) {
  return (
    <span className="journal-hearts" aria-label={`Level ${level} of ${MAX_LEVEL}`}>
      {Array.from({ length: MAX_LEVEL }, (_, i) => (
        <svg key={i} viewBox="0 0 7 6" width="11" height="10" style={{ shapeRendering: 'crispEdges' }}>
          <g fill={i < level ? color : 'var(--bk-border)'} opacity={i < level ? 1 : 0.5}>
            <rect x="1" y="0" width="2" height="1" />
            <rect x="4" y="0" width="2" height="1" />
            <rect x="0" y="1" width="7" height="2" />
            <rect x="1" y="3" width="5" height="1" />
            <rect x="2" y="4" width="3" height="1" />
            <rect x="3" y="5" width="1" height="1" />
          </g>
        </svg>
      ))}
    </span>
  );
}

export default function JournalCharacters() {
  const {
    getCharacterState,
    getInteractionsForCharacter,
    getHeartEventsForCharacter,
    getHeartEventContent,
  } = useStore();

  const [expandedId, setExpandedId] = useState(null);
  const [replay, setReplay] = useState(null);

  const roster = PLAYABLE_CHARACTER_IDS
    .map(id => ({ id, def: CHARACTER_DEFS[id], state: getCharacterState(id) }))
    .filter(x => x.state?.unlocked);

  if (roster.length === 0) {
    return (
      <div className="tab-view active">
        <div className="journal-header">
          <span className="journal-header-title">The Journal</span>
          <span className="journal-header-count">0 / 6 blooms</span>
        </div>
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
      background: he?.background ?? null,
    });
  }

  return (
    <div className="tab-view active">
      <div className="journal-header">
        <span className="journal-header-title">The Journal</span>
        <span className="journal-header-count">{roster.length} / 6 blooms</span>
      </div>

      {roster.map(({ id, def, state }) => {
        const c = CHAR_COLORS[id] || CHAR_COLORS.marlow;
        const title = getTitle(id, state.level);
        const threshold = state.level < MAX_LEVEL ? RP_THRESHOLDS[state.level] : null;
        const rpPct = threshold ? Math.min(100, (state.rpTowardNext / threshold) * 100) : 100;
        const expanded = expandedId === id;
        const interactions = getInteractionsForCharacter(id);
        const heartEvts = getHeartEventsForCharacter(id);
        const firstName = def.name.split(' ')[0];

        return (
          <div
            key={id}
            className={`journal-card bk-frame ${expanded ? 'expanded' : ''}`}
            style={{ '--bk-frame-band-color': c.base }}
          >
            <button className="journal-card-header" onClick={() => setExpandedId(expanded ? null : id)}>
              <CharacterCrest letter={firstName[0]} color={c.base} symbol={def.portrait} size={56} />
              <div className="journal-heading">
                <div className="journal-name">{firstName}</div>
                <div className="journal-title" style={{ color: c.ink }}>
                  Lv {state.level} {'·'} {title}
                </div>
                <HeartPips level={state.level} color={c.base} />
                <div className="journal-progress-bar">
                  <div className="journal-progress-fill" style={{ width: `${rpPct}%`, background: c.base }} />
                </div>
                <div className="journal-rp-label">
                  {threshold ? `${state.rpTowardNext} / ${threshold} RP` : 'Capstone — full bloom'}
                </div>
              </div>
              <div className="journal-flower-wrap">
                <Flower color={c.base} filled={heartEvts.length} total={10} size={58} />
                <span className="journal-flower-caption">{heartEvts.length}/10</span>
              </div>
            </button>

            {expanded && (
              <div className="journal-card-body">
                {heartEvts.length > 0 && (
                  <>
                    <div className="journal-subhead" style={{ color: c.ink }}>Heart Events</div>
                    <div className="journal-heart-list">
                      {heartEvts.map(h => (
                        <button
                          key={h.level}
                          className="journal-heart-item"
                          style={{ '--bk-frame-band-color': c.base }}
                          onClick={() => openReplay(id, h.level)}
                        >
                          <span className="journal-heart-level" style={{ color: c.ink }}>Lv {h.level}</span>
                          <span className="journal-heart-title">{getTitle(id, h.level)}</span>
                          <span className="journal-heart-date">{formatDate(h.timestamp)}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {interactions.length > 0 && (
                  <>
                    <div className="journal-subhead" style={{ color: c.ink }}>Recent Interactions</div>
                    <div className="journal-interaction-list">
                      {interactions.slice(0, 20).map(i => (
                        <div key={i.id} className="journal-interaction-item">
                          <span className="journal-interaction-tier" style={{ color: c.ink }}>
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
