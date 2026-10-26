import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../../state/AppContext.jsx";
import { departments } from "../../data/mock.js";
import { Field } from "../../components/ui.jsx";
import AuthLayout from "./AuthLayout.jsx";

export default function Register() {
  const { register } = useApp();
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", department: departments[0] });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) return setError("Please complete every field.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Enter a valid email address.");
    if (form.password.length < 8) return setError("Use a password with at least 8 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    const res = register({ role, name: form.name.trim(), email: form.email, department: form.department });
    if (!res.ok) return setError(res.error);
    navigate("/register/success", { state: { role, name: form.name.trim(), email: form.email.trim() } });
  };

  return (
    <AuthLayout>
      <form className="auth-card" onSubmit={submit} noValidate>
        <h1>Create your account</h1>
        <p className="muted">Choose your role and enter your account details.</p>
        <div className="toggle" role="group" aria-label="Account role">
          <button type="button" aria-pressed={role === "student"} onClick={() => setRole("student")}>Student</button>
          <button type="button" aria-pressed={role === "faculty"} onClick={() => setRole("faculty")}>Faculty</button>
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <Field label="Full name" value={form.name} onChange={set("name")} placeholder="Alex Johnson" autoComplete="name" />
        <Field label="Email address" type="email" value={form.email} onChange={set("email")} placeholder="name@northbridge.edu" autoComplete="email" />
        {role === "faculty" && (
          <Field label="Department" as="select" value={form.department} onChange={set("department")}>
            {departments.map((d) => <option key={d}>{d}</option>)}
          </Field>
        )}
        <Field label="Password" type="password" value={form.password} onChange={set("password")} autoComplete="new-password" />
        <Field label="Confirm password" type="password" value={form.confirm} onChange={set("confirm")} autoComplete="new-password" />
        <button className="btn primary block" type="submit">Create account</button>
        <p className="hint">After creating your account, sign in to continue.</p>
        <p className="foot"><Link to="/login">Already have an account? Sign in</Link></p>
      </form>
    </AuthLayout>
  );
}

export function RegisterSuccess() {
  const { state } = useLocation();
  const role = state?.role || "student";
  return (
    <AuthLayout>
      <div className="auth-card">
        <span className="badge confirmed">Account created</span>
        <h1 style={{ marginTop: 14 }}>{role === "faculty" ? "Faculty" : "Student"} account created</h1>
        <p className="muted">
          {state?.name ? `Welcome, ${state.name}. ` : ""}Your account is ready. Sign in to {role === "faculty" ? "publish your consultation schedule" : "find faculty and request consultations"}.
        </p>
        <div className="btn-row">
          <Link to="/login" state={{ role }} className="btn primary">Sign in</Link>
          <Link to="/" className="btn">Back to home</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
