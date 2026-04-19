import { CHARACTER_DEFS } from '../data/characters.js';

// Full-screen visual-novel-style narrative display.
// Shown on level-up (after the interaction line) and for event replays from Journal.
// Character art will slot in here once assets land; for now, portrait emoji.
export default function HeartEventOverlay({ characterId, level, title, text, onClose }) {
  const def = CHARACTER_DEFS[characterId];

  return (
    <div className="heart-event-overlay" onClick={onClose}>
      <div className="heart-event-frame" onClick={e => e.stopPropagation()}>
        <div className="heart-event-portrait-wrap">
          <div className="heart-event-portrait">{def?.portrait || '\u{1F319}'}</div>
        </div>
        <div className="heart-event-level-tag">{def?.name} {'\u00b7'} Lv {level}</div>
        <div className="heart-event-title">{title}</div>
        <div className="heart-event-body">
          {renderNarrative(text, def?.name, level)}
        </div>
        <button className="heart-event-continue" onClick={onClose}>
          Continue {'\u2192'}
        </button>
      </div>
    </div>
  );
}

// Split multi-paragraph text on blank lines. Render null as a visible placeholder.
function renderNarrative(text, charName, level) {
  if (!text) {
    return (
      <p className="heart-event-paragraph heart-event-placeholder">
        [{charName} {'\u2014'} Lv {level} heart event {'\u2014'} to be written]
      </p>
    );
  }
  return text.split(/\n\n+/).map((para, i) => (
    <p key={i} className="heart-event-paragraph">{para}</p>
  ));
}
