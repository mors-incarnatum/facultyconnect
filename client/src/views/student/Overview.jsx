import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ACTIVE, useApp, useDetailed } from "../../state/AppContext.jsx";
import { Field, StatusBadge } from "../../components/ui.jsx";
import WeekCalendar from "../../components/WeekCalendar.jsx";
import { fmtRange, fmtShort } from "../../utils/format.js";

const hour = new Date().getHours();
const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

export default function Overview() {
  const { user, appointments, faculty, setSelection } = useApp();
  const detail = useDetailed();
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const mine = appointments.filter((a) => a.studentId === user.id).map(detail);
  const count = (s) => mine.filter((a) => a.status === s).length;
  const upcoming = mine.filter((a) => ACTIVE.includes(a.status))
    .sort((a, b) => (a.slot.date + a.slot.start).localeCompare(b.slot.date + b.slot.start)).slice(0, 3);

  const search = (e) => {
    e.preventDefault();
    navigate(`/student/faculty${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  };

  return (
    <>
      <div className="page-head">
        <h1>{greeting}, {user.name.split(" ")[0]}</h1>
        <p>
          {count("pending")} pending · {count("confirmed")} confirmed · {count("completed")} completed · {count("declined")} declined · {count("cancelled")} cancelled.{" "}
          <Link to="/student/appointments">View every status in My appointments.</Link>
        </p>
      </div>

      <form className="card tint" onSubmit={search} style={{ marginBottom: 32 }}>
        <h2 style={{ marginBottom: 16 }}>Who can help with your next step?</h2>
        <div className="hero-search">
          <Field label="Find your faculty" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, department, or subject" />
          <button className="btn primary" type="submit" style={{ minWidth: 192 }}>Find faculty →</button>
        </div>
      </form>

      <div className="overview-grid">
        <section>
          <h2 className="section-title">Upcoming consultations</h2>
          {upcoming.length === 0 && (
            <div className="card empty"><h3>Nothing scheduled</h3><p className="muted">Find a faculty member to request your next consultation.</p></div>
          )}
          {upcoming.map((a) => (
            <div className="card upcoming-card" key={a.id}>
              <StatusBadge status={a.status} />
              <h3>{a.faculty.name}</h3>
              <p className="when">{fmtShort(a.slot.date)} · {fmtRange(a.slot.start, a.slot.end)}</p>
              <p className="muted">{a.subject}{a.topic ? ` · ${a.topic}` : ""}</p>
              <Link className="btn block" to={`/student/appointments?id=${a.id}`}>View appointment →</Link>
            </div>
          ))}
          <p style={{ textAlign: "center", marginTop: 20 }}><Link to="/student/appointments">All appointments →</Link></p>
        </section>
        <section>
          <h2 className="section-title">Your week at a glance</h2>
          <WeekCalendar
            facultyIds={faculty.map((f) => f.id)}
            studentId={user.id}
            onPick={(slots) => { setSelection({ facultyId: slots[0].facultyId, slotId: slots[0].id }); navigate("/student/faculty/calendar"); }}
          />
        </section>
      </div>
    </>
  );
}
