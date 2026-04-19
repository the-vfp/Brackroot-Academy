const TABS = [
  { id: 'campus',  icon: '\u{1F3F0}',         label: 'Campus' },
  { id: 'journal', icon: '\u{1F4D6}',         label: 'Journal' },
  { id: 'spend',   icon: '\u{1FA99}',         label: 'Spend' },
  { id: 'eat',     icon: '\u{1F37D}\uFE0F',   label: 'Eat' },
  { id: 'tend',    icon: '\u2728',            label: 'Tend' },
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
          <span className="nav-icon">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
