import { Link, useParams } from "react-router-dom";
import { useApp, useDetailed } from "../../state/AppContext.jsx";
import { PageHead, StatusBadge, modeLabel } from "../../components/ui.jsx";
import { fmtLong, fmtRange } from "../../utils/format.js";

export const STATUSES = ["pending", "confirmed", "completed", "declined", "cancelled"];
export function useFacultyRecords() {
  const { user, appointments } = useApp();
  const detail = useDetailed();
  return appointments.map(detail).filter((a) => a.slot?.facultyId === user.id)
    .sort((a, b) => (a.slot.date + a.slot.start).localeCompare(b.slot.date + b.slot.start));
}
export function useFacultyAppointment() {
  const { id } = useParams();
  return useFacultyRecords().find((a) => a.id === id);
}
export function MissingRecord({ availability = false }) {
  return <><PageHead title={availability ? "Time slot unavailable" : "Consultation not found"} subtitle="This record is no longer available in your workspace." /><Link className="btn" to={availability ? "/faculty/availability/slots" : "/faculty/consultations"}>Back to {availability ? "availability" : "consultations"}</Link></>;
}
export function AppointmentSummary({ appointment: a, children }) {
  return <div className="card detail">
    <StatusBadge status={a.status} /><h3>{a.student.name}</h3>
    <p className="muted">Student · {a.student.email}</p><hr className="divider" />
    <h2>{fmtLong(a.slot.date)} · {fmtRange(a.slot.start, a.slot.end)}</h2>
    <p className="muted faculty-spaced">{modeLabel(a.slot)} · {a.slot.location}</p>
    <strong>{a.subject}{a.topic ? ` · ${a.topic}` : ""}</strong>
    <p className="muted faculty-spaced">{a.topic ? a.description : "No topic added."}</p>{children}
  </div>;
}
