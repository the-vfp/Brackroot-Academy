import { useState } from 'react';
import { CHARACTER_DEFS } from '../data/characters.js';

// Visual-novel-style scene for heart events, Tears of Themis-flavored.
// Four layers + paged dialog:
//   1. Background       — optional image at /art/backgrounds/{key}.webp; falls back to gradient.
//   2. NPC character    — large bust in the center, flush with top of dialog.
//   3. MC character     — smaller bust bottom-left (Ellene); only shown when her sprite is set.
//   4. Dialog box       — short, bottom-anchored. One paragraph per page; tap anywhere to advance.
//
// Script syntax (Obsidian-friendly markdown):
//   [[SpriteName.png]] Speaker: body   — dialog line; swaps speaker's sprite + speaks.
//   [[SpriteName.png]]                 — show/change directive alone on a paragraph; no beat.
//   [[hide Marlow]]  /  [[hide]]       — hide a specific character or clear both slots.
//   Speaker: body                      — dialog without sprite change.
//   (anything else)                    — narration; current sprites persist.
//
// Sprite slot routing: filenames starting with the MC_FILE_PREFIX (e.g. "Ellene*")
// go to the MC slot, everything else goes to the NPC slot. Sprites are sticky —
// once set, they persist across pages until explicitly changed or hidden.
//
// Back-compat: if a script has no [[wikilinks]] at all, the NPC slot falls back
// to the character's emoji portrait (legacy single-character events render the
// same as before).
const MC_NAME = 'Ellene';
const MC_FILE_PREFIX = 'Ellene';

export default function HeartEventOverlay({ characterId, level, title, text, background, onClose }) {
  const def = CHARACTER_DEFS[characterId];
  const pages = parsePages(text);
  const [pageIdx, setPageIdx] = useState(0);

  // Background key can be a bare stem ("campus-night" → appends .webp) or a
  // full filename with extension ("DivinesCommon.png"). Supports both so old
  // events keep working while new PascalCase art drops in as-is.
  const bgUrl = background
    ? `${import.meta.env.BASE_URL}art/backgrounds/${background.includes('.') ? background : background + '.webp'}`
    : null;

  const page = pages[pageIdx];
  const isLast = pageIdx >= pages.length - 1;

  const hasExplicitSprites = pages.some(p => p.npcSprite || p.mcSprite);
  const emojiFallback = !hasExplicitSprites && !!def;

  const npcUrl = page?.npcSprite
    ? `${import.meta.env.BASE_URL}art/characters/${page.npcSprite}`
    : null;
  const mcUrl = page?.mcSprite
    ? `${import.meta.env.BASE_URL}art/characters/${page.mcSprite}`
    : null;

  const isMcSpeaking = page?.speaker === MC_NAME;
  const isNpcSpeaking = !!page?.speaker && !isMcSpeaking;
  const npcDim = isMcSpeaking;
  const mcDim = isNpcSpeaking;

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

      {(npcUrl || emojiFallback) && (
        <SceneCharacter
          url={npcUrl}
          def={emojiFallback ? def : null}
          dim={npcDim}
        />
      )}

      {mcUrl && <SceneCharacterMc url={mcUrl} dim={mcDim} />}

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

function SceneCharacter({ url, def, dim }) {
  const [failed, setFailed] = useState(false);
  const cls = 'scene-character' + (dim ? ' scene-character--dim' : '');
  if (!url || failed) {
    if (!def) return null;
    return (
      <div className={cls + ' scene-character--fallback'}>
        <div className="scene-character-emoji">{def.portrait || '\u2728'}</div>
      </div>
    );
  }
  return (
    <div className={cls}>
      <img
        src={url}
        alt={def?.name || ''}
        className="scene-character-img"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

function SceneCharacterMc({ url, dim }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) return null;
  const cls = 'scene-character-mc' + (dim ? ' scene-character-mc--dim' : '');
  return (
    <div className={cls}>
      <img
        src={url}
        alt={MC_NAME}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

// Parse the script into an array of pages. Each page represents one tap-beat.
// Paragraphs are separated by blank lines.
//
// Paragraph patterns, in priority order:
//   1. [[hide Name]] or [[hide]]                  — hide directive, no page
//   2. [[File.png]] Speaker: body                 — dialog with sprite swap
//   3. [[File.png]]                               — show directive, no page
//   4. Speaker: body                              — dialog without sprite change
//   5. (anything else)                            — narration
//
// Directives (hide/show alone) modify the sprite state but don't produce a page;
// they apply to the next dialog/narration page and all subsequent pages.
function parsePages(text) {
  if (!text) return [];

  const hideRe = /^\[\[hide(?:\s+([A-Za-z][A-Za-z0-9_-]*))?\]\]$/;
  const dialogWithSpriteRe = /^\[\[([^\]]+\.png)\]\]\s+([^:\n]{1,32}):\s+([\s\S]+)$/;
  const showRe = /^\[\[([^\]]+\.png)\]\]$/;
  const speakerRe = /^([^:\n]{1,32}):\s+([\s\S]+)$/;

  const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  const pages = [];
  let npcSprite = null;
  let mcSprite = null;

  function routeSprite(sprite) {
    if (sprite.startsWith(MC_FILE_PREFIX)) {
      mcSprite = sprite;
    } else {
      npcSprite = sprite;
    }
  }

  for (const para of paragraphs) {
    let m;

    if ((m = para.match(hideRe))) {
      const target = m[1];
      if (!target) {
        npcSprite = null;
        mcSprite = null;
      } else if (target.toLowerCase() === MC_FILE_PREFIX.toLowerCase()) {
        mcSprite = null;
      } else if (npcSprite && npcSprite.toLowerCase().startsWith(target.toLowerCase())) {
        npcSprite = null;
      }
      continue;
    }

    if ((m = para.match(dialogWithSpriteRe))) {
      const [, sprite, speaker, body] = m;
      routeSprite(sprite);
      pages.push({ speaker: speaker.trim(), body: body.trim(), npcSprite, mcSprite });
      continue;
    }

    if ((m = para.match(showRe))) {
      routeSprite(m[1]);
      continue;
    }

    if ((m = para.match(speakerRe))) {
      const [, speaker, body] = m;
      pages.push({ speaker: speaker.trim(), body: body.trim(), npcSprite, mcSprite });
      continue;
    }

    pages.push({ speaker: null, body: para, npcSprite, mcSprite });
  }

  return pages;
}

// Inline markdown-ish: *word* -> <em>word</em>. Keeps dialogue quotes intact.
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
