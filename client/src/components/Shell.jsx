import { useEffect, useRef, useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "../state/AppContext.jsx";
import { SEMESTER, UNIVERSITY } from "../data/initialData.js";
import { todayLabel } from "./ui.jsx";
import WorkspaceTrail from "./WorkspaceTrail.jsx";

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
  const { user, signOut } = useApp();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const loggingOut = useRef(false);
  const main = useRef(null);

  useEffect(() => {
    setOpen(false);
    const heading = main.current?.querySelector("h1");
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      document.title = `${heading.textContent} · FacultyConnect`;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!user && loggingOut.current) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: pathname + search, role }} />;
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />;

  const isActive = (item) =>
    item.end ? pathname === item.to : [item.to, ...(item.also || [])].some((p) => pathname.startsWith(p));

  return (
    <div className="shell">
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
          <div>
            <div className="who">{user.name}</div>
            <div className="role">{role === "student" ? "Student" : user.department}</div>
          </div>
          <Link to={`/${role}/help`} aria-current={pathname === `/${role}/help` ? "page" : undefined}>Help &amp; support</Link>
          <button className="link-btn" onClick={() => { loggingOut.current = true; signOut(); navigate("/"); }}>Log out →</button>
        </div>
      </aside>
      <main className="main" id="workspace-content" ref={main} tabIndex={-1}>
        <div className="topline">
          <span className="eyebrow">Your academic connections</span>
          <span>{todayLabel()}</span>
        </div>
        <WorkspaceTrail role={role} />
        <Outlet />
      </main>
    </div>
  );
}
