import { useState } from 'react';
import { useStore } from '../../store.jsx';
import { useToast } from '../Toast.jsx';
import { getEvent } from '../../data/events.js';
import { CHARACTER_DEFS } from '../../data/characters.js';

export default function EventModal({ eventId, onClose }) {
  const { canPurchaseEvent, isEventPurchased, purchaseEvent } = useStore();
  const showToast = useToast();
  const [ceremonyOpen, setCeremonyOpen] = useState(false);

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
    setCeremonyOpen(true);
    if (ev.unlocks?.type === 'character') {
      const def = CHARACTER_DEFS[ev.unlocks.characterId];
      showToast(`\u2728 ${def?.name || ev.unlocks.characterId} has entered the Academy.`);
    }
  }

  // Once purchased (or immediately if replaying), show the ceremony/flavor.
  if (ceremonyOpen || purchased) {
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal event-confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="event-confirm-title">{ev.title}</div>
        <div className="event-confirm-cost">{ev.cost} {'\u2728'}</div>

        {ev.unlocks?.type === 'character' && (() => {
          const def = CHARACTER_DEFS[ev.unlocks.characterId];
          return (
            <div className="event-confirm-unlocks">
              Unlocks {def?.name || ev.unlocks.characterId}
            </div>
          );
        })()}

        {gate.ok ? (
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

// Render multi-paragraph flavor text with blank-line breaks.
function renderFlavor(text) {
  if (!text) return <em>[to be written]</em>;
  return text.split(/\n\n+/).map((para, i) => (
    <p key={i} className="heart-event-paragraph">{para}</p>
  ));
}
