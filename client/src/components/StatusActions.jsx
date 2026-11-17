import { useState } from 'react';
import { useApp } from '../hooks/useApp.js';
import { AUTO_DECLINED_FACULTY_MESSAGE, formatDeadline, facultyTransitions } from '../utils/presentation.js';

const STATUS_LABELS = {
    confirmed: 'Accept request',
    declined: 'Decline request',
    completed: 'Mark completed',
    cancelled: 'Cancel consultation',
};

function StatusActions({ appointment, compact = false }) {
    const { now, updateFacultyStatus, getSlot, setFeedback } = useApp();
    const [confirming, setConfirming] = useState(null);
    const [error, setError] = useState('');
    const slot = getSlot(appointment.slotId);
    const statuses = facultyTransitions(appointment, slot, now);

    async function handleApply(status) {
        const result = await updateFacultyStatus(appointment.id, status);
        setConfirming(null);
        if (!result.ok) {
            setError(result.error);
            return;
        }
        setError('');
        setFeedback(`Consultation is now ${status}.`);
    }

    function handleStatusChange(status) {
        if (['declined', 'cancelled'].includes(status)) {
            setConfirming(status);
            return;
        }
        handleApply(status);
    }

    if (appointment.autoDeclined) {
        return (
            <div className="stack">
                <p className="notice warn" role="status">{AUTO_DECLINED_FACULTY_MESSAGE}</p>
                <div className={compact ? 'btn-row' : 'stack'}>
                    <button type="button" className="btn primary" disabled>{STATUS_LABELS.confirmed}</button>
                    <button type="button" className="btn" disabled>{STATUS_LABELS.declined}</button>
                </div>
            </div>
        );
    }

    return (
        <div className={compact ? 'btn-row' : 'stack'}>
            {error && <p className="form-error" role="alert">{error}</p>}
            {confirming ? (
                <div className="notice warn status-confirmation" role="group" aria-label="Confirm status change">
                    <p>{STATUS_LABELS[confirming]}? The student's reserved time will be released.</p>
                    <div className="btn-row">
                        <button
                            type="button"
                            autoFocus
                            className="btn"
                            onClick={function () { setConfirming(null); }}
                        >
                            Keep request
                        </button>
                        <button
                            type="button"
                            className="btn danger"
                            onClick={function () { handleApply(confirming); }}
                        >
                            Confirm {confirming === 'declined' ? 'decline' : 'cancellation'}
                        </button>
                    </div>
                </div>
            ) : (
                statuses.map(function (status) {
                    return (
                        <button
                            type="button"
                            key={status}
                            className={`btn ${status === 'confirmed' ? 'primary' : ''}`}
                            onClick={function () { handleStatusChange(status); }}
                        >
                            {STATUS_LABELS[status]}
                        </button>
                    );
                })
            )}
            {!compact && appointment.status === 'pending' && statuses.length > 0 && (
                <p className="muted small">
                    Accept or decline by {formatDeadline(slot)}. After that the request is automatically declined.
                </p>
            )}
            {!compact && appointment.status === 'confirmed' && !statuses.includes('completed') && (
                <p className="muted small">
                    Completion becomes available when the consultation ends.
                </p>
            )}
        </div>
    );
}

export default StatusActions;
