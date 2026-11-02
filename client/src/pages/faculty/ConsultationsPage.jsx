import { Link, useSearchParams } from 'react-router-dom';
import PageHead from '../../components/PageHead.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { cap, fmtShort, fmtRange } from '../../utils/format.js';
import { STATUSES } from '../../state/appointments.js';
import { useFacultyRecords } from '../../hooks/useAppointments.js';

const ConsultationsPage = () => {
  const records = useFacultyRecords();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "";
  const list = records.filter((a) => !status || a.status === status);
  const handleStatusChange = (event) => {
    const { value } = event.target;
    setParams(value ? { status: value } : {});
  };

  return (
    <>
      <PageHead title="Consultations" subtitle="Review requests, manage upcoming consultations, and view previous appointment records." />
      <div className="filters">
        <select aria-label="Filter consultations by status" value={status} onChange={handleStatusChange}>
          <option value="">All statuses</option>
          {STATUSES.map((value) => <option key={value} value={value}>{cap(value)}</option>)}
        </select>
      </div>
      <section className="card">
        <h2>All consultation records</h2>
        <p className="muted faculty-spaced">Pending, confirmed, completed, declined, and cancelled appointments.</p>
        {!list.length && <div className="empty"><h3>No consultations here</h3><p className="muted">Try another status filter.</p></div>}
        {list.map((appointment) => (
          <div className="appt-row" key={appointment.id}>
            <div>
              <strong>{appointment.student.name} · {appointment.subject} · {appointment.topic || 'No topic added'}</strong>
              <span className="meta">{fmtShort(appointment.slot.date)} · {fmtRange(appointment.slot.start, appointment.slot.end)}</span>
            </div>
            <StatusBadge status={appointment.status} />
            <Link to={`/faculty/consultations/${appointment.id}`} state={{ returnTo: `/faculty/consultations?${params}` }}>View details</Link>
          </div>
        ))}
      </section>
    </>
  );
};

export default ConsultationsPage;
