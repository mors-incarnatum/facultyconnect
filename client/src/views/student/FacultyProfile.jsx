import { Link, useParams } from "react-router-dom";
import { useApp } from "../../state/AppContext.jsx";
import { Avatar, PageHead, modeLabel } from "../../components/ui.jsx";
import { fmtLong, fmtRange } from "../../utils/format.js";

export default function FacultyProfile() {
  const { id } = useParams();
  const { getFaculty, availableSlotsFor } = useApp();
  const f = getFaculty(id);
  if (!f) return <><PageHead title="Faculty member not found" /><Link className="btn" to="/student/faculty">← Back to faculty</Link></>;
  const slots = availableSlotsFor(f.id);
  return (
    <>
      <PageHead title={f.name} subtitle={`${f.rank} · ${f.department}`} />
      <p style={{ marginBottom: 16 }}><Link to="/student/faculty">← Back to faculty</Link></p>
      <div className="two-col">
        <div className="card">
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18 }}>
            <Avatar person={f} size="lg" />
            <div><h2>About</h2><div className="muted small">{f.email}</div></div>
          </div>
          <p>{f.bio}</p>
          <hr className="divider" />
          <dl className="kv">
            <dt>Department</dt><dd>{f.department}</dd>
            <dt>Subjects</dt><dd>{f.subjects.join(", ") || "—"}</dd>
            <dt>Courses</dt><dd>{f.courses.join(", ") || "—"}</dd>
            <dt>Office</dt><dd>{f.office}</dd>
          </dl>
        </div>
        <div className="card">
          <h2 style={{ fontSize: 22, marginBottom: 12 }}>Available times</h2>
          {slots.length === 0 && <p className="muted">No open consultation times right now.</p>}
          {slots.map((s) => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 0", borderTop: "1px solid var(--line)" }}>
              <div><strong>{fmtLong(s.date)}</strong><div className="muted small">{fmtRange(s.start, s.end)} · {modeLabel(s)}</div></div>
              <Link className="btn sm" to={`/student/request?slot=${s.id}`}>Request</Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
