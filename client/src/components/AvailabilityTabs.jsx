import { Link, useLocation } from 'react-router-dom';

function AvailabilityTabs({ children }) {
    const { pathname } = useLocation();
    const isWeekly = pathname === '/faculty/availability';
    const isSlots = pathname === '/faculty/availability/slots';

    return (
        <nav className="availability-tabs" aria-label="Availability views">
            <Link
                className={`btn ${isWeekly ? 'primary' : ''}`}
                to="/faculty/availability"
                aria-current={isWeekly ? 'page' : undefined}
            >
                Weekly hours &amp; exceptions
            </Link>
            <Link
                className={`btn ${isSlots ? 'primary' : ''}`}
                to="/faculty/availability/slots"
                aria-current={isSlots ? 'page' : undefined}
            >
                Published slots
            </Link>
            {children}
        </nav>
    );
}

export default AvailabilityTabs;
