import Avatar from './Avatar.jsx';
import StatusBadge from './StatusBadge.jsx';
import { modeLabel } from '../utils/presentation.js';
import { fmtLong, fmtRange } from '../utils/format.js';

const AppointmentSummary = ({ appointment, children }) => {
  const { status, student, slot, subject, topic, description } = appointment;
  return (
    <div className="card detail">
      <StatusBadge status={status} />
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', margin: '14px 0 10px' }}>
        <Avatar person={student} size="lg" />
        <div>
          <h3 style={{ margin: 0 }}>
            {student.name}
            {student.pronouns && <span className="profile-pronouns" style={{ marginLeft: 6, fontSize: 11 }}>{student.pronouns}</span>}
          </h3>
          <p className="muted small" style={{ margin: '2px 0 0' }}>
            {student.program || 'Student'} · {student.email}
          </p>
          {student.yearLevel && (
            <span className="profile-tag" style={{ display: 'inline-block', marginTop: 4, fontSize: 11, padding: '2px 8px' }}>
              {student.yearLevel}
            </span>
          )}
        </div>
      </div>
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
