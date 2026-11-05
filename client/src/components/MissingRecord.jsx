import { Link } from 'react-router-dom';
import PageHead from './PageHead.jsx';

export default function MissingRecord({ availability = false }) {
  return <><PageHead title={availability ? "Time slot unavailable" : "Consultation not found"} subtitle="This record is no longer available in your workspace." /><Link className="btn" to={availability ? "/faculty/availability/slots" : "/faculty/consultations"}>Back to {availability ? "availability" : "consultations"}</Link></>;
}
