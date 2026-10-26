import { Link } from "react-router-dom";
import { UNIVERSITY } from "../../data/mock.js";
import DemoLink from "../../components/DemoLink.jsx";
import { useApp } from "../../state/AppContext.jsx";

const GROUPS = [
  {
    title: "Account", role: null, items: [
      ["/login", "Sign in", "Role-based log-in for students and faculty"],
      ["/register", "Register", "Create a student or faculty account"],
      ["/register/success", "Account created", "Confirmation shown after registering"],
    ],
  },
  {
    title: "Student workspace", role: "student", items: [
      ["/student", "Overview", "Upcoming consultations and week at a glance"],
      ["/student/faculty", "Find faculty · List", "Search by name, department, or subject"],
      ["/student/faculty/calendar", "Find faculty · Calendar", "Weekly view of open consultation times"],
      ["/student/faculty/f1", "Faculty profile", "Bio, courses, and every open time"],
      ["/student/request?slot=sl03", "Request a consultation", "Choose a time and add a topic"],
      ["/student/appointments", "My appointments", "Current and previous records by status"],
      ["/student/appointments/a1/edit-topic", "Edit consultation topic", "Update subject, topic, and description"],
      ["/student/appointments/a1/delete-topic", "Delete consultation topic", "Remove a topic without cancelling"],
      ["/student/appointments/a2/cancel", "Cancel appointment", "Confirm cancellation of a pending request"],
      ["/student/booking-conflict?slot=sl02", "Booking conflict", "What happens when a slot was just taken"],
      ["/student/help", "Help & support", "How consultations and statuses work"],
    ],
  },
];

export default function Index() {
  const { user } = useApp();
  return (
    <div>
      <header className="index-hero">
        <div className="index-nav">
          <div><span className="brand">FacultyConnect</span><div className="muted small">{UNIVERSITY}</div></div>
          <div className="btn-row" style={{ margin: 0 }}>
            {user ? <Link className="btn primary" to={`/${user.role}`}>Open my workspace</Link> : (
              <>
                <Link className="btn" to="/register">Register</Link>
                <Link className="btn primary" to="/login">Sign in</Link>
              </>
            )}
          </div>
        </div>
        <h1>A little guidance.<br />A clearer path.</h1>
        <p className="lead">FacultyConnect brings consultation scheduling into one place. Faculty publish their available times, students find the right person and request a slot, and both sides see the same appointment status.</p>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <DemoLink role="student" to="/student" className="btn primary">Explore as a student</DemoLink>
        </div>
        <div className="value-grid">
          <div className="card"><h3>See real availability</h3><p className="muted">Students check open slots before they ask, so there is no back-and-forth over email.</p></div>
          <div className="card"><h3>No double bookings</h3><p className="muted">A requested slot is held until the faculty member responds, and is re-checked on submit.</p></div>
          <div className="card"><h3>Prepared consultations</h3><p className="muted">Every request carries a topic, so faculty can prepare before the meeting.</p></div>
        </div>
      </header>

      <section className="directory" aria-labelledby="dir-title">
        <h2 id="dir-title">Every view, one place</h2>
        <p className="muted">Phase 1 prototype with hardcoded sample data. Each link opens a screen using the sample student account (Alex Johnson).</p>
        {GROUPS.map((g) => (
          <div className="dir-group" key={g.title}>
            <h3>{g.title}</h3>
            <div className="dir-grid">
              {g.items.map(([to, label, desc]) => (
                <DemoLink key={to} to={to} role={g.role}><strong>{label}</strong><span>{desc}</span></DemoLink>
              ))}
            </div>
          </div>
        ))}
      </section>
      <footer className="footer">FacultyConnect · CBAPDEV Group 2 · Phase 1 front-end prototype</footer>
    </div>
  );
}
