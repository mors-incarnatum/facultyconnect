import { Link } from "react-router-dom";
import { useApp } from "../../state/AppContext.jsx";
import { PageHead, StatusBadge } from "../../components/ui.jsx";
import { fmtShort, fmtRange } from "../../utils/format.js";
import { STATUSES, useFacultyRecords } from "./shared.jsx";
import StatusActions from "./StatusActions.jsx";

export default function Overview() {
  const { user } = useApp();
  const records = useFacultyRecords();
  const pending = records.filter((a) => a.status === "pending");
  const upcoming = records.filter((a) => a.status === "confirmed");
  return <>
    <PageHead title={`Welcome back, ${user.name}`} subtitle="Your consultation schedule, requests, and appointment statuses in one place." />
    <div className="stat-grid faculty-stats">{STATUSES.map((status) => <Link className="stat" key={status} to={`/faculty/consultations?status=${status}`}><span>{status[0].toUpperCase() + status.slice(1)}</span><b>{records.filter((a) => a.status === status).length}</b></Link>)}</div>
    <div className="faculty-dashboard">
      <section className="card"><h2 className="section-title">Pending requests</h2>
        {!pending.length && <p className="muted">You're all caught up. No pending requests.</p>}
        {pending.map((a) => <article className="req-card" key={a.id}><StatusBadge status={a.status} /><h3>{a.student.name} · Student</h3><p className="when">{fmtShort(a.slot.date)} · {fmtRange(a.slot.start, a.slot.end)}</p><div className="topic"><strong>{a.subject} · {a.topic || "No topic added"}</strong><p className="muted">{a.description}</p></div><StatusActions appointment={a} compact /><p className="faculty-spaced"><Link to={`/faculty/consultations/${a.id}`}>View full request →</Link></p></article>)}
      </section>
      <section className="card"><h2 className="section-title">Upcoming consultations</h2>
        {!upcoming.length && <p className="muted">No confirmed consultations yet.</p>}
        {upcoming.map((a) => <article className="req-card" key={a.id}><StatusBadge status={a.status} /><h3>{a.student.name} · {a.subject}</h3><p className="muted">{fmtShort(a.slot.date)} · {fmtRange(a.slot.start, a.slot.end)}<br />{a.slot.location}</p><p className="faculty-spaced">Topic: {a.topic || "No topic added"}</p><Link className="btn block" to={`/faculty/consultations/${a.id}`}>Manage consultation →</Link></article>)}
        <hr className="divider" /><h2>Availability</h2><p className="muted faculty-spaced">Publish the dates and time slots students can request.</p><Link className="btn primary block" to="/faculty/availability">Manage my availability →</Link>
      </section>
    </div>
  </>;
}
