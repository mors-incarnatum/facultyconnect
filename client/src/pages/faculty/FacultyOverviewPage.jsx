import { Link } from 'react-router-dom';
import { useApp } from '../../hooks/useApp.js';
import PageHead from '../../components/PageHead.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { cap, fmtShort, fmtRange } from '../../utils/format.js';
import { STATUSES } from '../../state/appointments.js';
import { useFacultyRecords } from '../../hooks/useAppointments.js';
import StatusActions from '../../components/StatusActions.jsx';

const FacultyOverviewPage = () => {
  const { user } = useApp();
  const records = useFacultyRecords();
  const pending = records.filter((a) => a.status === "pending");
  const upcoming = records.filter((a) => a.status === "confirmed");
  return (
    <>
      <PageHead title={`Welcome back, ${user.name}`} subtitle="Your consultation schedule, requests, and appointment statuses in one place." />
      <div className="stat-grid faculty-stats">
        {STATUSES.map((status) => (
          <Link className="stat" key={status} to={`/faculty/consultations?status=${status}`}>
            <span>{cap(status)}</span>
            <b>{records.filter((appointment) => appointment.status === status).length}</b>
          </Link>
        ))}
      </div>
      <div className="faculty-dashboard">
        <section className="card">
          <h2 className="section-title">Pending requests</h2>
          {!pending.length && <p className="muted">You're all caught up. No pending requests.</p>}
          {pending.map((appointment) => (
            <article className="req-card" key={appointment.id}>
              <StatusBadge status={appointment.status} />
              <h3>{appointment.student.name} · Student</h3>
              <p className="when">{fmtShort(appointment.slot.date)} · {fmtRange(appointment.slot.start, appointment.slot.end)}</p>
              <div className="topic">
                <strong>{appointment.subject} · {appointment.topic || 'No topic added'}</strong>
                <p className="muted">{appointment.description}</p>
              </div>
              <StatusActions appointment={appointment} compact />
              <p className="faculty-spaced"><Link to={`/faculty/consultations/${appointment.id}`}>View full request →</Link></p>
            </article>
          ))}
        </section>
        <section className="card">
          <h2 className="section-title">Upcoming consultations</h2>
          {!upcoming.length && <p className="muted">No confirmed consultations yet.</p>}
          {upcoming.map((appointment) => (
            <article className="req-card" key={appointment.id}>
              <StatusBadge status={appointment.status} />
              <h3>{appointment.student.name} · {appointment.subject}</h3>
              <p className="muted">
                {fmtShort(appointment.slot.date)} · {fmtRange(appointment.slot.start, appointment.slot.end)}<br />
                {appointment.slot.location}
              </p>
              <p className="faculty-spaced">Topic: {appointment.topic || 'No topic added'}</p>
              <Link className="btn block" to={`/faculty/consultations/${appointment.id}`}>Manage consultation →</Link>
            </article>
          ))}
          <hr className="divider" />
          <h2>Availability</h2>
          <p className="muted faculty-spaced">Publish the dates and time slots students can request.</p>
          <Link className="btn primary block" to="/faculty/availability">Manage my availability →</Link>
        </section>
      </div>
    </>
  );
};

export default FacultyOverviewPage;
