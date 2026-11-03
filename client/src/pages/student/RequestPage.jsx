import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../hooks/useApp.js';
import Avatar from '../../components/Avatar.jsx';
import Field from '../../components/Field.jsx';
import PageHead from '../../components/PageHead.jsx';
import BookingStepper from '../../components/BookingStepper.jsx';
import { modeLabel } from '../../utils/presentation.js';
import { fmtLong, fmtRange } from '../../utils/format.js';

const RequestPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user, getSlot, getFaculty, isAvailable, createAppointment } = useApp();
  const slot = getSlot(params.get("slot"));
  const f = slot && getFaculty(slot.facultyId);
  const [form, setForm] = useState(() => state?.draft || { subject: "", topic: "", description: "" });
  const [errors, setErrors] = useState({});
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  if (!slot) {
    return (
      <>
        <PageHead title="Request a consultation" subtitle="Choose a time first." />
        <Link className="btn primary" to="/student/faculty">Find faculty →</Link>
      </>
    );
  }
  const taken = !isAvailable(slot);
  const changeTime = `/student/faculty/calendar?faculty=${slot.facultyId}&slot=${slot.id}`;
  const backTo = state?.returnTo || `/student/faculty/${slot.facultyId}`;
  const draftState = { ...state, draft: form };

  const validate = () => {
    const newErrors = {};
    if (!form.subject.trim()) newErrors.subject = 'Enter the subject or course for this consultation.';
    if (!form.topic.trim()) newErrors.topic = 'Enter a topic so your faculty member can prepare.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!validate()) {
      requestAnimationFrame(() => formElement.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    const res = createAppointment({
      studentId: user.id,
      slotId: slot.id,
      subject: form.subject.trim(),
      topic: form.topic.trim(),
      description: form.description.trim(),
    });
    if (!res.ok) return navigate(`/student/booking-conflict?slot=${slot.id}`, { state: draftState });
    navigate(`/student/request/submitted/${res.id}`);
  };

  return (
    <>
      <PageHead title="Request a consultation" subtitle="Review your selected time and specify your consultation topic." />
      <BookingStepper />
      <div className="two-col request-workspace">
        <form className="card request-form" onSubmit={handleSubmit} noValidate>
          <h2>What would you like to discuss?</h2>

          {taken && <div className="form-error" role="alert">This time is no longer available. <Link to={changeTime} state={draftState}>Choose another time</Link>; your topic will be kept.</div>}
          <Field name="subject" required error={errors.subject} label="Subject / course" value={form.subject} onChange={handleChange} list="courses" placeholder="CCDSALG · Data Structures and Algorithms" />
          <datalist id="courses">{f.courses.map((c) => <option key={c} value={c} />)}</datalist>
          <Field name="topic" required error={errors.topic} label="Consultation topic" value={form.topic} onChange={handleChange} placeholder="Help understanding recursion" />
          <Field name="description" label="Preparation notes (optional)" as="textarea" value={form.description} onChange={handleChange} placeholder="Share what you have tried and what you would like to cover." />
          <p className="muted small">Submitting reserves this slot. Your meeting is confirmed after the faculty approves your request.</p>
          <div className="btn-row">
            <button className="btn primary" type="submit" disabled={taken}>Submit request →</button>
            <Link className="btn" to={backTo} state={draftState}>Back to Availability</Link>
          </div>
        </form>
        <aside className="card preview request-preview">
          <div className="eyebrow">Your selected time</div>
          <div style={{ margin: "14px 0" }}><Avatar person={f} size="lg" /></div>
          <h3 style={{ fontSize: 24, margin: "0 0 4px" }}>
            {f.name}
          </h3>
          {f.pronouns && <p className="muted small">{f.pronouns}</p>}
          <p className="muted" style={{ margin: "2px 0 10px" }}>{f.rank} · {f.department}</p>
          {f.consultationTip && (
            <div className="profile-tip" style={{ margin: "10px 0", fontSize: 12, padding: "8px 10px" }}>
              <div><strong>Prep tip:</strong> {f.consultationTip}</div>
            </div>
          )}
          <hr className="divider" />
          <div className="when-big" style={{ marginTop: 0 }}>{fmtLong(slot.date)}</div>
          <div className="time-big">{fmtRange(slot.start, slot.end)}</div>
          <p className="muted" style={{ marginBottom: 16 }}>{modeLabel(slot)} · 30 minutes<br />{slot.location}</p>
          <Link className="btn block" to={changeTime} state={draftState}>Change time</Link>
        </aside>
      </div>
    </>
  );
};

export default RequestPage;
