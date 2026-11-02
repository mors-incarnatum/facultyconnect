import { Link, useLocation } from 'react-router-dom';
import AuthLayout from '../components/layout/AuthLayout.jsx';

export default function RegisterSuccessPage() {
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
          <Link to="/login" state={{ email: state?.email, from: state?.from }} className="btn primary">Sign in</Link>
          <Link to="/" className="btn">Back to home</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
