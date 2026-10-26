import { Link } from "react-router-dom";
import { UNIVERSITY } from "../../data/mock.js";

export default function AuthLayout({ children }) {
  return (
    <div className="auth">
      <aside className="auth-side">
        <Link to="/" className="brand">FacultyConnect</Link>
        <div className="muted small" style={{ marginTop: 14 }}>{UNIVERSITY}</div>
        <div className="tag">
          <h2>A little guidance.<br />A clearer path.</h2>
          <p>Find faculty availability, request a consultation, and keep every appointment in one place.</p>
          <div className="line" />
          <strong>For students and faculty members</strong>
        </div>
      </aside>
      <div className="auth-main">{children}</div>
    </div>
  );
}
