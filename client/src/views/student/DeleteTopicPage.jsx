import { canManageAppointment } from '../../state/appointments.js';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp.js';
import PageHead from '../../components/PageHead.jsx';
import { useAppointment } from '../../hooks/useAppointments.js';
import AppointmentNotFound from '../../components/AppointmentNotFound.jsx';
import { topicLine } from '../../utils/presentation.js';

export default function DeleteTopicPage() {
  const a = useAppointment();
  const { now, deleteTopic } = useApp();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  if (!a) return <AppointmentNotFound />;

  const handleDelete = () => {
    const result = deleteTopic(a.id);
    if (!result.ok) return setError(result.error);
    navigate(`/student/appointments?id=${a.id}`, {
      state: { feedback: 'Topic deleted. Your appointment remains scheduled in this demo.' },
    });
  };
  return (
    <>
      <PageHead title="Delete this consultation topic?" subtitle="Your appointment will remain scheduled." />
      <div className="card">
        {error && <p className="form-error" role="alert">{error}</p>}
        {a.topic && canManageAppointment(a, a.slot, now) ? (
          <>
            <h2 style={{ fontSize: 26, marginBottom: 10 }}>{topicLine(a)}</h2>
            <p className="muted" style={{ marginBottom: 14 }}>{a.description}</p>
            <p>Deleting removes the consultation topic and description. It does not cancel your appointment.</p>
            <div className="btn-row">
              <button className="btn primary" onClick={handleDelete}>Delete topic</button>
              <Link className="btn" to={`/student/appointments?id=${a.id}`}>Keep topic</Link>
            </div>
          </>
        ) : (
          <><p>{a.topic ? "Topics can only be deleted before a pending or confirmed consultation starts." : "This appointment has no topic to delete."}</p><div className="btn-row"><Link className="btn" to={`/student/appointments?id=${a.id}`}>Back</Link></div></>
        )}
      </div>
    </>
  );
}
