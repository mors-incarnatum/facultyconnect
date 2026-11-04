import { Link, useNavigate } from 'react-router-dom';
import { isCurrentAppointment } from '../../state/appointments.js';
import { useApp } from '../../hooks/useApp.js';
import { useStudentRecords } from '../../hooks/useAppointments.js';
import Avatar from '../../components/Avatar.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import WeekCalendar from '../../components/WeekCalendar.jsx';
import { fmtRange, fmtShort } from '../../utils/format.js';

export default function StudentOverviewPage() {
  const { now, user, faculty, setSelection } = useApp();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const mine = useStudentRecords();
  const navigate = useNavigate();

  const count = (s) => mine.filter((a) => a.status === s).length;
  const upcoming = mine.filter((a) => isCurrentAppointment(a, a.slot, now))
    .sort((a, b) => (a.slot.date + a.slot.start).localeCompare(b.slot.date + b.slot.start)).slice(0, 3);

  const handlePickSlot = ([slot]) => {
    setSelection({ facultyId: slot.facultyId, slotId: slot.id });
    navigate(`/student/faculty/calendar?faculty=${slot.facultyId}&slot=${slot.id}`);
  };

  return (
    <>
      <div className="page-head" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Avatar person={user} size="lg" />
        <div>
          <h1 style={{ margin: 0 }}>
            {greeting}, {user.name.split(" ")[0]}
            {user.pronouns && <span className="profile-pronouns" style={{ marginLeft: 8, fontSize: 13, fontWeight: 500 }}>{user.pronouns}</span>}
          </h1>
          <p style={{ margin: "4px 0 0" }}>
            {count("pending")} pending · {count("confirmed")} confirmed · {count("completed")} completed · {count("declined")} declined · {count("cancelled")} cancelled.{" "}
            <Link to="/student/appointments">View every status in My appointments.</Link>
          </p>
        </div>
      </div>

      <div className="overview-grid student-overview-grid">
        <section>
          <h2 className="section-title">Upcoming and ongoing consultations</h2>
          <div className="overview-section-content">
          {upcoming.length === 0 && (
            <div className="card empty"><h3>Nothing scheduled</h3><p className="muted">Find a faculty member to request your next consultation.</p></div>
          )}
          {upcoming.map((a) => (
            <div className="card upcoming-card" key={a.id}>
              <StatusBadge status={a.status} />
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '12px 0 8px' }}>
                <Avatar person={a.faculty} size="md" />
                <div>
                  <h3 style={{ margin: 0, fontSize: 18 }}>{a.faculty.name}</h3>
                  <div className="muted small">{a.faculty.rank} · {a.faculty.department}</div>
                </div>
              </div>
              <p className="when">{fmtShort(a.slot.date)} · {fmtRange(a.slot.start, a.slot.end)}</p>
              <p className="muted">{a.subject}{a.topic ? ` · ${a.topic}` : ""}</p>
              <Link className="btn block" to={`/student/appointments?id=${a.id}`}>View appointment →</Link>
            </div>
          ))}
          <p style={{ textAlign: "center", marginTop: 20 }}><Link to="/student/appointments">All appointments →</Link></p>
          </div>
        </section>
        <section>
          <h2 className="section-title">Your week at a glance</h2>
          <WeekCalendar
            className="overview-calendar"
            facultyIds={faculty.map((f) => f.id)}
            studentId={user.id}
            onPick={handlePickSlot}
          />
        </section>
      </div>
    </>
  );
}
