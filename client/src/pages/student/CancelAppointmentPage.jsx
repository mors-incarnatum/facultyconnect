import { canManageAppointment } from '../../state/appointments.js';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp.js';
import PageHead from '../../components/PageHead.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { fmtLong, fmtRange } from '../../utils/format.js';
import { useAppointment } from '../../hooks/useAppointments.js';
import AppointmentNotFound from '../../components/AppointmentNotFound.jsx';
import { topicLine } from '../../utils/presentation.js';

export default function CancelAppointmentPage() {
  const a = useAppointment();
  const { now, setStatus } = useApp();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  if (!a) return <AppointmentNotFound />;
  const active = canManageAppointment(a, a.slot, now);

  const handleCancel = () => {
    const result = setStatus(a.id, 'cancelled');
    if (!result.ok) return setError(result.error);
    navigate(`/student/appointments?id=${a.id}`, {
      state: { feedback: 'Appointment cancelled in this demo. Changes reset on reload.' },
    });
  };
  return (
    <>
      <PageHead title="Cancel this appointment?" subtitle="The time slot will become available to other students." />
      <div className="card">
        {error && <p className="form-error" role="alert">{error}</p>}
        <StatusBadge status={a.status} />
        <h2 style={{ fontSize: 26, margin: "14px 0 6px" }}>{a.faculty.name}</h2>
        <p style={{ fontWeight: 600 }}>{fmtLong(a.slot.date)} · {fmtRange(a.slot.start, a.slot.end)}</p>
        <p className="muted" style={{ margin: "6px 0 18px" }}>{topicLine(a)}</p>
        {active ? (
          <>
            <div className="notice warn">Cancelling lets {a.faculty.name} know you can no longer attend. You can request another time afterwards.</div>
            <div className="btn-row">
              <button className="btn danger" onClick={handleCancel}>Confirm cancellation</button>
              <Link className="btn" to={`/student/appointments?id=${a.id}`}>Keep appointment</Link>
            </div>
          </>
        ) : (
          <><p>This appointment can no longer be cancelled. Cancellation is available before an active consultation starts.</p><div className="btn-row"><Link className="btn" to={`/student/appointments?id=${a.id}`}>Back</Link></div></>
        )}
      </div>
    </>
  );
}
