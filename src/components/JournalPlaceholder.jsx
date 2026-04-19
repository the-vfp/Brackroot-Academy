export default function JournalPlaceholder() {
  return (
    <div className="tab-view active">
      <div className="section-title">{'\u{1F4D6}'} Journal</div>
      <div className="placeholder-card">
        <div className="placeholder-title">A blank page, for now.</div>
        <p className="placeholder-body">
          The Journal will remember the people you meet and the levels between you {'\u2014'} titles, moments,
          the small scenes worth keeping. None of that exists yet. The page is still blank.
        </p>
        <p className="placeholder-hint">Coming in Phase 2.</p>
      </div>
    </div>
  );
}
