import { useState } from 'react';
import { useApp } from '../hooks/useApp.js';
import { facultyTransitions } from '../state/availability.js';
import { TODAY } from '../data/initialData.js';

const STATUS_LABELS = {
  confirmed: 'Accept request',
  declined: 'Decline request',
  completed: 'Mark completed',
  cancelled: 'Cancel consultation',
};

const StatusActions = ({ appointment, compact = false }) => {
  const { updateFacultyStatus, getSlot, setFeedback } = useApp();
  const [confirming, setConfirming] = useState(null);
  const [error, setError] = useState('');
  const statuses = facultyTransitions(appointment, getSlot(appointment.slotId), TODAY);

  const handleApply = (status) => {
    const result = updateFacultyStatus(appointment.id, status);
    setConfirming(null);
    if (!result.ok) return setError(result.error);
    setError('');
    setFeedback(`Consultation is now ${status}. Demo changes reset on reload.`);
  };
  const handleStatusChange = (status) => {
    if (['declined', 'cancelled'].includes(status)) {
      setConfirming(status);
      return;
    }
    handleApply(status);
  };

  return (
    <div className={compact ? 'btn-row' : 'stack'}>
      {error && <p className="form-error" role="alert">{error}</p>}
      {confirming ? (
        <div className="notice warn" role="group" aria-label="Confirm status change">
          <p>{STATUS_LABELS[confirming]}? The student's reserved time will be released.</p>
          <div className="btn-row">
            <button type="button" autoFocus className="btn" onClick={() => setConfirming(null)}>Keep request</button>
            <button type="button" className="btn danger" onClick={() => handleApply(confirming)}>
              Confirm {confirming === 'declined' ? 'decline' : 'cancellation'}
            </button>
          </div>
        </div>
      ) : statuses.map((status) => (
        <button type="button" key={status} className={`btn ${status === 'confirmed' ? 'primary' : ''}`} onClick={() => handleStatusChange(status)}>
          {STATUS_LABELS[status]}
        </button>
      ))}
      {!compact && appointment.status === 'confirmed' && !statuses.includes('completed') && (
        <p className="muted small">Completion becomes available the day after the consultation (demo clock: {TODAY}).</p>
      )}
    </div>
  );
};

export default StatusActions;
