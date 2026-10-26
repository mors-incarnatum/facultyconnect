import { Navigate, Route, Routes } from "react-router-dom";
import Shell from "./components/Shell.jsx";
import Index from "./views/public/Index.jsx";
import Login from "./views/public/Login.jsx";
import Register, { RegisterSuccess } from "./views/public/Register.jsx";
import Overview from "./views/student/Overview.jsx";
import FacultySearch from "./views/student/FacultySearch.jsx";
import FacultyProfile from "./views/student/FacultyProfile.jsx";
import Request from "./views/student/Request.jsx";
import Appointments from "./views/student/Appointments.jsx";
import Help from "./views/student/Help.jsx";
import {
  AppointmentCancelled, BookingConflict, CancelAppointment, DeleteTopic, EditTopic,
  RequestSubmitted, TopicDeleted, TopicUpdated,
} from "./views/student/Outcomes.jsx";

export default function App() {
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


      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
