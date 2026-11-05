import { useState } from 'react';
import { useApp } from '../hooks/useApp.js';
import { canManageAppointment } from '../state/appointments.js';
import Field from './Field.jsx';
import Modal from './Modal.jsx';

const AppointmentDialog = ({ appointment, mode, onClose, onSaved }) => {
  const { now, updateTopic, setStatus, setFeedback } = useApp();
  const [form, setForm] = useState({ subject: appointment.subject, topic: appointment.topic || '', description: appointment.description || '' });
  const [error, setError] = useState('');
  const editing = mode === 'edit';
  const editable = canManageAppointment(appointment, appointment.slot, now);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!editable) return setError('This appointment can no longer be changed.');
    if (editing && (!form.subject.trim() || !form.topic.trim())) return setError('Subject and topic are required.');
    const result = editing
      ? updateTopic(appointment.id, { subject: form.subject.trim(), topic: form.topic.trim(), description: form.description.trim() })
      : setStatus(appointment.id, 'cancelled');
    if (!result.ok) return setError(result.error);
    setFeedback(editing ? 'Topic updated in-place.' : 'Consultation cancelled. The time is available for other students.');
    onSaved(mode);
  };

  return (
    <Modal
      title={editing ? 'Edit Consultation Topic' : 'Cancel Consultation?'}
      description={editing ? `Update notes for your upcoming session with ${appointment.faculty.name}.` : 'Are you sure? This frees up the slot for other students. You can request another time afterwards.'}
      className={editing ? 'topic-dialog' : 'cancel-dialog'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate>
        {error && <p className="form-error" role="alert">{error}</p>}
        {!editable && <p className="notice warn">Changes are available only before a pending or confirmed consultation starts.</p>}
        {editing && <>
          <Field name="topic" label="Topic / Discussion Goal" value={form.topic} onChange={handleChange} autoFocus disabled={!editable} />
          <details className="additional-notes">
            <summary>Course and preparation notes</summary>
            <Field name="subject" label="Subject / course" value={form.subject} onChange={handleChange} disabled={!editable} />
            <Field name="description" label="Preparation notes" as="textarea" value={form.description} onChange={handleChange} disabled={!editable} />
          </details>
        </>}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose} autoFocus={!editing}>{editing ? 'Cancel' : 'Keep Appointment'}</button>
          <button type="submit" className={`btn ${editing ? 'primary' : 'danger'}`} disabled={!editable}>{editing ? 'Save Changes' : 'Yes, Cancel Consultation'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default AppointmentDialog;
