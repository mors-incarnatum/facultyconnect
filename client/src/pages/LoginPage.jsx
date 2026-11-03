import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp.js';
import Avatar from '../components/Avatar.jsx';
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

  const fillDemo = (email) => {
    setForm({ email, password: 'password123' });
    setError('');
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

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
          <div className="muted small" style={{ marginBottom: 10, fontWeight: 600 }}>Quick demo accounts:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              type="button"
              className="btn sm"
              style={{ display: 'flex', gap: 10, alignItems: 'center', textAlign: 'left', width: '100%', padding: '6px 10px' }}
              onClick={() => fillDemo('sample.sofia.santos@dlsu.edu.ph')}
            >
              <Avatar person={{ name: 'Dr. Sofia Santos', avatar: '/avatars/sofia-santos.svg', color: '#2d5a48' }} size="sm" />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Dr. Sofia Santos</div>
                <div className="muted small" style={{ fontSize: 11 }}>Faculty · Software Technology</div>
              </div>
            </button>
            <button
              type="button"
              className="btn sm"
              style={{ display: 'flex', gap: 10, alignItems: 'center', textAlign: 'left', width: '100%', padding: '6px 10px' }}
              onClick={() => fillDemo('sample.alex.delacruz@dlsu.edu.ph')}
            >
              <Avatar person={{ name: 'Alex Dela Cruz', avatar: '/avatars/alex-delacruz.svg', color: '#2d4a68' }} size="sm" />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Alex Dela Cruz</div>
                <div className="muted small" style={{ fontSize: 11 }}>Student · BS Computer Science</div>
              </div>
            </button>
          </div>
        </div>

        <p className="foot"><Link to="/register" state={location.state}>New to FacultyConnect? Register</Link></p>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
