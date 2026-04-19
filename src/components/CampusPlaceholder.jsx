export default function CampusPlaceholder() {
  return (
    <div className="tab-view active">
      <div className="section-title">{'\u{1F3F0}'} Campus</div>
      <div className="placeholder-card">
        <div className="placeholder-title">The courtyards are quiet.</div>
        <p className="placeholder-body">
          A hush over Brackroot. No one on the paths yet, no lanterns lit in the dormitory windows.
          Something is coming {'\u2014'} the roster, the events, the calendar {'\u2014'} but for now, the Campus waits.
        </p>
        <p className="placeholder-hint">Coming in Phase 2.</p>
      </div>
    </div>
  );
}
