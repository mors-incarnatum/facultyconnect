import { Link, useSearchParams } from "react-router-dom";
import { PageHead, StatusBadge } from "../../components/ui.jsx";
import { fmtShort, fmtRange } from "../../utils/format.js";
import { AppointmentSummary, MissingRecord, STATUSES, useFacultyAppointment, useFacultyRecords } from "./shared.jsx";
import StatusActions from "./StatusActions.jsx";

export default function Consultations() {
  const records = useFacultyRecords();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") || "";
  const list = records.filter((a) => !status || a.status === status);
  return <><PageHead title="Consultations" subtitle="Review requests, manage upcoming consultations, and view previous appointment records." />
    <div className="filters"><select aria-label="Filter consultations by status" value={status} onChange={(e) => setParams(e.target.value ? { status: e.target.value } : {})}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select></div>
    <section className="card"><h2>All consultation records</h2><p className="muted faculty-spaced">Pending, confirmed, completed, declined, and cancelled appointments.</p>
      {!list.length && <div className="empty"><h3>No consultations here</h3><p className="muted">Try another status filter.</p></div>}
      {list.map((a) => <div className="appt-row" key={a.id}><div><strong>{a.student.name} · {a.subject} · {a.topic || "No topic added"}</strong><span className="meta">{fmtShort(a.slot.date)} · {fmtRange(a.slot.start, a.slot.end)}</span></div><StatusBadge status={a.status} /><Link to={`/faculty/consultations/${a.id}`}>View details</Link></div>)}
    </section></>;
}

export function ConsultationDetails() {
  const a = useFacultyAppointment();
  if (!a) return <MissingRecord />;
  const active = ["pending", "confirmed"].includes(a.status);
  return <><PageHead title={a.status === "pending" ? "Consultation request" : "Consultation details"} subtitle="Review the student’s topic and update the appointment status." /><div className="two-col"><AppointmentSummary appointment={a}>{a.status === "pending" && <StatusActions appointment={a} compact />}</AppointmentSummary><aside className="card"><h2>Update status</h2><p className="muted faculty-spaced">{active ? "Choose the status that reflects this consultation." : `This consultation is ${a.status}. The record is retained in your history.`}</p>{active && <StatusActions appointment={a} />}<div className="btn-row"><Link to="/faculty/consultations">Back to consultations</Link></div></aside></div></>;
}

export function ConsultationUpdated() {
  const a = useFacultyAppointment();
  if (!a) return <MissingRecord />;
  const titles = { confirmed: "Request accepted", declined: "Request declined", completed: "Consultation completed", cancelled: "Consultation cancelled", pending: "Consultation request" };
  return <><PageHead title={titles[a.status]} subtitle="The appointment status is recorded for the student and faculty." /><AppointmentSummary appointment={a}><div className="notice">This consultation is marked {a.status} in the appointment record.</div><div className="btn-row"><Link className="btn primary" to="/faculty/consultations">View consultations</Link><Link className="btn" to="/faculty">Faculty overview</Link></div></AppointmentSummary></>;
}
