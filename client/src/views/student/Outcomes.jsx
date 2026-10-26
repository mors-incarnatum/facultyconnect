import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useApp, useDetailed } from "../../state/AppContext.jsx";
import { Field, PageHead, StatusBadge, modeLabel } from "../../components/ui.jsx";
import { useState } from "react";
import { fmtLong, fmtRange } from "../../utils/format.js";

function useAppt() {
  const { id } = useParams();
  const { getAppointment } = useApp();
  const detail = useDetailed();
  const a = getAppointment(id);
  return a ? detail(a) : null;
}
const NotFound = () => (
  <>
    <PageHead title="Appointment not found" subtitle="It may have been removed." />
    <Link className="btn primary" to="/student/appointments">Back to my appointments</Link>
  </>
);
const topicLine = (a) => (a.topic ? `${a.subject} · ${a.topic}` : "No topic added");

export function RequestSubmitted() {
  const a = useAppt();
  if (!a) return <NotFound />;
  return (
    <>
      <PageHead title="Your request has been sent" subtitle="Your time is reserved while you wait for faculty approval." />
      <div className="card" style={{ padding: 32 }}>
        <StatusBadge status="pending" />
        <h2 style={{ fontSize: 38, margin: "18px 0 10px" }}>{fmtLong(a.slot.date)} · {fmtRange(a.slot.start, a.slot.end)}</h2>
        <h3 style={{ fontSize: 26, margin: "0 0 14px" }}>{a.faculty.name} · {a.faculty.department}</h3>
        <p className="muted">{modeLabel(a.slot)} · {a.slot.location}</p>
        <hr className="divider" />
        <strong>{topicLine(a)}</strong>
        {a.description && <p className="muted" style={{ marginTop: 10 }}>{a.description}</p>}
        <div className="notice" style={{ margin: "20px 0", padding: 24 }}>
          <h3 style={{ fontSize: 24, marginBottom: 10 }}>What happens next</h3>
          The selected slot is reserved. Your faculty member will review the request; the consultation remains pending until approved.
        </div>
        <div className="btn-row" style={{ marginTop: 0 }}>
          <Link className="btn primary" to="/student">Back to overview</Link>
          <Link className="btn" to={`/student/appointments?id=${a.id}`}>View my appointments</Link>
        </div>
      </div>
    </>
  );
}

export function EditTopic() {
  const a = useAppt();
  const { updateTopic } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState(a ? { subject: a.subject, topic: a.topic || "", description: a.description || "" } : null);
  const [error, setError] = useState("");
  if (!a) return <NotFound />;
  const editable = a.status === "pending" || a.status === "confirmed";
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.topic.trim()) return setError("Subject and topic are required.");
    updateTopic(a.id, { subject: form.subject.trim(), topic: form.topic.trim(), description: form.description.trim() });
    navigate(`/student/appointments/${a.id}/topic-updated`);
  };
  return (
    <>
      <PageHead title="Edit consultation topic" subtitle="Update what you would like to discuss before the consultation." />
      {!editable ? (
        <div className="card"><div className="notice warn">Topics can only be changed for pending or confirmed appointments.</div>
          <div className="btn-row"><Link className="btn" to={`/student/appointments?id=${a.id}`}>Back</Link></div></div>
      ) : (
        <form className="card" onSubmit={submit} noValidate>
          <h2 style={{ fontSize: 26, marginBottom: 16 }}>{a.faculty.name} · {fmtLong(a.slot.date)} · {fmtRange(a.slot.start, a.slot.end)}</h2>
          {error && <div className="form-error" role="alert">{error}</div>}
          <Field label="Subject / course" value={form.subject} onChange={set("subject")} />
          <Field label="Consultation topic" value={form.topic} onChange={set("topic")} />
          <Field label="Description" as="textarea" value={form.description} onChange={set("description")} />
          <div className="btn-row" style={{ marginTop: 0 }}>
            <button className="btn primary" type="submit">Save topic changes</button>
            <Link className="btn" to={`/student/appointments?id=${a.id}`}>Cancel</Link>
            {a.topic && <Link className="btn" style={{ border: 0 }} to={`/student/appointments/${a.id}/delete-topic`}>Delete topic</Link>}
          </div>
        </form>
      )}
    </>
  );
}

export function TopicUpdated() {
  const a = useAppt();
  if (!a) return <NotFound />;
  return (
    <>
      <PageHead title="Consultation topic updated" subtitle="Your faculty member can view the revised topic before your meeting." />
      <div className="card">
        <StatusBadge status={a.status} />
        <h2 style={{ fontSize: 26, margin: "14px 0" }}>{a.faculty.name} · {fmtLong(a.slot.date)} · {fmtRange(a.slot.start, a.slot.end)}</h2>
        <strong>{topicLine(a)}</strong>
        {a.description && <p className="muted" style={{ marginTop: 10 }}>{a.description}</p>}
        <div className="btn-row"><Link className="btn primary" to={`/student/appointments?id=${a.id}`}>Back to my appointments</Link></div>
      </div>
    </>
  );
}

