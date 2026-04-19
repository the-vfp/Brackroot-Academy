import { useState } from 'react';
import Map from './Map.jsx';
import Events from './Events.jsx';
import Challenges from './Challenges.jsx';

const SUBPAGES = [
  { id: 'map',        label: 'Map' },
  { id: 'events',     label: 'Events' },
  { id: 'challenges', label: 'Challenges' },
];

export default function Campus() {
  const [subPage, setSubPage] = useState('map');

  return (
    <div className="tab-view active">
      <div className="campus-subnav">
        {SUBPAGES.map(p => (
          <button
            key={p.id}
            className={`campus-subnav-btn ${subPage === p.id ? 'active' : ''}`}
            onClick={() => setSubPage(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
      {subPage === 'map' && <Map />}
      {subPage === 'events' && <Events />}
      {subPage === 'challenges' && <Challenges />}
    </div>
  );
}
