import { useMemo, useState } from "react";
import { TODAY } from "../data/mock.js";
import { addDays, fmtDayHeader, fmtRange, fmtTime, fmtWeekRange, weekStartOf, addMinutes } from "../utils/format.js";
import { ACTIVE, useApp } from "../state/AppContext.jsx";

const PERIODS = {
  morning: { label: "Morning · 9:00 AM–12:00 PM", times: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"] },
  afternoon: { label: "Afternoon · 1:00 PM–5:00 PM", times: ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"] },
};

/**
 * Student week grid. Shows bookable slots of the given faculty, the student's own
 * appointments and slots held by other requests (not bookable).
 */
export default function WeekCalendar({ facultyIds, studentId, onPick, pickedSlotId, title }) {
  const { slots, appointments, getFaculty } = useApp();
  const [weekStart, setWeekStart] = useState(weekStartOf(TODAY));
  const [period, setPeriod] = useState("morning");
  const days = [0, 1, 2, 3, 4].map((n) => addDays(weekStart, n));
  const times = PERIODS[period].times;

  const cells = useMemo(() => {
    const map = {};
    const add = (key, item) => ((map[key] ||= []).push(item));
    slots.filter((s) => facultyIds.includes(s.facultyId) && days.includes(s.date)).forEach((slot) => {
      const holder = appointments.find((a) => a.slotId === slot.id && ACTIVE.includes(a.status));
      const key = `${slot.date}|${slot.start}`;
      if (holder?.studentId === studentId) add(key, { type: "own", slot, appt: holder });
      else if (holder) add(key, { type: "reserved", slot });
      else if (slot.date >= TODAY) add(key, { type: "open", slot });
    });
    return map;
  }, [slots, appointments, facultyIds, studentId, weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderCell = (day, time) => {
    const items = cells[`${day}|${time}`];
    if (!items) return null;
    const own = items.find((i) => i.type === "own");
    if (own) {
      const f = getFaculty(own.slot.facultyId);
      return (
        <div className={`cal-item own ${own.appt.status} static`}>
          {f.name.replace(/^(Dr\.|Prof\.)\s*/, "")}<br />{fmtTime(own.slot.start, false)} · {own.appt.status === "confirmed" ? "Confirmed" : "Pending"}
        </div>
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
          aria-label={`${open.length} faculty available ${day} ${fmtTime(first.start)}`}
          onClick={() => onPick(open.map((i) => i.slot))}
        >
          {open.length > 1 ? `${open.length} faculty available` : getFaculty(first.facultyId).name.replace(/^(Dr\.|Prof\.)\s*/, "")}
          <br />{fmtRange(first.start, addMinutes(first.start, 30))}
        </button>
      );
    }
    return <div className="cal-item reserved static">Reserved<br />{fmtTime(items[0].slot.start, false)} · Not bookable</div>;
  };

  return (
    <div className="card week">
      <div className="week-head">
        <h3>{title || fmtWeekRange(weekStart)}</h3>
        <div className="week-nav">
          <button type="button" aria-label="Previous week" onClick={() => setWeekStart(addDays(weekStart, -7))}>‹</button>
          <button type="button" onClick={() => setWeekStart(weekStartOf(TODAY))}>This week</button>
          <button type="button" aria-label="Next week" onClick={() => setWeekStart(addDays(weekStart, 7))}>›</button>
        </div>
      </div>
      <div className="week-period">
        <span>{title ? fmtWeekRange(weekStart) + " · " : ""}{PERIODS[period].label}</span>
        <div className="period-toggle">
          {Object.keys(PERIODS).map((p) => (
            <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)}>
              {p === "morning" ? "Morning" : "Afternoon"}
            </button>
          ))}
        </div>
      </div>
      <div className="cal-scroll">
        <div className="cal" role="grid" aria-label="Weekly availability">
          <div />
          {days.map((d) => <div key={d} className={`dh ${d === TODAY ? "today" : ""}`} role="columnheader">{fmtDayHeader(d)}</div>)}
          {times.map((t) => (
            <Row key={t} t={t} days={days} renderCell={renderCell} />
          ))}
        </div>
      </div>
      <div className="legend">
        <span><i style={{ background: "var(--green-100)" }} />Available</span>
        <span><i style={{ background: "#f1efe6", border: "1px solid var(--line)" }} />Confirmed</span>
        <span><i style={{ background: "var(--amber-bg)" }} />Reserved / pending</span>
      </div>
    </div>
  );
}

function Row({ t, days, renderCell }) {
  return (
    <>
      <div className="th">{fmtTime(t, false)}</div>
      {days.map((d) => <div key={d} className="cell" role="gridcell">{renderCell(d, t)}</div>)}
    </>
  );
}
