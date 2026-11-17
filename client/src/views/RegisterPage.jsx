import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp.js';
import { departments } from '../utils/presentation.js';
import Field from '../components/Field.jsx';
import AuthLayout from '../components/layout/AuthLayout.jsx';

const DUPLICATE_EMAIL_ERROR = 'An account with that email address already exists.';

function RegisterPage() {
    const { register, checkEmail } = useApp();
    const navigate = useNavigate();
    const { state } = useLocation();
    const [role, setRole] = useState(state && state.role === 'faculty' ? 'faculty' : 'student');
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirm: '',
        department: departments[0],
    });
    const [error, setError] = useState('');
    const [emailTaken, setEmailTaken] = useState(false);
    const emailCheckSeq = useRef(0);

    async function handleChange(event) {
        const { name, value } = event.target;
        setForm(function (prev) {
            return Object.assign({}, prev, { [name]: value });
        });

        if (name === 'email') {
            const seq = ++emailCheckSeq.current;
            if (!value.trim()) {
                setEmailTaken(false);
                setError(function (prev) {
                    return prev === DUPLICATE_EMAIL_ERROR ? '' : prev;
                });
                return;
            }

            const res = await checkEmail(value);
            if (emailCheckSeq.current !== seq) {
                return;
            }

            if (res.exists) {
                setEmailTaken(true);
                setError(DUPLICATE_EMAIL_ERROR);
            } else {
                setEmailTaken(false);
                setError(function (prev) {
                    return prev === DUPLICATE_EMAIL_ERROR ? '' : prev;
                });
            }
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (emailTaken) {
            setError(DUPLICATE_EMAIL_ERROR);
            return;
        }
        if (!form.name.trim() || !form.email.trim() || !form.password) {
            setError('Please complete every field.');
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(form.email)) {
            setError('Enter a valid email address.');
            return;
        }
        if (form.password.length < 8) {
            setError('Use a password with at least 8 characters.');
            return;
        }
        if (form.password !== form.confirm) {
            setError('Passwords do not match.');
            return;
        }

        const res = await register({
            role: role,
            name: form.name.trim(),
            email: form.email,
            department: form.department,
            password: form.password,
        });
        if (!res.ok) {
            setError(res.error);
            return;
        }

        navigate('/register/success', {
            state: {
                role: role,
                name: form.name.trim(),
                email: form.email.trim(),
                from: state ? state.from : undefined,
            },
        });
    }

    return (
        <AuthLayout>
            <form className="auth-card" onSubmit={handleSubmit} noValidate>
                <h1>Create your account</h1>
                <p className="muted">Choose your role and enter your account details.</p>
                <div className="toggle" role="group" aria-label="Account role">
                    <button
                        type="button"
                        aria-pressed={role === 'student'}
                        onClick={function () { setRole('student'); }}
                    >
                        Student
                    </button>
                    <button
                        type="button"
                        aria-pressed={role === 'faculty'}
                        onClick={function () { setRole('faculty'); }}
                    >
                        Faculty
                    </button>
                </div>
                {error && <div className="form-error" role="alert">{error}</div>}
                <Field label="Full name" value={form.name} name="name" onChange={handleChange} placeholder="Alex Dela Cruz" autoComplete="name" />
                <Field label="Email address" type="email" value={form.email} name="email" onChange={handleChange} placeholder="firstname.lastname@dlsu.edu.ph" autoComplete="email" />
                {role === 'faculty' && (
                    <Field label="Department" as="select" value={form.department} name="department" onChange={handleChange}>
                        {departments.map(function (d) {
                            return <option key={d}>{d}</option>;
                        })}
                    </Field>
                )}
                <Field label="Password" type="password" value={form.password} name="password" onChange={handleChange} autoComplete="new-password" />
                <Field label="Confirm password" type="password" value={form.confirm} name="confirm" onChange={handleChange} autoComplete="new-password" />
                <button className="btn primary block" type="submit" disabled={emailTaken}>Create account</button>
                <p className="hint">After creating your account, sign in to continue.</p>
                <p className="foot"><Link to="/login" state={state}>Already have an account? Sign in</Link></p>
            </form>
        </AuthLayout>
    );
}

export default RegisterPage;
