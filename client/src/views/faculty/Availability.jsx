import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../../state/AppContext.jsx";
import { TODAY } from "../../data/mock.js";
import { Field, PageHead, StatusBadge, modeLabel } from "../../components/ui.jsx";
import { fmtShort, fmtRange, addDays } from "../../utils/format.js";

export default function Availability() {
  const { facultySchedule, saveFacultySchedule } = useApp();
  const [draft, setDraft] = useState(() => structuredClone(facultySchedule));
  const [date, setDate] = useState(TODAY);
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  const navigate = useNavigate();
  const change = (next) => { setDraft(next); setDirty(true); setError(""); };
  const updateDay = (index, fields) => change({ ...draft, weekly: draft.weekly.map((r, i) => i === index ? { ...r, ...fields } : r) });
  const save = (e) => {
    e.preventDefault();
    const result = saveFacultySchedule(draft);
    if (!result.ok) return setError(result.error);
    navigate("/faculty/availability/saved", { state: { published: true } });
  };
  return <><PageHead title="Availability manager" subtitle="Set weekly consultation hours, manage date exceptions, and publish your availability." />
    <form onSubmit={save}>
      <div className="toolbar"><div className="btn-row faculty-toolbar"><button className="btn primary" type="submit">Save changes</button><Link className="btn" to="/faculty/availability/slots">View published slots</Link><Link className="btn" to="/faculty">Back to overview</Link><Link className="btn" to="/faculty/availability/new">Add one-off slot</Link></div><span className="muted small" role="status">{dirty ? "Unsaved changes" : "Published schedule"}</span></div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="faculty-manager">
        <section className="card"><h2>Weekly recurring hours</h2><p className="muted faculty-spaced">Monday–Friday · 30-minute consultations · Campus local time</p>
          {draft.weekly.map((row, i) => <div className="weekly-hours" key={row.day}><button className="btn sm" type="button" aria-label={`${row.day} availability`} aria-pressed={row.enabled} onClick={() => updateDay(i, { enabled: !row.enabled })}>{row.enabled ? "● On" : "○ Off"}</button><strong>{row.day}</strong><Field label={`${row.day} start`} type="time" step="1800" disabled={!row.enabled} required={row.enabled} value={row.start} onChange={(e) => updateDay(i, { start: e.target.value })} /><Field label={`${row.day} end`} type="time" step="1800" disabled={!row.enabled} required={row.enabled} value={row.end} onChange={(e) => updateDay(i, { end: e.target.value })} /></div>)}
          <Field label="Location" value={draft.location} onChange={(e) => change({ ...draft, location: e.target.value })} required />
          <div className="notice"><strong>Occupied slots stay protected</strong><p>Pending and confirmed consultations cannot be overwritten by changes to availability.</p></div>
        </section>
        <section className="card"><h2>Date-specific overrides</h2><p className="muted faculty-spaced">Block exam weeks, holidays, or one day.</p><Field label="Date" type="date" min={TODAY} max={addDays(TODAY, 27)} value={date} onChange={(e) => setDate(e.target.value)} /><div className="notice faculty-spaced">{fmtShort(date || TODAY)} · Unavailable all day</div><button className="btn block" type="button" onClick={() => {
            if (!date || date < TODAY || date > addDays(TODAY, 27)) return setError("Choose an exception within the next four weeks.");
            change({ ...draft, exceptions: [...new Set([...draft.exceptions, date])].sort() });
          }}>Add exception</button>
          <ul className="exception-list">{draft.exceptions.map((d) => <li key={d}><span>{fmtShort(d)} · Unavailable</span><button type="button" className="link-btn" aria-label={`Remove exception ${d}`} onClick={() => change({ ...draft, exceptions: draft.exceptions.filter((v) => v !== d) })}>Remove</button></li>)}</ul>
          <p className="muted small">{draft.exceptions.length ? `${draft.exceptions.length} date exception(s).` : "No exceptions added yet."} Save changes publishes the next four weeks.</p>
        </section>
      </div>
    </form></>;
}

export function PublishedSlots() {
  const { user, slots, holderOf, appointments } = useApp();
  const list = slots.filter((s) => s.facultyId === user.id && s.date >= TODAY).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  return <><PageHead title="My consultation availability" subtitle="Create, review, edit, or remove the dates and times students can request." /><div className="toolbar"><Link className="btn primary" to="/faculty/availability/new">+ Add availability</Link><Link className="btn" to="/faculty/availability">Availability manager</Link></div><section className="card"><h2>Published time slots</h2><p className="muted faculty-spaced">Each slot allows one appointment. Reserved slots cannot receive another request.</p>
    {!list.length && <div className="empty"><h3>No published slots</h3><p className="muted">Add a time or publish weekly hours to get started.</p></div>}
    {list.map((s) => {
      const holder = holderOf(s.id);
      const history = appointments.some((a) => a.slotId === s.id);
      return <div className="appt-row" key={s.id}><div><strong>{fmtShort(s.date)} · {fmtRange(s.start, s.end)}</strong><span className="meta">{modeLabel(s)} · {s.location}</span></div><StatusBadge status={holder?.status || "available"} /><div className="slot-actions">{holder ? <Link to={`/faculty/consultations/${holder.id}`}>View appointment</Link> : history ? <span className="muted small">History retained</span> : <><Link to={`/faculty/availability/${s.id}/edit`}>Edit</Link><Link to={`/faculty/availability/${s.id}/remove`}>Remove</Link></>}</div></div>;
    })}</section></>;
}
