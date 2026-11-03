import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../hooks/useApp.js';
import Field from '../../components/Field.jsx';
import PageHead from '../../components/PageHead.jsx';
import MissingRecord from '../../components/MissingRecord.jsx';

const SlotFormPage = () => {
  const { id } = useParams();
  const { today, user, getSlot, holderOf, saveFacultySlot, setFeedback } = useApp();
  const navigate = useNavigate();
  const slot = id ? getSlot(id) : null;
  const [form, setForm] = useState(() => slot ? { ...slot } : {
    date: today,
    start: '14:00',
    end: '14:30',
    mode: 'in-person',
    location: user.office,
  });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setError('');
  };

  const validate = () => {
    const newErrors = {};
    for (const name of ['date', 'start', 'end', 'location']) {
      if (!form[name]?.trim()) {
        const label = name === 'location' ? 'a location or meeting details' : `a valid ${name} date/time`;
        newErrors[name] = `Enter ${label}.`;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const focusInvalidField = (formElement) => {
    requestAnimationFrame(() => formElement.querySelector('[aria-invalid="true"]')?.focus());
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!validate()) {
      focusInvalidField(formElement);
      return;
    }
    const result = saveFacultySlot(form, id);
    if (!result.ok) {
      const field = /date/i.test(result.error) ? 'date' : /location/i.test(result.error) ? 'location' : 'end';
      setErrors({ [field]: result.error });
      setError(result.error);
      focusInvalidField(formElement);
      return;
    }
    const feedback = 'Availability published in this demo. Changes reset on reload.';
    setFeedback(feedback);
    navigate('/faculty/availability/slots', { state: { feedback } });
  };

  if (id && (!slot || slot.facultyId !== user.id)) return <MissingRecord availability />;
  const occupied = id && holderOf(id);

  return (
    <>
      <PageHead title={id ? 'Edit availability' : 'Create consultation availability'} subtitle="Set the date and time students can request." />
      <div className="toolbar"><Link to="/faculty/availability/slots">← Back to my availability</Link></div>
      <div className="two-col">
        <form className="card" onSubmit={handleSubmit} noValidate>
          <h2 className="section-title">Consultation schedule</h2>
          {error && <div className="form-error" role="alert">{error}</div>}
          {occupied ? (
            <div className="notice warn">This slot is reserved. <Link to={`/faculty/consultations/${occupied.id}`}>View appointment</Link></div>
          ) : (
            <>
              <Field name="date" error={errors.date} label="Date" type="date" min={today} required value={form.date} onChange={handleChange} />
              <div className="field-row">
                <Field name="start" error={errors.start} label="Start time" type="time" required value={form.start} onChange={handleChange} />
                <Field name="end" error={errors.end} label="End time" type="time" required value={form.end} onChange={handleChange} />
              </div>
              <Field name="mode" label="Consultation mode" as="select" value={form.mode} onChange={handleChange}>
                <option value="in-person">In person</option>
                <option value="online">Online</option>
              </Field>
              <Field name="location" error={errors.location} label="Location / meeting details" required value={form.location} onChange={handleChange} />
              <p className="muted small">One appointment per slot · 30-minute consultations.</p>
              <div className="btn-row">
                <button className="btn primary" type="submit">{id ? 'Save changes' : 'Publish availability'}</button>
                <Link className="btn" to="/faculty/availability/slots">Cancel</Link>
              </div>
            </>
          )}
        </form>
        <aside className="card tint">
          <h2>Keep availability current</h2>
          <p className="faculty-spaced">Students see published dates and time slots when they browse your profile. Changes are reflected in their availability view.</p>
          <p className="muted small">Review any existing appointment before changing an occupied slot.</p>
        </aside>
      </div>
    </>
  );
};

export default SlotFormPage;
