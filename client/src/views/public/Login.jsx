import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../state/AppContext.jsx";
import { Field } from "../../components/ui.jsx";
import AuthLayout from "./AuthLayout.jsx";

export default function Login() {
  const { signIn, user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const destination = (role) => {
    const from = location.state?.from;
    return typeof from === "string" && (from === `/${role}` || from.startsWith(`/${role}/`) || from.startsWith(`/${role}?`)) ? from : `/${role}`;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return setError("Enter your email address and password.");
    const res = signIn(email);
    if (!res.ok) return setError(res.error);
    navigate(destination(res.role), { replace: true });
  };

  if (user) return <Navigate to={destination(user.role)} replace />;

  return (
    <AuthLayout>
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>Welcome back</h1>
        <p className="muted">Sign in with your account email and password.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <Field label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        <button className="btn primary block" type="submit">Sign in</button>
        <p className="hint">Your account role determines the workspace you can access.</p>
        <p className="foot"><Link to="/register" state={location.state}>New to FacultyConnect? Register</Link></p>
      </form>
    </AuthLayout>
  );
}
