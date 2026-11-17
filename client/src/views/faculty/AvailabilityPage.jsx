import { useState } from 'react';
import { useApp } from '../../hooks/useApp.js';
import { intervalsOf } from '../../state/availability.js';
import Field from '../../components/Field.jsx';
import PageHead from '../../components/PageHead.jsx';
import AvailabilityTabs from '../../components/AvailabilityTabs.jsx';
import Modal from '../../components/Modal.jsx';
import { fmtShort, addDays, addMinutes } from '../../utils/format.js';

const AvailabilityPage = () => {
  const { today, user, facultySchedule, saveFacultySchedule, scheduleDraft, setScheduleDraft, setFeedback, saveFacultySlot } = useApp();
  const [date, setDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [activeCopyDay, setActiveCopyDay] = useState(null);
  const [copyTargetDays, setCopyTargetDays] = useState([]);
  const [error, setError] = useState('');
  const draft = scheduleDraft || facultySchedule;
  const isDirty = !!scheduleDraft;
  const publishWeeks = Number(draft.weeks) || 4;
  const lastDate = addDays(today, publishWeeks * 7 - 1);

  // Modal dialog state for "+ Add availability"
  const [showAddModal, setShowAddModal] = useState(() => {
    return window.location.search.includes('add=') || window.location.hash === '#add-slot';
  });
  const [slotForm, setSlotForm] = useState(() => ({
    date: today,
    start: '14:00',
    end: '14:30',
    mode: 'in-person',
    location: draft.location || user?.office || '',
  }));
  const [slotError, setSlotError] = useState('');

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

  const handleToggleCopyTarget = (dayIndex) => {
    setCopyTargetDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const handleApplyCopy = (sourceIndex, targetIndices) => {
    const source = draft.weekly[sourceIndex];
    changeDraft({
      ...draft,
      weekly: draft.weekly.map((row, index) =>
        targetIndices.includes(index)
          ? {
              ...row,
              enabled: source.enabled,
              intervals: structuredClone(intervalsOf(source)),
            }
          : row
      ),
    });
    setActiveCopyDay(null);
    setCopyTargetDays([]);
  };

  const handleStartDateChange = (event) => {
    const { value } = event.target;
    setDate(value);
    setEndDate((prev) => prev < value ? value : prev);
  };

  const handleAddException = () => {
    if (!date || !endDate || date < today || endDate < date || endDate > lastDate) {
      setError(`Choose an exception range within the next ${publishWeeks === 1 ? '1 week' : `${publishWeeks} weeks`}.`);
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
    setFeedback(`Availability published for the next ${publishWeeks === 1 ? '1 week' : `${publishWeeks} weeks`}. Changes reset on reload.`);
  };

  const handleDiscard = () => {
    setScheduleDraft(null);
    setError('');
    setActiveCopyDay(null);
    setCopyTargetDays([]);
    setFeedback('Draft discarded. Published schedule retained.');
  };

  const handleOpenAddModal = () => {
    setSlotForm({
      date: today,
      start: '14:00',
      end: '14:30',
      mode: 'in-person',
      location: draft.location || user?.office || '',
    });
    setSlotError('');
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setSlotError('');
  };

  const handleSlotChange = (event) => {
    const { name, value } = event.target;
    setSlotForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'start' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
        next.end = addMinutes(value, 30);
      }
      return next;
    });
    setSlotError('');
  };

  const handleSaveSlot = (event) => {
    event.preventDefault();
    if (!slotForm.date || !slotForm.start || !slotForm.end || !slotForm.location.trim()) {
      setSlotError('Enter a date, start time, end time, and location.');
      return;
    }
    const result = saveFacultySlot(slotForm);
    if (!result.ok) {
      setSlotError(result.error);
      return;
    }
    setShowAddModal(false);
    setFeedback(`Availability slot added for ${fmtShort(slotForm.date)} · ${slotForm.start} – ${slotForm.end}. Changes reset on reload.`);
  };

  return (
    <>
      <PageHead title="Availability manager" subtitle="Set weekly consultation hours, manage date exceptions, and add one-off availability." />
      <AvailabilityTabs>
        <button type="button" className="btn primary" onClick={handleOpenAddModal}>+ Add availability</button>
        <span className={`schedule-state ${isDirty ? 'dirty' : ''}`} role="status">
          {isDirty ? 'Unsaved draft · retained during navigation' : 'Published schedule'}
        </span>
      </AvailabilityTabs>
      <form onSubmit={handleSubmit}>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="faculty-manager">
          <section className="card recurring-hours">
            <h2>Weekly recurring hours</h2>
            <p className="muted small schedule-help">Monday–Friday · 30-minute consultations · Campus local time · Publishing {publishWeeks === 1 ? '1 week' : `${publishWeeks} weeks`}</p>
            {draft.weekly.map((row, dayIndex) => {
              const intervals = intervalsOf(row);
              const isCopyingThisDay = activeCopyDay === dayIndex;
              return (
                <div className="schedule-day" role="group" aria-label={`${row.day} hours`} key={row.day}>
                  <span className="schedule-day-label">{row.day}</span>
                  <button className={`btn day-toggle ${row.enabled ? 'primary' : ''}`} type="button" aria-label={`${row.day} availability`} aria-pressed={row.enabled} onClick={() => updateDay(dayIndex, { enabled: !row.enabled })}>
                    {row.enabled ? '● On' : '○ Off'}
                  </button>
                  <div className="schedule-intervals">
                    {intervals.map((interval, intervalIndex) => (
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
                        <div className="interval-actions">
                          {intervalIndex === 0 ? (
                            <>
                              <button
                                type="button"
                                className="btn interval-add"
                                aria-label={`Add ${row.day} interval`}
                                disabled={!row.enabled}
                                onClick={() => updateDay(dayIndex, { intervals: [...intervals, { start: '15:00', end: '16:00' }] })}
                              >
                                + Interval
                              </button>
                              <button
                                type="button"
                                className={`btn copy-btn ${isCopyingThisDay ? 'active' : ''}`}
                                aria-label={`Copy ${row.day} hours to other days`}
                                aria-expanded={isCopyingThisDay}
                                disabled={!row.enabled}
                                title={`Copy ${row.day} hours to other days`}
                                onClick={() => {
                                  setActiveCopyDay(isCopyingThisDay ? null : dayIndex);
                                  setCopyTargetDays([]);
                                }}
                              >
                                Copy to...
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn interval-remove"
                              disabled={!row.enabled || intervals.length === 1}
                              aria-label={`Remove ${row.day} interval ${intervalIndex + 1}`}
                              onClick={() => updateDay(dayIndex, { intervals: intervals.filter((_, index) => index !== intervalIndex) })}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {isCopyingThisDay && (
                      <div className="inline-copy-drawer" role="region" aria-label={`Copy ${row.day} hours to other days`}>
                        <span className="copy-prompt">Copy {row.day} to:</span>
                        <div className="copy-target-pills" role="group" aria-label="Destination days">
                          {draft.weekly.map((targetRow, targetIndex) => {
                            if (targetIndex === dayIndex) return null;
                            const isChecked = copyTargetDays.includes(targetIndex);
                            return (
                              <label key={targetRow.day} title={targetRow.day}>
                                <input
                                  type="checkbox"
                                  aria-label={`Copy to ${targetRow.day}`}
                                  checked={isChecked}
                                  onChange={() => handleToggleCopyTarget(targetIndex)}
                                />
                                {targetRow.day.slice(0, 3)}
                              </label>
                            );
                          })}
                        </div>
                        <div className="copy-drawer-actions">
                          <button
                            type="button"
                            className="btn small primary"
                            disabled={!copyTargetDays.length}
                            onClick={() => handleApplyCopy(dayIndex, copyTargetDays)}
                          >
                            Apply
                          </button>
                          <button
                            type="button"
                            className="btn small"
                            onClick={() => {
                              const allOtherIndices = draft.weekly.map((_, i) => i).filter((i) => i !== dayIndex);
                              handleApplyCopy(dayIndex, allOtherIndices);
                            }}
                          >
                            All weekdays
                          </button>
                          <button
                            type="button"
                            className="btn small link-btn"
                            onClick={() => {
                              setActiveCopyDay(null);
                              setCopyTargetDays([]);
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="field-row">
              <Field label="Location" value={draft.location} onChange={(event) => changeDraft({ ...draft, location: event.target.value })} required />
              <Field
                label="Publish schedule for"
                as="select"
                value={draft.weeks || 4}
                onChange={(event) => {
                  const nextWeeks = Number(event.target.value);
                  const nextLastDate = addDays(today, nextWeeks * 7 - 1);
                  if (date > nextLastDate) setDate(nextLastDate);
                  if (endDate > nextLastDate) setEndDate(nextLastDate);
                  changeDraft({ ...draft, weeks: nextWeeks });
                }}
              >
                <option value={1}>1 week</option>
                <option value={2}>2 weeks</option>
                <option value={3}>3 weeks</option>
                <option value={4}>4 weeks (1 month · default)</option>
                <option value={6}>6 weeks</option>
                <option value={8}>8 weeks (half term)</option>
                <option value={12}>12 weeks (full term / semester)</option>
                <option value={16}>16 weeks</option>
              </Field>
            </div>
            <div className="schedule-protection muted small">
              <strong>Occupied slots stay protected</strong>
              <p>Pending, confirmed, and historical appointment slots stay unchanged, including within blocked date ranges. Exceptions remove only unreferenced times in the next {publishWeeks === 1 ? '1 week' : `${publishWeeks} weeks`}.</p>
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
            <p className="muted small">{draft.exceptions.length ? `${draft.exceptions.length} date exception(s).` : 'No exceptions added yet.'} Save changes publishes the next {publishWeeks === 1 ? '1 week' : `${publishWeeks} weeks`}.</p>
          </section>
        </div>
        <div className="draft-controls">
          <button className="btn primary" type="submit">Save changes</button>
          <button className="btn" type="button" disabled={!isDirty} onClick={handleDiscard}>Discard draft</button>
          <span role="status">{isDirty ? 'Unsaved changes' : 'No unsaved changes'}</span>
        </div>
      </form>

      {showAddModal && (
        <Modal
          title="Add availability slot"
          description="Add a one-off 30-minute consultation slot on a specific date."
          onClose={handleCloseAddModal}
        >
          <form onSubmit={handleSaveSlot} noValidate>
            {slotError && <div className="form-error" role="alert">{slotError}</div>}
            <Field name="date" label="Date" type="date" min={today} value={slotForm.date} onChange={handleSlotChange} required />
            <div className="field-row">
              <Field name="start" label="Start time" type="time" value={slotForm.start} onChange={handleSlotChange} required />
              <Field name="end" label="End time" type="time" value={slotForm.end} onChange={handleSlotChange} required />
            </div>
            <Field name="mode" label="Consultation mode" as="select" value={slotForm.mode} onChange={handleSlotChange}>
              <option value="in-person">In person</option>
              <option value="online">Online</option>
            </Field>
            <Field name="location" label="Location / meeting details" value={slotForm.location} onChange={handleSlotChange} required />
            <div className="modal-actions">
              <button type="button" className="btn" onClick={handleCloseAddModal}>Cancel</button>
              <button type="submit" className="btn primary">+ Add consultation slot</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default AvailabilityPage;
