import { Link, useLocation } from 'react-router-dom';

/** Shared orientation for nested views, with links back to their owning section. */
export default function WorkspaceTrail({ role }) {
  const { pathname } = useLocation();
  if (pathname === `/${role}`) return null;
  const booking = role === "student" && (pathname.includes("/faculty") || pathname.includes("/request") || pathname.includes("/booking-conflict"));
  const submitted = pathname.includes("/request/submitted/");
  const requesting = pathname === "/student/request";
  const section = booking ? "Find faculty" : pathname.includes("/availability") ? "My availability" : pathname.includes("/consultations") ? "Consultations" : pathname.includes("/appointments") ? "My appointments" : "Help & support";
  const parent = booking ? "/student/faculty" : section === "My availability" ? "/faculty/availability" : section === "Consultations" ? "/faculty/consultations" : section === "My appointments" ? "/student/appointments" : `/${role}/help`;
  return <>
    <nav className="workspace-trail" aria-label="Breadcrumb">
      <Link to={`/${role}`}>Workspace</Link><span aria-hidden="true">/</span>
      {pathname === parent ? <span aria-current="page">{section}</span> : <Link to={parent} aria-label={`Return to ${section.toLowerCase()}`}>{section}</Link>}
    </nav>
    {booking && <ol className="journey-steps" aria-label="Consultation request progress">
      <li aria-current={!requesting && !submitted ? "step" : undefined}><span>1</span>Choose faculty & time</li>
      <li aria-current={requesting ? "step" : undefined}><span>2</span>Request consultation</li>
      <li aria-current={submitted ? "step" : undefined}><span>3</span>Track appointment</li>
    </ol>}
    {role === "faculty" && pathname.includes("/availability") && <nav className="section-tabs" aria-label="Availability views">
      <Link to="/faculty/availability" aria-current={pathname === "/faculty/availability" ? "page" : undefined}>Weekly hours & exceptions</Link>
      <Link to="/faculty/availability/slots" aria-current={pathname !== "/faculty/availability" ? "page" : undefined}>Published slots</Link>
    </nav>}
  </>;
}
