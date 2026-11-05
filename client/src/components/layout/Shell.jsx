import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp.js';
import { SEMESTER, UNIVERSITY } from '../../data/initialData.js';
import { todayLabel } from '../../utils/presentation.js';
import WorkspaceTrail from './WorkspaceTrail.jsx';
import ScheduleDraftGuard from '../ScheduleDraftGuard.jsx';
import Avatar from '../Avatar.jsx';

const NAV = {
  faculty: [
    { to: "/faculty", label: "Overview", end: true },
    { to: "/faculty/availability", label: "My availability" },
    { to: "/faculty/consultations", label: "Consultations" },
  ],
  student: [
    { to: "/student", label: "Overview", end: true },
    { to: "/student/faculty", label: "Find faculty", also: ["/student/request", "/student/booking-conflict"] },
    { to: "/student/appointments", label: "My appointments" },
  ],
};

/** Layout route: requires a signed-in user of the given role. */
export default function Shell({ role }) {
  const { now, user, signOut, scheduleDraft, setScheduleDraft, saveFacultySchedule, feedback, setFeedback } = useApp();
  const { pathname, search, state } = useLocation();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(null);
  const [draftError, setDraftError] = useState("");
  const [open, setOpen] = useState(false);
  const loggingOut = useRef(false);
  const main = useRef(null);
  const scrollPositions = useRef({});
  useEffect(() => {
    const remember = () => { scrollPositions.current[pathname] = window.scrollY; };
    window.addEventListener("scroll", remember);
    return () => window.removeEventListener("scroll", remember);
  }, [pathname]);

  const handleRouteEntry = useEffectEvent(() => {
    setOpen(false);
    setFeedback(state?.feedback || "");
    const heading = main.current?.querySelector("h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      document.title = `${heading.textContent} · FacultyConnect`;
    }
    window.scrollTo(0, state?.returnScroll ?? scrollPositions.current[pathname] ?? 0);
  });

  useEffect(() => {
    handleRouteEntry();
  }, [pathname]);

  const finishLeaving = () => {
    const target = leaving;
    setLeaving(null);
    if (target === 'logout') {
      loggingOut.current = true;
      signOut();
      navigate('/');
    } else {
      navigate(target);
    }
  };

  const handleSaveDraft = () => {
    const result = saveFacultySchedule(scheduleDraft);
    if (!result.ok) {
      setDraftError(result.error);
      return;
    }
    finishLeaving();
  };

  const handleDiscardDraft = () => {
    setScheduleDraft(null);
    finishLeaving();
  };

  const handleSignOut = () => {
    if (scheduleDraft) {
      setLeaving('logout');
      return;
    }
    loggingOut.current = true;
    signOut();
    navigate('/');
  };

  const handleNavigation = (event) => {
    const anchor = event.target.closest('a');
    const target = anchor?.getAttribute('href')?.replace(/^#/, '');
    if (scheduleDraft && target?.startsWith('/') && !target.startsWith('/faculty/availability') && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      event.stopPropagation();
      setLeaving(target);
      setDraftError('');
    }
  };

  if (!user && loggingOut.current) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: pathname + search, role }} />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;

  const isActive = (item) =>
    item.end ? pathname === item.to : [item.to, ...(item.also || [])].some((p) => pathname.startsWith(p));

  return (
    <div className={`shell workspace-v2 workspace-${role}`} onClickCapture={handleNavigation}>
      <a className="skip-link" href="#workspace-content" onClick={(event) => { event.preventDefault(); main.current?.focus(); }}>Skip to content</a>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="mobile-bar">
          <Link to={`/${role}`} className="brand">FacultyConnect</Link>
          <button className="btn sm" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? "Close" : "Menu"}
          </button>
        </div>
        <div className="collapsible">
          <Link to={`/${role}`} className="brand">FacultyConnect</Link>
          <div className="brand-sub">{UNIVERSITY}</div>
          <hr />
          <div className="nav-label">{role} workspace</div>
          <nav className="nav" aria-label="Primary" onClick={() => setOpen(false)}>
            {NAV[role].map((item) => (
              <Link key={item.to} to={item.to} className={isActive(item) ? "active" : ""} aria-current={isActive(item) ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="semester"><strong>{SEMESTER}</strong><span>A little guidance goes a long way.</span></div>
        </div>
        <div className="sidebar-foot collapsible">
          <div className="sidebar-identity">
            <Avatar person={user} size="sm" />
            <div style={{ minWidth: 0 }}>
              <div className="who" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div className="role">{role === "student" ? "Student" : user.department}</div>
            </div>
          </div>
          <Link to={`/${role}/help`} aria-current={pathname === `/${role}/help` ? "page" : undefined}>Help &amp; support</Link>
          <button className="link-btn" onClick={handleSignOut}>Log out →</button>
          <p className="session-note">Session workspace · changes reset on reload.</p>
        </div>
      </aside>
      <main className="main" id="workspace-content" ref={main} tabIndex={-1}>
        <div className="topline">
          <span className="eyebrow">Your academic connections</span>
          <span>{todayLabel(now)}</span>
        </div>
        {feedback && <div className="feedback feedback-toast" role="status" aria-live="polite"><span>{feedback}</span><button type="button" aria-label="Dismiss notification" onClick={() => setFeedback('')}>×</button></div>}
        {leaving && (
          <ScheduleDraftGuard
            error={draftError}
            onSave={handleSaveDraft}
            onDiscard={handleDiscardDraft}
            onStay={() => setLeaving(null)}
          />
        )}
        <WorkspaceTrail role={role} />
        <Outlet />
      </main>
    </div>
  );
}
