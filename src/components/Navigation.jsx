// The five-place pixel-emoji bottom nav (Design handoff sprites, 16px grid).
// IA decided 2026-06-20: Hearth · Ledger · Journal · Campus · Tend.
// (Wind stays a Journal sub-page; habits+tasks stay under Tend.)

function NavSprite({ name }) {
  const p = { viewBox: '0 0 16 16', shapeRendering: 'crispEdges' };
  switch (name) {
    case 'hearth':
      return (
        <svg {...p}>
          <g fill="#C0603F"><rect x="7" y="2" width="2" height="1" /><rect x="6" y="3" width="4" height="1" /><rect x="5" y="4" width="6" height="1" /><rect x="4" y="5" width="8" height="1" /><rect x="3" y="6" width="10" height="1" /></g>
          <rect x="4" y="7" width="8" height="7" fill="#F3E3C4" />
          <g fill="#7A4A2E"><rect x="7" y="10" width="2" height="4" /><rect x="4" y="14" width="8" height="1" /></g>
          <g fill="#E9B949"><rect x="5" y="8" width="2" height="2" /><rect x="9" y="8" width="2" height="2" /></g>
        </svg>
      );
    case 'ledger':
      return (
        <svg {...p}>
          <g fill="#E6C690"><rect x="3" y="2" width="10" height="2" /><rect x="3" y="12" width="10" height="2" /></g>
          <g fill="#C9A86A"><rect x="3" y="4" width="10" height="1" /><rect x="3" y="11" width="10" height="1" /><rect x="2" y="2" width="1" height="3" /><rect x="13" y="2" width="1" height="3" /><rect x="2" y="11" width="1" height="3" /><rect x="13" y="11" width="1" height="3" /></g>
          <rect x="4" y="5" width="8" height="6" fill="#F3E3C4" />
          <g fill="#A6917A"><rect x="6" y="6" width="4" height="1" /><rect x="6" y="8" width="4" height="1" /></g>
          <g fill="#E6C690"><rect x="2" y="3" width="1" height="1" /><rect x="13" y="3" width="1" height="1" /><rect x="2" y="12" width="1" height="1" /><rect x="13" y="12" width="1" height="1" /></g>
        </svg>
      );
    case 'journal':
      return (
        <svg {...p}>
          <g fill="#EC9BB0"><rect x="7" y="2" width="2" height="4" /><rect x="7" y="10" width="2" height="4" /><rect x="2" y="7" width="4" height="2" /><rect x="10" y="7" width="4" height="2" /><rect x="4" y="4" width="2" height="2" /><rect x="10" y="4" width="2" height="2" /><rect x="4" y="10" width="2" height="2" /><rect x="10" y="10" width="2" height="2" /></g>
          <g fill="#F6C9D6"><rect x="7" y="2" width="2" height="1" /><rect x="7" y="13" width="2" height="1" /><rect x="2" y="7" width="1" height="2" /><rect x="13" y="7" width="1" height="2" /></g>
          <rect x="6" y="6" width="4" height="4" fill="#E9B949" />
          <rect x="7" y="7" width="2" height="2" fill="#C9952F" />
        </svg>
      );
    case 'campus':
      return (
        <svg {...p}>
          <g fill="#D8C3A6"><rect x="5" y="4" width="1" height="1" /><rect x="7" y="4" width="1" height="1" /><rect x="9" y="4" width="1" height="1" /><rect x="5" y="5" width="6" height="9" /></g>
          <rect x="10" y="5" width="1" height="9" fill="#BFA77F" />
          <g fill="#7A4A2E"><rect x="8" y="1" width="1" height="4" /><rect x="7" y="11" width="2" height="3" /></g>
          <g fill="#C0603F"><rect x="9" y="1" width="3" height="1" /><rect x="9" y="2" width="2" height="1" /></g>
          <rect x="7" y="7" width="2" height="2" fill="#E9B949" />
        </svg>
      );
    case 'tend':
    default:
      // a sprouting seedling — tending habits + tasks
      return (
        <svg {...p}>
          <g fill="#7A4A2E"><rect x="7" y="8" width="2" height="6" /></g>
          <g fill="#6E8A4E"><rect x="3" y="5" width="2" height="1" /><rect x="4" y="6" width="3" height="1" /><rect x="2" y="6" width="1" height="1" /><rect x="5" y="7" width="2" height="1" /></g>
          <g fill="#6E8A4E"><rect x="11" y="5" width="2" height="1" /><rect x="9" y="6" width="3" height="1" /><rect x="13" y="6" width="1" height="1" /><rect x="9" y="7" width="2" height="1" /></g>
          <g fill="#8FB16A"><rect x="7" y="3" width="2" height="2" /><rect x="6" y="5" width="4" height="2" /></g>
          <rect x="7" y="2" width="2" height="1" fill="#E9B949" />
          <g fill="#C9B79C"><rect x="4" y="14" width="8" height="1" /></g>
        </svg>
      );
  }
}

const TABS = [
  { id: 'hearth',  label: 'Hearth' },
  { id: 'ledger',  label: 'Ledger' },
  { id: 'journal', label: 'Journal' },
  { id: 'campus',  label: 'Campus' },
  { id: 'tend',    label: 'Tend' },
];

export default function Navigation({ activeTab, onTabChange }) {
  return (
    <nav className="nav">
      {TABS.map(tab => (
        <button
          key={tab.id}
          className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="nav-icon bk-pixel"><NavSprite name={tab.id} /></span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
