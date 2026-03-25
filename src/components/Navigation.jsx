const TABS = [
  { id: 'campus', icon: '\u{1F3F0}', label: 'Campus' },
  { id: 'spend', icon: '\u{1FA99}', label: 'Spend' },
  { id: 'eat', icon: '\u{1F37D}\uFE0F', label: 'Eat' },
  { id: 'habits', icon: '\u2728', label: 'Habits' },
  { id: 'budget', icon: '\u2696\uFE0F', label: 'Budget' },
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
