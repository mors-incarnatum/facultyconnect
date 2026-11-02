const ScheduleDraftGuard = ({ error, onSave, onDiscard, onStay }) => (
  <div className="card draft-guard" role="region" aria-label="Unsaved availability draft">
    <h2>Keep your availability changes?</h2>
    <p>Save to publish in this demo, discard the draft, or stay here.</p>
    {error && <p role="alert">{error}</p>}
    <div className="btn-row">
      <button type="button" autoFocus className="btn" onClick={onSave}>Save</button>
      <button type="button" className="btn" onClick={onDiscard}>Discard</button>
      <button type="button" className="btn" onClick={onStay}>Stay</button>
    </div>
  </div>
);

export default ScheduleDraftGuard;