export function DeleteTopic() {
  const a = useAppt();
  const { deleteTopic } = useApp();
  const navigate = useNavigate();
  if (!a) return <NotFound />;
  return (
    <>
      <PageHead title="Delete this consultation topic?" subtitle="Your appointment will remain scheduled." />
      <div className="card">
        {a.topic ? (
          <>
            <h2 style={{ fontSize: 26, marginBottom: 10 }}>{topicLine(a)}</h2>
            <p className="muted" style={{ marginBottom: 14 }}>{a.description}</p>
            <p>Deleting removes the consultation topic and description. It does not cancel your appointment.</p>
            <div className="btn-row">
              <button className="btn primary" onClick={() => { deleteTopic(a.id); navigate(`/student/appointments/${a.id}/topic-deleted`); }}>Delete topic</button>
              <Link className="btn" to={`/student/appointments?id=${a.id}`}>Keep topic</Link>
            </div>
          </>
        ) : (
          <><p>This appointment has no topic to delete.</p><div className="btn-row"><Link className="btn" to={`/student/appointments?id=${a.id}`}>Back</Link></div></>
        )}
      </div>
    </>
  );
}

export function TopicDeleted() {
  const a = useAppt();
  if (!a) return <NotFound />;
  return (
    <>
      <PageHead title="Consultation topic deleted" subtitle="Your appointment is still scheduled." />
      <div className="card">
        <StatusBadge status={a.status} />
        <h2 style={{ fontSize: 26, margin: "14px 0" }}>{a.faculty.name} · {fmtLong(a.slot.date)} · {fmtRange(a.slot.start, a.slot.end)}</h2>
        <p className="muted">No topic added. You can add one again at any time before the consultation.</p>
        <div className="btn-row">
          <Link className="btn primary" to={`/student/appointments?id=${a.id}`}>Back to my appointments</Link>
          <Link className="btn" to={`/student/appointments/${a.id}/edit-topic`}>Add a topic</Link>
        </div>
      </div>
    </>
  );
}

export function CancelAppointment() {
  const a = useAppt();
  const { setStatus } = useApp();
  const navigate = useNavigate();
  if (!a) return <NotFound />;
  const active = a.status === "pending" || a.status === "confirmed";
  return (
    <>
      <PageHead title="Cancel this appointment?" subtitle="The time slot will become available to other students." />
      <div className="card">
        <StatusBadge status={a.status} />
        <h2 style={{ fontSize: 26, margin: "14px 0 6px" }}>{a.faculty.name}</h2>
        <p style={{ fontWeight: 600 }}>{fmtLong(a.slot.date)} · {fmtRange(a.slot.start, a.slot.end)}</p>
        <p className="muted" style={{ margin: "6px 0 18px" }}>{topicLine(a)}</p>
        {active ? (
          <>
            <div className="notice warn">Cancelling lets {a.faculty.name} know you can no longer attend. You can request another time afterwards.</div>
            <div className="btn-row">
              <button className="btn danger" onClick={() => { setStatus(a.id, "cancelled"); navigate(`/student/appointments/${a.id}/cancelled`); }}>Confirm cancellation</button>
              <Link className="btn" to={`/student/appointments?id=${a.id}`}>Keep appointment</Link>
            </div>
          </>
        ) : (
          <><p>This appointment is already {a.status} and can no longer be cancelled.</p><div className="btn-row"><Link className="btn" to={`/student/appointments?id=${a.id}`}>Back</Link></div></>
        )}
      </div>
    </>
  );
}

export function AppointmentCancelled() {
  const a = useAppt();
  if (!a) return <NotFound />;
  return (
    <>
      <PageHead title="Appointment cancelled" subtitle="The record stays in your previous appointments." />
      <div className="card">
        <StatusBadge status={a.status} />
        <h2 style={{ fontSize: 26, margin: "14px 0" }}>{a.faculty.name} · {fmtLong(a.slot.date)} · {fmtRange(a.slot.start, a.slot.end)}</h2>
        <p className="muted">Need another time? Browse open consultation slots.</p>
        <div className="btn-row">
          <Link className="btn primary" to={`/student/appointments?id=${a.id}`}>View the cancelled record</Link>
          <Link className="btn" to="/student">Back to overview</Link>
          <Link className="btn" to="/student/faculty">Find faculty</Link>
        </div>
      </div>
    </>
  );
}

export function BookingConflict() {
  const [params] = useSearchParams();
  const { getSlot, getFaculty, availableSlotsFor, setSelection } = useApp();
  const navigate = useNavigate();
  const slot = getSlot(params.get("slot"));
  const f = slot && getFaculty(slot.facultyId);
  const others = f ? availableSlotsFor(f.id).filter((s) => s.id !== slot.id).slice(0, 3) : [];
  return (
    <>
      <PageHead title="That time was just taken" subtitle="Another student reserved this slot before your request was submitted." />
      <div className="card">
        <span className="badge pending">Slot reserved</span>
        {slot && <h2 style={{ fontSize: 26, margin: "14px 0 6px" }}>{f.name} · {fmtLong(slot.date)} · {fmtRange(slot.start, slot.end)}</h2>}
        <p className="muted" style={{ marginBottom: 18 }}>Slots are checked again when you submit, so two students can never hold the same time.</p>
        {others.length > 0 && (
          <>
            <strong>Other times with {f.name}</strong>
            <div className="btn-row" style={{ marginTop: 10 }}>
              {others.map((s) => <Link key={s.id} className="btn sm" to={`/student/request?slot=${s.id}`}>{fmtLong(s.date)} · {fmtRange(s.start, s.end)}</Link>)}
            </div>
          </>
        )}
        <div className="btn-row">
          <button className="btn primary" onClick={() => { if (f) setSelection({ facultyId: f.id, slotId: others[0]?.id || null }); navigate("/student/faculty/calendar"); }}>Choose another time</button>
          <Link className="btn" to="/student">Back to overview</Link>
        </div>
      </div>
    </>
  );
}
