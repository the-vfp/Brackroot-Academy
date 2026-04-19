import { useState } from 'react';
import { useStore } from '../../store.jsx';
import { EVENTS } from '../../data/events.js';
import EventModal from './EventModal.jsx';

export default function Events() {
  const { canPurchaseEvent, isEventPurchased } = useStore();
  const [openEventId, setOpenEventId] = useState(null);

  const groups = { available: [], locked: [], purchased: [] };
  for (const ev of EVENTS) {
    if (isEventPurchased(ev.id)) groups.purchased.push(ev);
    else if (canPurchaseEvent(ev.id).ok) groups.available.push(ev);
    else groups.locked.push(ev);
  }

  function renderCard(ev, status) {
    const gate = canPurchaseEvent(ev.id);
    const purchased = status === 'purchased';
    return (
      <button
        key={ev.id}
        className={`event-card ${status}`}
        onClick={() => setOpenEventId(ev.id)}
      >
        <div className="event-card-title">{ev.title}</div>
        <div className="event-card-meta">
          {purchased
            ? `\u2713 Purchased`
            : `${ev.cost} \u2728`
          }
        </div>
        {status === 'locked' && !purchased && (
          <div className="event-card-reason">{gate.reason}</div>
        )}
      </button>
    );
  }

  return (
    <>
      <div className="section-title">Narrative Events</div>

      {groups.available.length > 0 && (
        <>
          <div className="event-group-label">Available</div>
          <div className="event-list">
            {groups.available.map(ev => renderCard(ev, 'available'))}
          </div>
        </>
      )}

      {groups.locked.length > 0 && (
        <>
          <div className="event-group-label">Locked</div>
          <div className="event-list">
            {groups.locked.map(ev => renderCard(ev, 'locked'))}
          </div>
        </>
      )}

      {groups.purchased.length > 0 && (
        <>
          <div className="event-group-label">Experienced</div>
          <div className="event-list">
            {groups.purchased.map(ev => renderCard(ev, 'purchased'))}
          </div>
        </>
      )}

      {EVENTS.length === 0 && (
        <div className="history-empty">No events yet.</div>
      )}

      {openEventId && (
        <EventModal
          eventId={openEventId}
          onClose={() => setOpenEventId(null)}
        />
      )}
    </>
  );
}
