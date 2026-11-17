import { Link } from 'react-router-dom';
import PageHead from '../../components/PageHead.jsx';
import AppointmentSummary from '../../components/AppointmentSummary.jsx';
import MissingRecord from '../../components/MissingRecord.jsx';
import { useAppointment } from '../../hooks/useAppointments.js';

export default function ConsultationUpdatedPage() {
  const a = useAppointment();
  if (!a) return <MissingRecord />;
  const titles = { confirmed: "Request accepted", declined: "Request declined", completed: "Consultation completed", cancelled: "Consultation cancelled", pending: "Consultation request" };
  return <><PageHead title={titles[a.status]} subtitle="The appointment status is recorded for the student and faculty." /><AppointmentSummary appointment={a}><div className="notice">This consultation is marked {a.status} in the appointment record.</div><div className="btn-row"><Link className="btn primary" to="/faculty/consultations">View consultations</Link><Link className="btn" to="/faculty">Faculty overview</Link></div></AppointmentSummary></>;
}
