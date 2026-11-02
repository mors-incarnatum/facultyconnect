import { useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ACTIVE, STATUSES } from '../../state/appointments.js';
import { useStudentRecords } from '../../hooks/useAppointments.js';
import AppointmentGuidance from '../../components/AppointmentGuidance.jsx';
import PageHead from '../../components/PageHead.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { modeLabel } from '../../utils/presentation.js';
import { fmtLong, fmtMonthDay, fmtRange, fmtTime } from '../../utils/format.js';

export default function AppointmentsPage() {
  const detailHeading = useRef(null);
  const listHeading = useRef(null);
  const returnPosition = useRef(0);
  const mine = useStudentRecords();
  const [params, setParams] = useSearchParams();
  const scope = params.get("scope") || "all";
  const status = params.get("status") || "";
  const handleFilter = (key, value) => {
    const next = new URLSearchParams(params);
    next.delete("id");
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  };

  const stamp = (a) => a.slot.date + a.slot.start;
  const current = mine.filter((a) => ACTIVE.includes(a.status)).sort((a, b) => stamp(a).localeCompare(stamp(b)));
  const previous = mine.filter((a) => !ACTIVE.includes(a.status)).sort((a, b) => stamp(b).localeCompare(stamp(a)));
  const pool = scope === "current" ? current : scope === "previous" ? previous : [...current, ...previous];
  const list = status ? pool.filter((a) => a.status === status) : pool;
  const sel = list.find((a) => a.id === params.get("id")) || list[0] || null;

  const handleSelect = (id) => {
    const next = new URLSearchParams(params);
    next.set('id', id);
    returnPosition.current = window.scrollY;
    setParams(next);
    if (window.matchMedia('(max-width: 1100px)').matches) {
      requestAnimationFrame(() => {
        detailHeading.current?.focus();
        detailHeading.current?.scrollIntoView({ block: 'start' });
      });
    }
  };

  const handleBackToList = () => {
    listHeading.current?.focus({ preventScroll: true });
    window.scrollTo(0, returnPosition.current);
  };

  return (
    <>
      <PageHead title="My appointments" subtitle="Review your current consultations and previous appointment records." />
      <div className="filters" ref={listHeading} tabIndex={-1}>
        {[["all", `All (${mine.length})`], ["current", `Current (${current.length})`], ["previous", `Previous (${previous.length})`]].map(([k, label]) => (
          <button key={k} type="button" aria-pressed={scope === k} onClick={() => handleFilter('scope', k)}>{label}</button>
        ))}
        <select aria-label="Filter by status" value={status} onChange={(e) => handleFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>
      <div className="two-col">
        <div>
          {list.length === 0 && <div className="card empty"><h3>No appointments here</h3><p className="muted">Try a different filter, or <Link to="/student/faculty">find a faculty member</Link>.</p></div>}
          {list.map((a) => (
            <button key={a.id} type="button" className={`appt-row ${sel?.id === a.id ? "selected" : ""}`} onClick={() => handleSelect(a.id)} aria-pressed={sel?.id === a.id}>
              <span>
                <strong>{a.faculty.name}</strong>
                <span className="meta">{fmtMonthDay(a.slot.date)} · {fmtRange(a.slot.start, a.slot.end)} · {a.subject}{a.topic ? ` · ${a.topic}` : ""}</span>
              </span>
              <span><StatusBadge status={a.status} /></span>
              <span className="act">{sel?.id === a.id ? "Selected" : "Details"}</span>
            </button>
          ))}
          <p className="muted small">Review current and previous appointments. Select a record to see its available actions.</p>
        </div>
        {sel && (
          <aside className="card detail" aria-label="Appointment details">
            <StatusBadge status={sel.status} />
            <h3 ref={detailHeading} tabIndex={-1}>{sel.faculty.name}</h3><button type="button" className="link-btn mobile-details-back" onClick={handleBackToList}>← Back to appointment list</button>
            <div className="day">{fmtLong(sel.slot.date)}</div>
            <div className="time">{fmtTime(sel.slot.start)}–{fmtTime(sel.slot.end)}</div>
            <p className="muted">{modeLabel(sel.slot)} · {sel.slot.location}</p>
            <AppointmentGuidance status={sel.status} />
            <hr className="divider" />
            <strong>{sel.subject}{sel.topic ? ` · ${sel.topic}` : ""}</strong>
            <p className="muted" style={{ marginTop: 8 }}>{sel.topic ? sel.description : "No topic added."}</p>
            {ACTIVE.includes(sel.status) ? (
              <div className="actions">
                <Link className="btn block" to={`/student/appointments/${sel.id}/edit-topic`} state={{ returnTo: `/student/appointments?${params}` }}>{sel.topic ? "Edit topic & description" : "Add a topic"}</Link>
                <Link className="link-btn danger" style={{ textAlign: "center", fontWeight: 600 }} to={`/student/appointments/${sel.id}/cancel`}>Cancel appointment</Link>
                <p className="muted small" style={{ textAlign: "center" }}>Manage your consultation topic before the meeting.</p>
                {sel.topic && <Link style={{ textAlign: "center" }} to={`/student/appointments/${sel.id}/delete-topic`}>Delete topic</Link>}
              </div>
            ) : (
              <div className="notice" style={{ marginTop: 16 }}>This record is {sel.status}. No further actions are available.</div>
            )}
          </aside>
        )}
      </div>
    </>
  );
}
