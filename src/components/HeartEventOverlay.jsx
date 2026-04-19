import { useState } from 'react';
import { CHARACTER_DEFS } from '../data/characters.js';

// Visual-novel-style scene for heart events.
// Three layers:
//   1. Background — optional image at /art/backgrounds/{key}.webp; falls back to gradient.
//   2. Character — /art/characters/{id}.webp; falls back to the character's emoji portrait.
//   3. Dialog box — bottom third of the screen, speaker tab above, scrolling body text.
export default function HeartEventOverlay({ characterId, level, title, text, background, onClose }) {
  const def = CHARACTER_DEFS[characterId];

  const bgUrl = background
    ? `${import.meta.env.BASE_URL}art/backgrounds/${background}.webp`
    : null;
  const charUrl = characterId
    ? `${import.meta.env.BASE_URL}art/characters/${characterId}.webp`
    : null;

  return (
    <div className="scene-overlay">
      <SceneBackground url={bgUrl} />
      <SceneCharacter url={charUrl} def={def} />

      <div className="scene-dialog">
        <div className="scene-speaker-tab">
          <span className="scene-speaker-badge">{def?.portrait || '\u2728'}</span>
          <span className="scene-speaker-name">{def?.name || 'Unknown'}</span>
          <span className="scene-speaker-level">Lv {level}</span>
        </div>

        <div className="scene-body">
          <div className="scene-title">{title}</div>
          <div className="scene-text">
            {renderNarrative(text, def?.name, level)}
          </div>
        </div>

        <button className="scene-continue" onClick={onClose}>
          Continue {'\u2192'}
        </button>
      </div>
    </div>
  );
}

function SceneBackground({ url }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return <div className="scene-background scene-background--fallback" />;
  }
  return (
    <>
      <div
        className="scene-background"
        style={{ backgroundImage: `url("${url}")` }}
      />
      {/* Hidden img used to detect load failure without flashing a broken image. */}
      <img
        src={url}
        alt=""
        aria-hidden
        style={{ display: 'none' }}
        onError={() => setFailed(true)}
      />
    </>
  );
}

function SceneCharacter({ url, def }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return (
      <div className="scene-character scene-character--fallback">
        <div className="scene-character-emoji">{def?.portrait || '\u2728'}</div>
      </div>
    );
  }
  return (
    <div className="scene-character">
      <img
        src={url}
        alt={def?.name || ''}
        className="scene-character-img"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function renderNarrative(text, charName, level) {
  if (!text) {
    return (
      <p className="scene-paragraph scene-placeholder">
        [{charName} {'\u2014'} Lv {level} heart event {'\u2014'} to be written]
      </p>
    );
  }
  return text.split(/\n\n+/).map((para, i) => (
    <p key={i} className="scene-paragraph">{para}</p>
  ));
}
