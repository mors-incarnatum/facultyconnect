import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp.js';
import Field from '../components/Field.jsx';
import AuthLayout from '../components/layout/AuthLayout.jsx';

const LoginPage = () => {
  const { signIn, user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: location.state?.email || '', password: '' });
  const [error, setError] = useState('');
  const destination = (role) => {
    const from = location.state?.from;
    return typeof from === "string" && (from === `/${role}` || from.startsWith(`/${role}/`) || from.startsWith(`/${role}?`)) ? from : `/${role}`;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.email.trim() || !form.password) return setError('Enter your email address and password.');
    const res = signIn(form.email);
    if (!res.ok) return setError(res.error);
    navigate(destination(res.role), { replace: true });
  };

  if (user) return <Navigate to={destination(user.role)} replace />;

  return (
    <AuthLayout>
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Welcome back</h1>
        <p className="muted">Sign in with your account email and password.</p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <Field name="email" label="Email address" type="email" value={form.email} onChange={handleChange} autoComplete="username" />
        <Field name="password" label="Password" type="password" value={form.password} onChange={handleChange} autoComplete="current-password" />
        <button className="btn primary block" type="submit">Sign in</button>
        <p className="hint">Your account role determines the workspace you can access.</p>

        <p className="foot"><Link to="/register" state={location.state}>New to FacultyConnect? Register</Link></p>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
