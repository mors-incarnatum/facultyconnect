import Avatar from './Avatar.jsx';
import StatusBadge from './StatusBadge.jsx';
import { modeLabel } from '../utils/presentation.js';
import { fmtLong, fmtRange } from '../utils/format.js';

const AppointmentSummary = ({ appointment, children }) => {
  const { status, student, slot, subject, topic, description } = appointment;
  return (
    <div className="card detail consultation-summary">
      <StatusBadge status={status} />
      <div className="consultation-student">
        <Avatar person={student} size="lg" />
        <div>
          <h3>
            {student.name}
            {student.pronouns && <span className="profile-pronouns" style={{ marginLeft: 6, fontSize: 11 }}>{student.pronouns}</span>}
          </h3>
          <p className="muted small">{student.program || 'Student'}</p>
          <p className="muted small">{student.email}{student.yearLevel ? ` · ${student.yearLevel}` : ''}</p>
        </div>
      </div>
      <h2>{fmtLong(slot.date)}</h2>
      <p className="consultation-time">{fmtRange(slot.start, slot.end)}</p>
      <p className="muted faculty-spaced">{modeLabel(slot)} · {slot.location}</p>
      <strong>{subject}{topic ? ` · ${topic}` : ''}</strong>
      <p className="muted faculty-spaced">{topic ? description : 'No topic added.'}</p>
      {children}
    </div>
  );
};

export default AppointmentSummary;
