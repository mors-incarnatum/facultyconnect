import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp.js';
import Field from '../components/Field.jsx';
import AuthLayout from '../components/layout/AuthLayout.jsx';

function LoginPage() {
    const { signIn, user } = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({
        email: (location.state && location.state.email) || '',
        password: '',
    });
    const [error, setError] = useState('');

    function destination(role) {
        const from = location.state ? location.state.from : undefined;
        if (typeof from === 'string' && (from === `/${role}` || from.startsWith(`/${role}/`) || from.startsWith(`/${role}?`))) {
            return from;
        }
        return `/${role}`;
    }

    function handleChange(event) {
        const { name, value } = event.target;
        setForm(function (prev) {
            return Object.assign({}, prev, { [name]: value });
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!form.email.trim() || !form.password) {
            setError('Enter your email address and password.');
            return;
        }
        const res = await signIn(form.email, form.password);
        if (!res.ok) {
            setError(res.error);
            return;
        }
        navigate(destination(res.role), { replace: true });
    }

    if (user) {
        return <Navigate to={destination(user.role)} replace />;
    }

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
}

export default LoginPage;
