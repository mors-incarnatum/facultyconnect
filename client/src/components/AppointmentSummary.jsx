import StatusBadge from './StatusBadge.jsx';
import { modeLabel } from '../utils/presentation.js';
import { fmtLong, fmtRange } from '../utils/format.js';

const AppointmentSummary = ({ appointment, children }) => {
  const { status, student, slot, subject, topic, description } = appointment;
  return (
    <div className="card detail">
      <StatusBadge status={status} />
      <h3>{student.name}</h3>
      <p className="muted">Student · {student.email}</p>
      <hr className="divider" />
      <h2>{fmtLong(slot.date)} · {fmtRange(slot.start, slot.end)}</h2>
      <p className="muted faculty-spaced">{modeLabel(slot)} · {slot.location}</p>
      <strong>{subject}{topic ? ` · ${topic}` : ''}</strong>
      <p className="muted faculty-spaced">{topic ? description : 'No topic added.'}</p>
      {children}
    </div>
  );
};

export default AppointmentSummary;
