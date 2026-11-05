import { Link, useLocation } from 'react-router-dom';

/** Shared orientation for nested views, with links back to their owning section. */
export default function WorkspaceTrail({ role }) {
  const { pathname } = useLocation();
  const booking = role === "student" && (pathname.includes("/faculty") || pathname.includes("/request") || pathname.includes("/booking-conflict"));
  if (!booking) return null;
  const section = 'Find faculty';
  const parent = '/student/faculty';
  return <>
    <nav className="workspace-trail" aria-label="Breadcrumb">
      <Link to={`/${role}`}>Workspace</Link><span aria-hidden="true">/</span>
      {pathname === parent ? <span aria-current="page">{section}</span> : <Link to={parent} aria-label={`Return to ${section.toLowerCase()}`}>{section}</Link>}
    </nav>
  </>;
}
