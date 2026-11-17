import { Navigate, Route, Routes } from 'react-router-dom';
import Shell from './layout/Shell.jsx';
import Index from '../views/HomePage.jsx';
import Login from '../views/LoginPage.jsx';
import Register from '../views/RegisterPage.jsx';
import RegisterSuccess from '../views/RegisterSuccessPage.jsx';
import Overview from '../views/student/StudentOverviewPage.jsx';
import FacultySearch from '../views/student/FacultySearchPage.jsx';
import FacultyProfile from '../views/student/FacultyProfilePage.jsx';
import Request from '../views/student/RequestPage.jsx';
import Appointments from '../views/student/AppointmentsPage.jsx';
import Help from '../views/student/StudentHelpPage.jsx';
import FacultyOverview from '../views/faculty/FacultyOverviewPage.jsx';
import Consultations from '../views/faculty/ConsultationsPage.jsx';
import ConsultationDetails from '../views/faculty/ConsultationDetailsPage.jsx';
import ConsultationUpdated from '../views/faculty/ConsultationUpdatedPage.jsx';
import Availability from '../views/faculty/AvailabilityPage.jsx';
import PublishedSlots from '../views/faculty/PublishedSlotsPage.jsx';
import SlotForm from '../views/faculty/SlotFormPage.jsx';
import RemoveSlot from '../views/faculty/RemoveSlotPage.jsx';
import AvailabilityOutcome from '../views/faculty/AvailabilityOutcomePage.jsx';
import FacultyHelp from '../views/faculty/FacultyHelpPage.jsx';
import AppointmentCancelled from '../views/student/AppointmentCancelledPage.jsx';
import BookingConflict from '../views/student/BookingConflictPage.jsx';
import CancelAppointment from '../views/student/CancelAppointmentPage.jsx';
import DeleteTopic from '../views/student/DeleteTopicPage.jsx';
import EditTopic from '../views/student/EditTopicPage.jsx';
import RequestSubmitted from '../views/student/RequestSubmittedPage.jsx';
import TopicDeleted from '../views/student/TopicDeletedPage.jsx';
import TopicUpdated from '../views/student/TopicUpdatedPage.jsx';

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
                <Route path="availability/new" element={<Navigate to="/faculty/availability#add-slot" replace />} />
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
