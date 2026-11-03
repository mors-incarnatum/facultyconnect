import { Link, useLocation } from 'react-router-dom';
import PageHead from '../../components/PageHead.jsx';
import AppointmentSummary from '../../components/AppointmentSummary.jsx';
import MissingRecord from '../../components/MissingRecord.jsx';
import { useAppointment } from '../../hooks/useAppointments.js';
import StatusActions from '../../components/StatusActions.jsx';
import { ACTIVE } from '../../state/appointments.js';

const ConsultationDetailsPage = () => {
  const { state } = useLocation();
  const appointment = useAppointment();
  if (!appointment) return <MissingRecord />;
  const isActive = ACTIVE.includes(appointment.status);

  return (
    <>
      <PageHead
        title={appointment.status === 'pending' ? 'Consultation request' : 'Consultation details'}
        subtitle="Review the student’s topic and update the appointment status."
      />
      <div className="two-col consultation-detail-grid">
        <AppointmentSummary appointment={appointment} />
        <aside className="card">
          <h2>Update status</h2>
          <p className="muted faculty-spaced">
            {isActive ? 'Choose the status that reflects this consultation.' : `This consultation is ${appointment.status}. The record is retained in your history.`}
          </p>
          {isActive && <StatusActions appointment={appointment} />}
          <div className="btn-row">
            <Link className="btn block" to={state?.returnTo || '/faculty/consultations'} state={{ returnScroll: state?.returnScroll }}>Back to consultations</Link>
          </div>
        </aside>
      </div>
    </>
  );
};

export default ConsultationDetailsPage;
