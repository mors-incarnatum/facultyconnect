import { useState } from 'react';
import { useApp } from '../../hooks/useApp.js';
import { intervalsOf } from '../../state/availability.js';
import Field from '../../components/Field.jsx';
import PageHead from '../../components/PageHead.jsx';
import AvailabilityTabs from '../../components/AvailabilityTabs.jsx';
import { fmtShort, addDays } from '../../utils/format.js';

const AvailabilityPage = () => {
  const { today, facultySchedule, saveFacultySchedule, scheduleDraft, setScheduleDraft, setFeedback } = useApp();
  const [date, setDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [copyFrom, setCopyFrom] = useState('0');
  const [copyDays, setCopyDays] = useState([]);
  const [error, setError] = useState('');
  const draft = scheduleDraft || facultySchedule;
  const isDirty = !!scheduleDraft;
  const lastDate = addDays(today, 27);

  const changeDraft = (next) => {
    setScheduleDraft(next);
    setError('');
  };

  const updateDay = (dayIndex, fields) => {
    changeDraft({
      ...draft,
      weekly: draft.weekly.map((row, index) => index === dayIndex ? { ...row, ...fields } : row),
    });
  };

  const handleIntervalChange = (dayIndex, intervalIndex, event) => {
    const { name, value } = event.target;
    const intervals = intervalsOf(draft.weekly[dayIndex]).map((interval, index) => (
      index === intervalIndex ? { ...interval, [name]: value } : interval
    ));
    updateDay(dayIndex, { intervals });
  };

  const handleCopyDayChange = (dayIndex, isChecked) => {
    setCopyDays((prev) => isChecked ? [...prev, dayIndex] : prev.filter((day) => day !== dayIndex));
  };

  const handleCopyHours = () => {
    const source = draft.weekly[Number(copyFrom)];
    changeDraft({
      ...draft,
      weekly: draft.weekly.map((row, index) => copyDays.includes(index) ? {
        ...row,
        enabled: source.enabled,
        intervals: structuredClone(intervalsOf(source)),
      } : row),
    });
  };

  const handleStartDateChange = (event) => {
    const { value } = event.target;
    setDate(value);
    setEndDate((prev) => prev < value ? value : prev);
  };

  const handleAddException = () => {
    if (!date || !endDate || date < today || endDate < date || endDate > lastDate) {
      setError('Choose an exception range within the next four weeks.');
      return;
    }
    changeDraft({ ...draft, exceptions: [...draft.exceptions, { start: date, end: endDate }] });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = saveFacultySchedule(draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setFeedback('Availability published for this demo. Changes reset on reload.');
  };

  const handleDiscard = () => {
    setScheduleDraft(null);
    setError('');
    setFeedback('Draft discarded. Published schedule retained.');
  };

  return (
    <>
      <PageHead title="Availability manager" subtitle="Set weekly consultation hours, manage date exceptions, and publish your availability." />
      <AvailabilityTabs><span className={`schedule-state ${isDirty ? 'dirty' : ''}`} role="status">{isDirty ? 'Unsaved draft · retained during navigation' : 'Published schedule'}</span></AvailabilityTabs>
      <form onSubmit={handleSubmit}>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="faculty-manager">
          <section className="card recurring-hours">
            <h2>Weekly recurring hours</h2>
            <p className="muted small schedule-help">Monday–Friday · 30-minute consultations · Campus local time</p>
            {draft.weekly.map((row, dayIndex) => {
              const intervals = intervalsOf(row);
              return (
                <div className="schedule-day" role="group" aria-label={`${row.day} hours`} key={row.day}>
                  <span className="schedule-day-label">{row.day}</span>
                  <button className={`btn day-toggle ${row.enabled ? 'primary' : ''}`} type="button" aria-label={`${row.day} availability`} aria-pressed={row.enabled} onClick={() => updateDay(dayIndex, { enabled: !row.enabled })}>
                    {row.enabled ? '● On' : '○ Off'}
                  </button>
                  <div className="schedule-intervals">{intervals.map((interval, intervalIndex) => (
                    <div className="schedule-interval" key={intervalIndex}>
                      {['start', 'end'].map((name) => (
                        <Field
                          key={name}
                          name={name}
                          label={`${row.day} ${name} ${intervalIndex + 1}`}
                          className="time-field"
                          type="time"
                          disabled={!row.enabled}
                          required={row.enabled}
                          value={interval[name]}
                          onChange={(event) => handleIntervalChange(dayIndex, intervalIndex, event)}
                        />
                      ))}
                      {intervalIndex > 0 && <button
                        type="button"
                        className="btn interval-remove"
                        disabled={!row.enabled || intervals.length === 1}
                        aria-label={`Remove ${row.day} interval ${intervalIndex + 1}`}
                        onClick={() => updateDay(dayIndex, { intervals: intervals.filter((_, index) => index !== intervalIndex) })}
                      >
                        Remove
                      </button>}
                    </div>
                  ))}</div>
                  <button type="button" className="btn interval-add" aria-label={`Add ${row.day} interval`} disabled={!row.enabled} onClick={() => updateDay(dayIndex, { intervals: [...intervals, { start: '15:00', end: '16:00' }] })}>
                    + Interval
                  </button>
                </div>
              );
            })}
            <fieldset className="schedule-copy">
              <legend className="sr-only">Copy hours to selected days</legend>
              <Field label="Copy from" className="time-field" as="select" value={copyFrom} onChange={(event) => setCopyFrom(event.target.value)}>
                {draft.weekly.map((row, index) => <option key={row.day} value={index}>From {row.day}</option>)}
              </Field>
              <div className="copy-days">
                {draft.weekly.map((row, index) => (
                  <label key={row.day}>
                    <input type="checkbox" checked={copyDays.includes(index)} onChange={(event) => handleCopyDayChange(index, event.target.checked)} />
                    {row.day.slice(0, 3)}
                  </label>
                ))}
              </div>
              <button type="button" className="btn" disabled={!copyDays.length} onClick={handleCopyHours}>Copy hours</button>
            </fieldset>
            <Field label="Location" value={draft.location} onChange={(event) => changeDraft({ ...draft, location: event.target.value })} required />
            <div className="schedule-protection muted small">
              <strong>Occupied slots stay protected</strong>
              <p>Pending, confirmed, and historical appointment slots stay unchanged, including within blocked date ranges. Exceptions remove only unreferenced times in the next four weeks.</p>
            </div>
          </section>
          <section className="card">
            <h2>Date-specific overrides</h2>
            <p className="muted faculty-spaced">Block exam weeks, holidays, or one day.</p>
            <Field label="Exception start date" type="date" min={today} max={lastDate} value={date} onChange={handleStartDateChange} />
            <Field label="Exception end date" type="date" min={date} max={lastDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            <button className="btn block" type="button" onClick={handleAddException}>Add exception</button>
            <ul className="exception-list">
              {draft.exceptions.map((exception, index) => (
                <li key={index}>
                  <span>{typeof exception === 'string' ? fmtShort(exception) : `${fmtShort(exception.start)} – ${fmtShort(exception.end)}`} · Unavailable</span>
                  <button type="button" className="link-btn" aria-label={`Remove exception ${index + 1}`} onClick={() => changeDraft({ ...draft, exceptions: draft.exceptions.filter((_, otherIndex) => otherIndex !== index) })}>Remove</button>
                </li>
              ))}
            </ul>
            <p className="muted small">{draft.exceptions.length ? `${draft.exceptions.length} date exception(s).` : 'No exceptions added yet.'} Save changes publishes the next four weeks.</p>
          </section>
        </div>
        <div className="draft-controls">
          <button className="btn primary" type="submit">Save changes</button>
          <button className="btn" type="button" disabled={!isDirty} onClick={handleDiscard}>Discard draft</button>
          <span role="status">{isDirty ? 'Unsaved changes' : 'No unsaved changes'}</span>
        </div>
      </form>
    </>
  );
};

export default AvailabilityPage;
