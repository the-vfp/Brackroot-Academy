const TABS = [
  { id: 'campus',  icon: '\u{1F3F0}',         label: 'Campus' },
  { id: 'journal', icon: '\u{1F4D6}',         label: 'Journal' },
  { id: 'ledger',  icon: '\u{1F4DC}',         label: 'Ledger' },
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
