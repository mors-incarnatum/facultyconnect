import { Link } from 'react-router-dom';
import PageHead from './PageHead.jsx';

const AppointmentNotFound = () => (
  <>
    <PageHead title="Appointment not found" subtitle="It may have been removed." />
    <Link className="btn primary" to="/student/appointments">Back to my appointments</Link>
  </>
);

export default AppointmentNotFound;
