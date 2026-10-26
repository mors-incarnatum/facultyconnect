import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../state/AppContext.jsx";
import { Field } from "../../components/ui.jsx";
import AuthLayout from "./AuthLayout.jsx";

const DEMO = { student: "alex.johnson@northbridge.edu", faculty: "sarah.chen@northbridge.edu" };

export default function Login() {
  const { signIn } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(location.state?.role || "student");
  const [email, setEmail] = useState(DEMO[role]);
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  const pickRole = (r) => { setRole(r); setEmail(DEMO[r]); setError(""); };
  const submit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return setError("Enter your email address and password.");
    const res = signIn(role, email);
    if (!res.ok) return setError(res.error);
    navigate(`/${role}`);
  };

  return (
    <AuthLayout>
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>Welcome back</h1>
        <p className="muted">Choose your account role and sign in.</p>
        <div className="toggle" role="group" aria-label="Account role">
          <button type="button" aria-pressed={role === "student"} onClick={() => pickRole("student")}>Student</button>
          <button type="button" aria-pressed={role === "faculty"} onClick={() => pickRole("faculty")}>Faculty</button>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <Field label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        <button className="btn primary block" type="submit">Sign in</button>
        <p className="hint">Your account role determines the workspace you can access.</p>
        <div className="demo-box">Phase 1 demo: any password works for the sample accounts shown above.</div>
        <p className="foot"><Link to="/register">New to FacultyConnect? Register</Link></p>
      </form>
    </AuthLayout>
  );
}
