import { useState } from 'react';
import { useStore } from '../../store.jsx';
import { useToast } from '../Toast.jsx';
import { getEvent } from '../../data/events.js';
import { CHARACTER_DEFS, getTitle } from '../../data/characters.js';
import { getHeartEvent } from '../../data/heartEvents/index.js';
import HeartEventOverlay from '../HeartEventOverlay.jsx';

export default function EventModal({ eventId, onClose }) {
  const { canPurchaseEvent, isEventPurchased, purchaseEvent } = useStore();
  const showToast = useToast();
  const [pendingHeartEvent, setPendingHeartEvent] = useState(null);
  const [showFlavor, setShowFlavor] = useState(false);

  const ev = getEvent(eventId);
  if (!ev) return null;

  const purchased = isEventPurchased(eventId);
  const gate = canPurchaseEvent(eventId);

  async function handlePurchase() {
    const r = await purchaseEvent(eventId);
    if (!r.ok) {
      showToast(r.reason);
      return;
    }
    if (ev.unlocks?.type === 'character') {
      const def = CHARACTER_DEFS[ev.unlocks.characterId];
      showToast(`\u2728 ${def?.name || ev.unlocks.characterId} has entered the Academy.`);
    }
    // If the event unlocks a character, play the L1 heart event; otherwise show
    // the event's own flavor text ceremony (non-character-unlock events only).
    if (r.heartEvent) {
      setPendingHeartEvent(r.heartEvent);
    } else {
      setShowFlavor(true);
    }
  }

  // Replaying a purchased event: character-unlock → heart event; flavor event → flavor.
  function handleReplay() {
    if (ev.unlocks?.type === 'character') {
      setPendingHeartEvent({
        characterId: ev.unlocks.characterId,
        level: 1,
        title: getTitle(ev.unlocks.characterId, 1),
        text: getHeartEvent(ev.unlocks.characterId, 1)
      });
    } else {
      setShowFlavor(true);
    }
  }

  if (pendingHeartEvent) {
    return (
      <HeartEventOverlay
        characterId={pendingHeartEvent.characterId}
        level={pendingHeartEvent.level}
        title={pendingHeartEvent.title}
        text={pendingHeartEvent.text}
        onClose={onClose}
      />
    );
  }

  if (showFlavor) {
    return (
      <div className="heart-event-overlay" onClick={onClose}>
        <div className="heart-event-frame" onClick={e => e.stopPropagation()}>
          <div className="heart-event-level-tag">Event</div>
          <div className="heart-event-title">{ev.title}</div>
          <div className="heart-event-body">
            {renderFlavor(ev.flavor)}
          </div>
          <button className="heart-event-continue" onClick={onClose}>
            Continue {'\u2192'}
          </button>
        </div>
      </div>
    );
  }

  // Purchase confirm / replay entry screen.
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal event-confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="event-confirm-title">{ev.title}</div>
        <div className="event-confirm-cost">
          {purchased ? '\u2713 Purchased' : `${ev.cost} \u2728`}
        </div>

        {ev.unlocks?.type === 'character' && (() => {
          const def = CHARACTER_DEFS[ev.unlocks.characterId];
          return (
            <div className="event-confirm-unlocks">
              {purchased ? `Met ${def?.name || ev.unlocks.characterId}` : `Unlocks ${def?.name || ev.unlocks.characterId}`}
            </div>
          );
        })()}

        {purchased ? (
          <button className="btn-primary" onClick={handleReplay}>
            {'\u2726'} Replay
          </button>
        ) : gate.ok ? (
          <button className="btn-primary" onClick={handlePurchase}>
            {'\u2726'} Purchase
          </button>
        ) : (
          <div className="event-confirm-locked">{gate.reason}</div>
        )}
        <button className="modal-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function renderFlavor(text) {
  if (!text) return <em>[to be written]</em>;
  return text.split(/\n\n+/).map((para, i) => (
    <p key={i} className="heart-event-paragraph">{para}</p>
  ));
}
