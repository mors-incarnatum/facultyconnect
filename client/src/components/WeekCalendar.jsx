import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, fmtDayHeader, fmtRange, fmtTime, fmtShort, weekStartOf, addMinutes } from '../utils/format.js';
import { ACTIVE } from '../state/appointments.js';
import { useApp } from '../hooks/useApp.js';

const PERIODS = {
  morning: { label: "Morning · before noon", times: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"] },
  afternoon: { label: "Afternoon / evening · noon onwards", times: ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"] },
};

/**
 * Student week grid. Shows bookable slots of the given faculty, the student's own
 * appointments and slots held by other requests (not bookable).
 */
export default function WeekCalendar({ facultyIds, studentId, onPick, pickedSlotId, title, viewActions, className = '' }) {
  const { today, slots, appointments, getFaculty, getSlot, isAvailable } = useApp();
  const [weekStart, setWeekStart] = useState(weekStartOf(today));
  const [view, setView] = useState(() => window.matchMedia("(max-width: 700px)").matches ? "agenda" : "calendar");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [timeFilter, setTimeFilter] = useState("");
  const [includeWeekend, setIncludeWeekend] = useState(false);
  const openSlots = slots.filter((s) => facultyIds.includes(s.facultyId) && isAvailable(s)).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  const [period, setPeriod] = useState("morning");
  const anchorSlot = getSlot(pickedSlotId) || openSlots[0];
  const anchorDate = anchorSlot?.date;
  const anchorStart = anchorSlot?.start;
  useEffect(() => {
    if (anchorDate) {
      setWeekStart(weekStartOf(anchorDate));
      setPeriod(anchorStart < '12:00' ? 'morning' : 'afternoon');
      const weekday = new Date(`${anchorDate}T12:00:00`).getDay();
      if (weekday === 0 || weekday === 6) setIncludeWeekend(true);
    }
  }, [pickedSlotId, anchorDate, anchorStart]);
  const days = Array.from({ length: includeWeekend ? 7 : 5 }, (_, n) => addDays(weekStart, n));
  const inPeriod = (s, p) => p === "morning" ? s.start < "12:00" : s.start >= "12:00";
  const count = (p) => openSlots.filter((s) => days.includes(s.date) && inPeriod(s, p)).length;
  const times = [...new Set([...PERIODS[period].times, ...slots.filter((s) => facultyIds.includes(s.facultyId) && days.includes(s.date) && inPeriod(s, period)).map((s) => s.start)])].sort();
  const agenda = openSlots.filter((s) => (!fromDate || s.date >= fromDate) && (!toDate || s.date <= toDate) && (!timeFilter || inPeriod(s, timeFilter)));
  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setTimeFilter('');
  };

  const handleJumpNext = () => {
    const next = openSlots.find((s) => s.date >= weekStart) || openSlots[0];
    if (!next) return;
    handleClearFilters();
    setWeekStart(weekStartOf(next.date));
    setPeriod(next.start < '12:00' ? 'morning' : 'afternoon');
    onPick([next]);
  };

  const cells = {};
  for (const slot of slots) {
    if (!facultyIds.includes(slot.facultyId) || !days.includes(slot.date)) continue;
    const holder = appointments.find((a) => a.slotId === slot.id && ACTIVE.includes(a.status));
    if (!holder && !isAvailable(slot)) continue;
    const type = holder?.studentId === studentId ? 'own' : holder ? 'reserved' : 'open';
    const key = `${slot.date}|${slot.start}`;
    (cells[key] ||= []).push({ type, slot, appt: holder });
  }

  const renderCell = (day, time) => {
    const items = cells[`${day}|${time}`];
    if (!items) return null;
    const own = items.find((i) => i.type === "own");
    if (own) {
      const f = getFaculty(own.slot.facultyId);
      return (
        <Link to={`/student/appointments?id=${own.appt.id}`} className={`cal-item own ${own.appt.status}`}>
          {f.name.replace(/^(Dr\.|Prof\.)\s*/, "")}<br />{fmtTime(own.slot.start, false)} · {own.appt.status === "confirmed" ? "Confirmed" : "Pending"}
        </Link>
      );
    }
    const open = items.filter((i) => i.type === "open");
    if (open.length) {
      const first = open[0].slot;
      const picked = open.some((i) => i.slot.id === pickedSlotId);
      return (
        <button
          type="button"
          className={`cal-item ${picked ? "picked" : ""}`}
          aria-pressed={picked}
          aria-label={`${open.length} faculty available ${day} ${fmtTime(first.start)}`}
          onClick={() => onPick(open.map((i) => i.slot))}
        >
          {picked && <span aria-hidden="true">✓ </span>}{fmtRange(first.start, addMinutes(first.start, 30))}
          {open.length > 1 && <span className="slot-faculty-count">{open.length} faculty available</span>}
        </button>
      );
    }
    return <div className="cal-item reserved static">Reserved<br />{fmtTime(items[0].slot.start, false)} · Not bookable</div>;
  };

  return (
    <div className={`card week ${className}`}>
      <div className="toolbar">
        <div className="toggle" role="group" aria-label="Availability display">
          {['calendar', 'agenda'].map((value) => (
            <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)}>
              {value === 'agenda' ? 'Agenda' : 'Week grid'}
            </button>
          ))}
        </div>
        {viewActions}
        <button type="button" className="btn sm" disabled={!openSlots.length} onClick={handleJumpNext}>Next available time</button>
      </div>
      {view === 'agenda' ? (
        <>
          <div className="agenda-filters">
            <label className="field">From date<input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} /></label>
            <label className="field">Through date<input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} /></label>
            <label className="field">Time of day
              <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
                <option value="">Any time</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon / evening</option>
              </select>
            </label>
            <button type="button" className="btn sm" onClick={handleClearFilters}>Clear agenda filters</button>
          </div>
          <p role="status">{agenda.length} available times</p>
          {agenda.map((slot) => (
            <button key={slot.id} type="button" className={`agenda-slot ${slot.id === pickedSlotId ? 'selected' : ''}`} aria-pressed={slot.id === pickedSlotId} onClick={() => onPick([slot])}>
              <strong>{getFaculty(slot.facultyId).name}</strong>
              <span>{fmtDayHeader(slot.date)} · {slot.date} · {fmtRange(slot.start, slot.end)}</span>
              <span>{slot.location}</span>
            </button>
          ))}
          {!agenda.length && <p className="notice">{openSlots.length ? 'No times match these dates or time of day. Clear the filters to see other available times.' : 'No available times for the current faculty search.'}</p>}
        </>
      ) : <>
      <div className="week-head">
        <h3>{title || `${fmtShort(weekStart)} – ${fmtShort(addDays(weekStart, includeWeekend ? 6 : 4))}`}</h3>
        <div className="week-nav">
          <button type="button" aria-label="Previous week" onClick={() => setWeekStart((prev) => addDays(prev, -7))}>‹</button>
          <button type="button" onClick={() => setWeekStart(weekStartOf(today))}>This week</button>
          <button type="button" aria-label="Next week" onClick={() => setWeekStart((prev) => addDays(prev, 7))}>›</button>
        </div>
      </div>
      <div className="week-period">
        <span>{title ? `${fmtShort(weekStart)} – ${fmtShort(addDays(weekStart, 6))}` + " · " : ""}{PERIODS[period].label}</span>
        <div className="period-toggle">
          {Object.keys(PERIODS).map((p) => (
            <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)}>
              {p === "morning" ? "Morning" : "Afternoon"} ({count(p)})
            </button>
          ))}
        </div>
      </div>
      {count(period) === 0 && <p className="notice" role="status">{!openSlots.length ? "No available times for the current faculty search." : `No available times in this period. ${count(period === "morning" ? "afternoon" : "morning")} available in the other period this week. Use Next available time or Agenda to see more.`}</p>}
      <div className="cal-scroll">
        <div className={`calendar-days ${includeWeekend ? 'full-week' : ''}`} role="group" aria-label="Weekly availability">
          {days.map((day) => {
            const dayTimes = times.filter((time) => cells[`${day}|${time}`]?.length);
            return <section className="calendar-day" key={day} aria-label={fmtDayHeader(day)}>
              <h4 className={`calendar-day-heading ${day === today ? 'today' : ''}`}>{fmtDayHeader(day)}</h4>
              <p className="calendar-period-label">{period === 'morning' ? 'Morning' : 'Afternoon'}</p>
              {dayTimes.map((time) => <div className="calendar-slot" key={time}>{renderCell(day, time)}</div>)}
              {!dayTimes.length && <p className="muted small calendar-empty">No times in this period</p>}
            </section>;
          })}
        </div>
      </div>
      <button type="button" className="link-btn weekend-toggle" aria-pressed={includeWeekend} onClick={() => setIncludeWeekend((previous) => !previous)}>{includeWeekend ? 'Show weekdays only' : 'Include weekend'}</button>
      </>}
      <div className="legend">
        <span><i style={{ background: "var(--green-100)" }} />Available</span>
        <span><i style={{ background: "#f1efe6", border: "1px solid var(--line)" }} />Confirmed</span>
        <span><i style={{ background: "var(--amber-bg)" }} />Reserved / pending</span>
      </div>
    </div>
  );
}
