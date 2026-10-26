import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../../state/AppContext.jsx";
import { Avatar, Field, PageHead, modeLabel } from "../../components/ui.jsx";
import { fmtLong, fmtRange } from "../../utils/format.js";

export default function Request() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, getSlot, getFaculty, isAvailable, createAppointment } = useApp();
  const slot = getSlot(params.get("slot"));
  const f = slot && getFaculty(slot.facultyId);
  const [form, setForm] = useState({ subject: "", topic: "", description: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (!slot) {
    return (
      <>
        <PageHead title="Request a consultation" subtitle="Choose a time first." />
        <Link className="btn primary" to="/student/faculty">Find faculty →</Link>
      </>
    );
  }
  const taken = !isAvailable(slot);

  const submit = (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.topic.trim()) return setError("Add a subject or course and a topic so your faculty member can prepare.");
    const res = createAppointment({ studentId: user.id, slotId: slot.id, subject: form.subject.trim(), topic: form.topic.trim(), description: form.description.trim() });
    if (!res.ok) return navigate(`/student/booking-conflict?slot=${slot.id}`);
    navigate(`/student/request/submitted/${res.id}`);
  };

  return (
    <>
      <PageHead title="Request a consultation" subtitle="Review your selected time and tell your faculty member what you would like to discuss." />
      <p style={{ marginBottom: 20 }}><Link to="/student/faculty/calendar">← Back to availability</Link></p>
      <div className="two-col">
        <form className="card" onSubmit={submit} noValidate>
          <h2 style={{ marginBottom: 16 }}>What would you like to discuss?</h2>
          {error && <div className="form-error" role="alert">{error}</div>}
          {taken && <div className="form-error" role="alert">This time is no longer available. Submitting will show you other options.</div>}
          <Field label="Subject / course" value={form.subject} onChange={set("subject")} list="courses" placeholder="CS 201 · Data Structures" />
          <datalist id="courses">{f.courses.map((c) => <option key={c} value={c} />)}</datalist>
          <Field label="Consultation topic" value={form.topic} onChange={set("topic")} placeholder="Help understanding recursion" />
          <Field label="Description" as="textarea" value={form.description} onChange={set("description")} placeholder="Share what you have tried and what you would like to cover." />
          <div className="notice">Submitting reserves this slot. Your meeting is confirmed after the faculty approves your request.</div>
          <div className="btn-row">
            <button className="btn primary" type="submit">Submit request →</button>
            <button type="button" className="btn" onClick={() => navigate(-1)}>Back</button>
          </div>
        </form>
        <aside className="card preview">
          <div className="eyebrow">Your selected time</div>
          <div style={{ margin: "14px 0" }}><Avatar person={f} size="lg" /></div>
          <h3 style={{ fontSize: 24 }}>{f.name}</h3>
          <p className="muted" style={{ margin: "6px 0 0" }}>{f.department}</p>
          <hr className="divider" />
          <div className="when-big" style={{ marginTop: 0 }}>{fmtLong(slot.date)}</div>
          <div className="time-big">{fmtRange(slot.start, slot.end)}</div>
          <p className="muted" style={{ marginBottom: 16 }}>{modeLabel(slot)} · 30 minutes<br />{slot.location}</p>
          <Link className="btn block" to="/student/faculty/calendar">Change time</Link>
        </aside>
      </div>
    </>
  );
}
