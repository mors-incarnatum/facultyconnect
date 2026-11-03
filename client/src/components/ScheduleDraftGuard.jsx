import Modal from './Modal.jsx';

const ScheduleDraftGuard = ({ error, onSave, onDiscard, onStay }) => (
  <Modal title="Keep your availability changes?" description="Save to publish, discard the draft, or stay here." onClose={onStay} className="draft-dialog">
    <section role="region" aria-label="Unsaved availability draft">
      {error && <p role="alert">{error}</p>}
      <div className="modal-actions">
        <button type="button" autoFocus className="btn primary" onClick={onSave}>Save</button>
        <button type="button" className="btn" onClick={onDiscard}>Discard</button>
        <button type="button" className="btn" onClick={onStay}>Stay</button>
      </div>
    </section>
  </Modal>
);

export default ScheduleDraftGuard;
