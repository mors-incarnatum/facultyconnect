import { Link, useLocation } from 'react-router-dom';

const AvailabilityTabs = ({ children }) => {
  const { pathname } = useLocation();
  return (
    <nav className="availability-tabs" aria-label="Availability views">
      <Link className={`btn ${pathname === '/faculty/availability' ? 'primary' : ''}`} to="/faculty/availability" aria-current={pathname === '/faculty/availability' ? 'page' : undefined}>Weekly hours &amp; exceptions</Link>
      <Link className={`btn ${pathname === '/faculty/availability/slots' ? 'primary' : ''}`} to="/faculty/availability/slots" aria-current={pathname === '/faculty/availability/slots' ? 'page' : undefined}>Published slots</Link>
      {children}
    </nav>
  );
};

export default AvailabilityTabs;
