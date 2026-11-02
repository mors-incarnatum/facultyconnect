import { Link } from 'react-router-dom';
import { useAppointment } from '../hooks/useAppointments.js';
import { fmtLong, fmtRange } from '../utils/format.js';
import { topicLine } from '../utils/presentation.js';
import AppointmentNotFound from './AppointmentNotFound.jsx';
import PageHead from './PageHead.jsx';
import StatusBadge from './StatusBadge.jsx';

const outcomes = {
  updated: {
    title: 'Consultation topic updated',
    subtitle: 'Your faculty member can view the revised topic before your meeting.',
  },
  deleted: {
    title: 'Consultation topic deleted',
    subtitle: 'Your appointment is still scheduled.',
    message: 'No topic added. You can add one again at any time before the consultation.',
  },
  cancelled: {
    title: 'Appointment cancelled',
    subtitle: 'The record stays in your previous appointments.',
    message: 'Need another time? Browse open consultation slots.',
  },
};

const AppointmentOutcome = ({ outcome }) => {
  const a = useAppointment();
  if (!a) return <AppointmentNotFound />;
  const { title, subtitle, message } = outcomes[outcome];
  return (
    <>
      <PageHead title={title} subtitle={subtitle} />
      <div className="card">
        <StatusBadge status={a.status} />
        <h2 style={{ fontSize: 26, margin: '14px 0' }}>{a.faculty.name} · {fmtLong(a.slot.date)} · {fmtRange(a.slot.start, a.slot.end)}</h2>
        {outcome === 'updated' ? <>
          <strong>{topicLine(a)}</strong>
          {a.description && <p className="muted" style={{ marginTop: 10 }}>{a.description}</p>}
        </> : <p className="muted">{message}</p>}
        <div className="btn-row">
          <Link className="btn primary" to={`/student/appointments?id=${a.id}`}>{outcome === 'cancelled' ? 'View the cancelled record' : 'Back to my appointments'}</Link>
          {outcome === 'deleted' && <Link className="btn" to={`/student/appointments/${a.id}/edit-topic`}>Add a topic</Link>}
          {outcome === 'cancelled' && <>
            <Link className="btn" to="/student">Back to overview</Link>
            <Link className="btn" to="/student/faculty">Find faculty</Link>
          </>}
        </div>
      </div>
    </>
  );
};

export default AppointmentOutcome;
