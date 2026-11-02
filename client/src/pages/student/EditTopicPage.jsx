import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp.js';
import Field from '../../components/Field.jsx';
import PageHead from '../../components/PageHead.jsx';
import { fmtLong, fmtRange } from '../../utils/format.js';
import { useAppointment } from '../../hooks/useAppointments.js';
import AppointmentNotFound from '../../components/AppointmentNotFound.jsx';

const EditTopicPage = () => {
  const a = useAppointment();
  const { state } = useLocation();
  const { updateTopic } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState(a ? { subject: a.subject, topic: a.topic || "", description: a.description || "" } : null);
  const [error, setError] = useState("");
  if (!a) return <AppointmentNotFound />;
  const editable = a.status === "pending" || a.status === "confirmed";
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.topic.trim()) return setError("Subject and topic are required.");
    updateTopic(a.id, { subject: form.subject.trim(), topic: form.topic.trim(), description: form.description.trim() });
    navigate(state?.returnTo || `/student/appointments?id=${a.id}`, { state: { returnScroll: state?.returnScroll, feedback: "Consultation topic updated for this demo. Changes reset on reload." } });
  };
  return (
    <>
      <PageHead title="Edit consultation topic" subtitle="Update what you would like to discuss before the consultation." />
      {!editable ? (
        <div className="card"><div className="notice warn">Topics can only be changed for pending or confirmed appointments.</div>
          <div className="btn-row"><Link className="btn" to={`/student/appointments?id=${a.id}`}>Back</Link></div></div>
      ) : (
        <form className="card" onSubmit={handleSubmit} noValidate>
          <h2 style={{ fontSize: 26, marginBottom: 16 }}>{a.faculty.name} · {fmtLong(a.slot.date)} · {fmtRange(a.slot.start, a.slot.end)}</h2>
          {error && <div className="form-error" role="alert">{error}</div>}
          <Field name="subject" label="Subject / course" value={form.subject} onChange={handleChange} />
          <Field name="topic" label="Consultation topic" value={form.topic} onChange={handleChange} />
          <Field name="description" label="Description" as="textarea" value={form.description} onChange={handleChange} />
          <div className="btn-row" style={{ marginTop: 0 }}>
            <button className="btn primary" type="submit">Save topic changes</button>
            <Link className="btn" to={`/student/appointments?id=${a.id}`}>Cancel</Link>
            {a.topic && <Link className="btn" style={{ border: 0 }} to={`/student/appointments/${a.id}/delete-topic`}>Delete topic</Link>}
          </div>
        </form>
      )}
    </>
  );
};

export default EditTopicPage;
