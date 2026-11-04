import { Link } from 'react-router-dom';
import PageHead from '../../components/PageHead.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { modeLabel, topicLine } from '../../utils/presentation.js';
import { fmtLong, fmtRange } from '../../utils/format.js';
import { useAppointment } from '../../hooks/useAppointments.js';
import AppointmentNotFound from '../../components/AppointmentNotFound.jsx';
import BookingStepper from '../../components/BookingStepper.jsx';

export default function RequestSubmittedPage() {
  const a = useAppointment();
  if (!a) return <AppointmentNotFound />;
  return (
    <>
      <PageHead title={a.status === "pending" ? "Your request has been sent" : "Your consultation request"} subtitle={a.status === "pending" ? "Your time is reserved while you wait for faculty approval." : "View the latest status and details in My appointments."} />
      <BookingStepper current={4} />
      <div className="card" style={{ padding: 32 }}>
        <StatusBadge status={a.status} />
        <h2 style={{ fontSize: 38, margin: "18px 0 10px" }}>{fmtLong(a.slot.date)} · {fmtRange(a.slot.start, a.slot.end)}</h2>
        <h3 style={{ fontSize: 26, margin: "0 0 14px" }}>{a.faculty.name} · {a.faculty.department}</h3>
        <p className="muted">{modeLabel(a.slot)} · {a.slot.location}</p>
        <hr className="divider" />
        <strong>{topicLine(a)}</strong>
        {a.description && <p className="muted" style={{ marginTop: 10 }}>{a.description}</p>}
        <div className="notice" style={{ margin: "20px 0", padding: 24 }}>
          <h3 style={{ fontSize: 24, marginBottom: 10 }}>What happens next</h3>
          {a.status === "pending" ? "The selected slot is reserved. Your faculty member will review the request; the consultation remains pending until approved. Faculty must accept it at least 24 hours before the consultation, or it is automatically declined." : `This appointment is now ${a.status}. Open the appointment record to review its current details.`}
        </div>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <Link className="btn primary" to={`/student/appointments?id=${a.id}`}>View my appointment</Link>
          <Link className="btn" to="/student">Back to overview</Link>
        </div>
      </div>
    </>
  );
}