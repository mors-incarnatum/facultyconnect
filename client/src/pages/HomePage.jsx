import { Link } from 'react-router-dom';
import { UNIVERSITY } from '../data/initialData.js';
import { useApp } from '../hooks/useApp.js';

export default function HomePage() {
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
          <Link to={user ? `/${user.role}` : "/login"} className="btn primary">{user ? "Open my workspace" : "Sign in to get started"}</Link>
          {!user && <Link to="/register" className="btn">Create an account</Link>}
        </div>
        <div className="value-grid">
          <div className="card"><h3>See real availability</h3><p className="muted">Students check open slots before they ask, so there is no back-and-forth over email.</p></div>
          <div className="card"><h3>No double bookings</h3><p className="muted">A requested slot is held until the faculty member responds, and is re-checked on submit.</p></div>
          <div className="card"><h3>Prepared consultations</h3><p className="muted">Every request carries a topic, so faculty can prepare before the meeting.</p></div>
        </div>
      </header>

      <footer className="footer">FacultyConnect · CBAPDEV Group 2</footer>
    </div>
  );
}
