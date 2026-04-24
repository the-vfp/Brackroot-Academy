import { useState } from 'react';
import { CHARACTER_DEFS } from '../data/characters.js';

// Visual-novel-style scene for heart events, Tears of Themis-flavored.
// Three layers + paged dialog:
//   1. Background — optional image at /art/backgrounds/{key}.webp; falls back to gradient.
//   2. Character — /art/characters/{id}.webp; falls back to the character's emoji portrait.
//   3. Dialog box — short, bottom-anchored. One paragraph per page; tap anywhere to advance.
// Dialogue paragraphs are authored as "Speaker: line text" and render with a
// speaker tab above the top-left of the box. Narration paragraphs (no speaker
// prefix) hide the tab entirely.
export default function HeartEventOverlay({ characterId, level, title, text, background, onClose }) {
  const def = CHARACTER_DEFS[characterId];
  const pages = parsePages(text);
  const [pageIdx, setPageIdx] = useState(0);

  const bgUrl = background
    ? `${import.meta.env.BASE_URL}art/backgrounds/${background}.webp`
    : null;
  const charUrl = characterId
    ? `${import.meta.env.BASE_URL}art/characters/${characterId}.webp`
    : null;

  const page = pages[pageIdx];
  const isLast = pageIdx >= pages.length - 1;

  function advance() {
    if (isLast) {
      onClose();
    } else {
      setPageIdx(i => i + 1);
    }
  }

  return (
    <div className="scene-overlay" onClick={advance} role="button" tabIndex={0}>
      <SceneBackground url={bgUrl} />
      <SceneCharacter url={charUrl} def={def} />

      <div className="scene-dialog">
        {page?.speaker && (
          <div className="scene-speaker-tab">
            <span className="scene-speaker-name">{page.speaker}</span>
          </div>
        )}

        <div className="scene-page-counter">
          {pageIdx + 1}/{pages.length}
        </div>

        <div className="scene-body">
          {pageIdx === 0 && title && (
            <div className="scene-title">{title}</div>
          )}
          <div className="scene-text">
            {page ? (
              <p className="scene-paragraph">{renderInline(page.body)}</p>
            ) : (
              <p className="scene-paragraph scene-placeholder">
                [{def?.name} {'\u2014'} Lv {level} heart event {'\u2014'} to be written]
              </p>
            )}
          </div>
        </div>

        <div className="scene-advance-hint">
          {isLast ? `Tap to close \u2713` : `Tap to continue \u203A`}
        </div>
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

// Splits the text into pages (one per paragraph). Each page may be narration
// or dialogue. A dialogue paragraph starts with "Speaker Name: " where the
// name is short (<= 32 chars) and doesn't contain a colon. Everything else
// is narration.
function parsePages(text) {
  if (!text) return [];
  const speakerRegex = /^([^:\n]{1,32}):\s+([\s\S]+)$/;
  return text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(para => {
      const m = para.match(speakerRegex);
      if (m) return { speaker: m[1].trim(), body: m[2].trim() };
      return { speaker: null, body: para };
    });
}

// Inline markdown-ish: *word* → <em>word</em>. Keeps dialogue quotes intact.
function renderInline(text) {
  const parts = [];
  const re = /\*(.+?)\*/g;
  let lastIdx = 0;
  let match;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    parts.push(<em key={`em-${key++}`}>{match[1]}</em>);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts;
}
