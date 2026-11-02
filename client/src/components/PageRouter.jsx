import { Navigate, Route, Routes } from 'react-router-dom';
import Shell from './layout/Shell.jsx';
import Index from '../pages/HomePage.jsx';
import Login from '../pages/LoginPage.jsx';
import Register from '../pages/RegisterPage.jsx';
import RegisterSuccess from '../pages/RegisterSuccessPage.jsx';
import Overview from '../pages/student/StudentOverviewPage.jsx';
import FacultySearch from '../pages/student/FacultySearchPage.jsx';
import FacultyProfile from '../pages/student/FacultyProfilePage.jsx';
import Request from '../pages/student/RequestPage.jsx';
import Appointments from '../pages/student/AppointmentsPage.jsx';
import Help from '../pages/student/StudentHelpPage.jsx';
import FacultyOverview from '../pages/faculty/FacultyOverviewPage.jsx';
import Consultations from '../pages/faculty/ConsultationsPage.jsx';
import ConsultationDetails from '../pages/faculty/ConsultationDetailsPage.jsx';
import ConsultationUpdated from '../pages/faculty/ConsultationUpdatedPage.jsx';
import Availability from '../pages/faculty/AvailabilityPage.jsx';
import PublishedSlots from '../pages/faculty/PublishedSlotsPage.jsx';
import SlotForm from '../pages/faculty/SlotFormPage.jsx';
import RemoveSlot from '../pages/faculty/RemoveSlotPage.jsx';
import AvailabilityOutcome from '../pages/faculty/AvailabilityOutcomePage.jsx';
import FacultyHelp from '../pages/faculty/FacultyHelpPage.jsx';
import AppointmentCancelled from '../pages/student/AppointmentCancelledPage.jsx';
import BookingConflict from '../pages/student/BookingConflictPage.jsx';
import CancelAppointment from '../pages/student/CancelAppointmentPage.jsx';
import DeleteTopic from '../pages/student/DeleteTopicPage.jsx';
import EditTopic from '../pages/student/EditTopicPage.jsx';
import RequestSubmitted from '../pages/student/RequestSubmittedPage.jsx';
import TopicDeleted from '../pages/student/TopicDeletedPage.jsx';
import TopicUpdated from '../pages/student/TopicUpdatedPage.jsx';

export default function PageRouter() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register/success" element={<RegisterSuccess />} />

      <Route path="/student" element={<Shell role="student" />}>
        <Route index element={<Overview />} />
        <Route path="faculty" element={<FacultySearch view="list" />} />
        <Route path="faculty/calendar" element={<FacultySearch view="calendar" />} />
        <Route path="faculty/:id" element={<FacultyProfile />} />
        <Route path="request" element={<Request />} />
        <Route path="request/submitted/:id" element={<RequestSubmitted />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="appointments/:id/edit-topic" element={<EditTopic />} />
        <Route path="appointments/:id/topic-updated" element={<TopicUpdated />} />
        <Route path="appointments/:id/delete-topic" element={<DeleteTopic />} />
        <Route path="appointments/:id/topic-deleted" element={<TopicDeleted />} />
        <Route path="appointments/:id/cancel" element={<CancelAppointment />} />
        <Route path="appointments/:id/cancelled" element={<AppointmentCancelled />} />
        <Route path="booking-conflict" element={<BookingConflict />} />
        <Route path="help" element={<Help />} />
      </Route>


      <Route path="/faculty" element={<Shell role="faculty" />}>
        <Route index element={<FacultyOverview />} />
        <Route path="consultations" element={<Consultations />} />
        <Route path="consultations/:id" element={<ConsultationDetails />} />
        <Route path="consultations/:id/updated" element={<ConsultationUpdated />} />
        <Route path="availability" element={<Availability />} />
        <Route path="availability/slots" element={<PublishedSlots />} />
        <Route path="availability/new" element={<SlotForm />} />
        <Route path="availability/:id/edit" element={<SlotForm />} />
        <Route path="availability/:id/remove" element={<RemoveSlot />} />
        <Route path="availability/saved" element={<AvailabilityOutcome />} />
        <Route path="availability/removed" element={<AvailabilityOutcome removed />} />
        <Route path="help" element={<FacultyHelp />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
