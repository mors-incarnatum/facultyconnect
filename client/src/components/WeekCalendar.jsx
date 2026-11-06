import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, fmtDayHeader, fmtRange, fmtTime, fmtShort, fmtLong, weekStartOf, addMinutes, parseDate } from '../utils/format.js';
import { ACTIVE } from '../state/appointments.js';
import { useApp } from '../hooks/useApp.js';
import Avatar from './Avatar.jsx';

const PERIODS = {
  morning: { label: "Morning · before noon", times: ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"] },
  afternoon: { label: "Afternoon / evening · noon onwards", times: ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"] },
};

const DOW_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Student week grid & agenda. Shows bookable slots of the given faculty, the student's own
 * appointments and slots held by other requests (not bookable).
 */
export default function WeekCalendar({ facultyIds, studentId, onPick, pickedSlotId, title, viewActions, className = '' }) {
  const { today, slots, appointments, getFaculty, getSlot, isAvailable } = useApp();
  const [weekStart, setWeekStart] = useState(weekStartOf(today));
  const [view, setView] = useState(() => window.matchMedia("(max-width: 700px)").matches ? "agenda" : "calendar");
  const [displayMode, setDisplayMode] = useState('day'); // 'day' (zero-scroll) | 'all'
  const [scope, setScope] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [facultyFilter, setFacultyFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [includeWeekend, setIncludeWeekend] = useState(false);

  const startThisWeek = useMemo(() => weekStartOf(today), [today]);
  const endThisWeek = useMemo(() => addDays(startThisWeek, 6), [startThisWeek]);
  const startNextWeek = useMemo(() => addDays(startThisWeek, 7), [startThisWeek]);
  const endNextWeek = useMemo(() => addDays(startThisWeek, 13), [startThisWeek]);

  const openSlots = useMemo(() => {
    return slots
      .filter((s) => facultyIds.includes(s.facultyId) && isAvailable(s))
      .sort((a, b) => {
        const diff = (a.date + a.start).localeCompare(b.date + b.start);
        if (diff !== 0) return diff;
        const nameA = getFaculty(a.facultyId)?.name || '';
        const nameB = getFaculty(b.facultyId)?.name || '';
        return nameA.localeCompare(nameB);
      });
  }, [slots, facultyIds, isAvailable, getFaculty]);

  const [period, setPeriod] = useState("morning");
  const anchorSlot = getSlot(pickedSlotId) || openSlots[0];
  const anchorDate = anchorSlot?.date;
  const anchorStart = anchorSlot?.start;

  // Selected date for day-by-day zero-scroll browsing
  const [selectedDate, setSelectedDate] = useState(() => anchorDate || today);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  useEffect(() => {
    if (anchorDate) {
      setWeekStart(weekStartOf(anchorDate));
      setSelectedDate(anchorDate);
      setPeriod(anchorStart < '12:00' ? 'morning' : 'afternoon');
      const weekday = new Date(`${anchorDate}T12:00:00`).getDay();
      if (weekday === 0 || weekday === 6) setIncludeWeekend(true);
    }
  }, [pickedSlotId, anchorDate, anchorStart]);

  const days = Array.from({ length: includeWeekend ? 7 : 5 }, (_, n) => addDays(weekStart, n));
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, n) => addDays(weekStart, n)), [weekStart]);

  const inPeriod = (s, p) => p === "morning" ? s.start < "12:00" : s.start >= "12:00";
  const count = (p) => openSlots.filter((s) => days.includes(s.date) && inPeriod(s, p)).length;
  const times = [...new Set([...PERIODS[period].times, ...slots.filter((s) => facultyIds.includes(s.facultyId) && days.includes(s.date) && inPeriod(s, period)).map((s) => s.start)])].sort();

  // Scope counts
  const countThisWeek = useMemo(() => {
    return openSlots.filter((s) => s.date >= startThisWeek && s.date <= endThisWeek).length;
  }, [openSlots, startThisWeek, endThisWeek]);

  const countNextWeek = useMemo(() => {
    return openSlots.filter((s) => s.date >= startNextWeek && s.date <= endNextWeek).length;
  }, [openSlots, startNextWeek, endNextWeek]);

  // Filtered agenda slots
  const agenda = useMemo(() => {
    return openSlots.filter((s) => {
      if (scope === 'this-week') {
        if (s.date < startThisWeek || s.date > endThisWeek) return false;
      } else if (scope === 'next-week') {
        if (s.date < startNextWeek || s.date > endNextWeek) return false;
      } else if (scope === 'custom') {
        if (fromDate && s.date < fromDate) return false;
        if (toDate && s.date > toDate) return false;
      }
      if (facultyFilter && s.facultyId !== facultyFilter) return false;
      if (timeFilter && !inPeriod(s, timeFilter)) return false;
      return true;
    });
  }, [openSlots, scope, startThisWeek, endThisWeek, startNextWeek, endNextWeek, fromDate, toDate, facultyFilter, timeFilter]);

  // Slots count by date in current agenda
  const slotsByDate = useMemo(() => {
    const map = new Map();
    for (const slot of agenda) {
      map.set(slot.date, (map.get(slot.date) || 0) + 1);
    }
    return map;
  }, [agenda]);

  const facultyOptions = useMemo(() => {
    const list = facultyIds.map((id) => getFaculty(id)).filter(Boolean);
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [facultyIds, getFaculty]);

  const handleClearFilters = () => {
    setScope('all');
    setSortBy('date');
    setFacultyFilter('');
    setTimeFilter('');
    setFromDate('');
    setToDate('');
  };

  const handleFromDateChange = (val) => {
    setFromDate(val);
    setScope('custom');
  };

  const handleToDateChange = (val) => {
    setToDate(val);
    setScope('custom');
  };

  const handleScopeChange = (newScope) => {
    setScope(newScope);
    if (newScope !== 'custom') {
      setFromDate('');
      setToDate('');
    }
  };

  const isFiltered = scope !== 'all' || sortBy !== 'date' || facultyFilter || timeFilter || fromDate || toDate;

  // Week navigation for day strip
  const handleWeekNav = (delta) => {
    const nextStart = addDays(weekStart, delta * 7);
    setWeekStart(nextStart);
    const newDays = Array.from({ length: 7 }, (_, n) => addDays(nextStart, n));
    const firstAvailable = newDays.find((d) => (slotsByDate.get(d) || 0) > 0);
    setSelectedDate(firstAvailable || newDays[0]);
  };

  const handleJumpThisWeek = () => {
    const thisStart = weekStartOf(today);
    setWeekStart(thisStart);
    const thisDays = Array.from({ length: 7 }, (_, n) => addDays(thisStart, n));
    const firstAvailable = thisDays.find((d) => (slotsByDate.get(d) || 0) > 0 && d >= today);
    setSelectedDate(firstAvailable || today);
  };

  const handleJumpNext = () => {
    const next = openSlots.find((s) => s.date >= today) || openSlots[0];
    if (!next) return;
    handleClearFilters();
    setWeekStart(weekStartOf(next.date));
    setSelectedDate(next.date);
    setDisplayMode('day');
    setPeriod(next.start < '12:00' ? 'morning' : 'afternoon');
    onPick([next]);
  };

  // Grouped by Date (for All Days mode)
  const groupedByDate = useMemo(() => {
    const groups = [];
    const dateMap = new Map();
    for (const slot of agenda) {
      if (!dateMap.has(slot.date)) {
        const item = { date: slot.date, facultyMap: new Map(), count: 0 };
        dateMap.set(slot.date, item);
        groups.push(item);
      }
      const dayItem = dateMap.get(slot.date);
      dayItem.count++;
      if (!dayItem.facultyMap.has(slot.facultyId)) {
        dayItem.facultyMap.set(slot.facultyId, {
          faculty: getFaculty(slot.facultyId),
          slots: [],
        });
      }
      dayItem.facultyMap.get(slot.facultyId).slots.push(slot);
    }

    groups.sort((a, b) => a.date.localeCompare(b.date));

    for (const g of groups) {
      g.facultyList = Array.from(g.facultyMap.values()).sort((a, b) => {
        const timeDiff = a.slots[0].start.localeCompare(b.slots[0].start);
        if (timeDiff !== 0) return timeDiff;
        return (a.faculty?.name || '').localeCompare(b.faculty?.name || '');
      });
      for (const f of g.facultyList) {
        f.slots.sort((a, b) => a.start.localeCompare(b.start));
      }
    }
    return groups;
  }, [agenda, getFaculty]);

  // Grouped by Faculty
  const groupedByFaculty = useMemo(() => {
    const groups = [];
    const fMap = new Map();
    for (const slot of agenda) {
      if (!fMap.has(slot.facultyId)) {
        const f = getFaculty(slot.facultyId);
        const item = { faculty: f, dateMap: new Map(), count: 0 };
        fMap.set(slot.facultyId, item);
        groups.push(item);
      }
      const fItem = fMap.get(slot.facultyId);
      fItem.count++;
      if (!fItem.dateMap.has(slot.date)) {
        fItem.dateMap.set(slot.date, []);
      }
      fItem.dateMap.get(slot.date).push(slot);
    }

    groups.sort((a, b) => (a.faculty?.name || '').localeCompare(b.faculty?.name || ''));

    for (const g of groups) {
      g.dates = Array.from(g.dateMap.entries()).map(([date, slots]) => ({
        date,
        slots: slots.sort((a, b) => a.start.localeCompare(b.start)),
      })).sort((a, b) => a.date.localeCompare(b.date));
    }
    return groups;
  }, [agenda, getFaculty]);

  // Grouped by Department
  const groupedByDept = useMemo(() => {
    const deptMap = new Map();
    for (const slot of agenda) {
      const f = getFaculty(slot.facultyId);
      const dept = f?.department || 'Other';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, new Map());
      }
      const fInDept = deptMap.get(dept);
      if (!fInDept.has(slot.facultyId)) {
        fInDept.set(slot.facultyId, { faculty: f, dateMap: new Map(), count: 0 });
      }
      const fItem = fInDept.get(slot.facultyId);
      fItem.count++;
      if (!fItem.dateMap.has(slot.date)) {
        fItem.dateMap.set(slot.date, []);
      }
      fItem.dateMap.get(slot.date).push(slot);
    }

    return Array.from(deptMap.entries())
      .sort(([dA], [dB]) => dA.localeCompare(dB))
      .map(([department, fInDept]) => {
        const facultyList = Array.from(fInDept.values())
          .sort((a, b) => (a.faculty?.name || '').localeCompare(b.faculty?.name || ''))
          .map((item) => ({
            faculty: item.faculty,
            count: item.count,
            dates: Array.from(item.dateMap.entries()).map(([date, slots]) => ({
              date,
              slots: slots.sort((a, b) => a.start.localeCompare(b.start)),
            })).sort((a, b) => a.date.localeCompare(b.date)),
          }));
        const totalDeptSlots = facultyList.reduce((acc, f) => acc + f.count, 0);
        return { department, facultyList, totalDeptSlots };
      });
  }, [agenda, getFaculty]);

  // Active day faculty for Day-by-Day (zero-scroll) mode
  const activeDaySlots = useMemo(() => {
    return agenda.filter((s) => s.date === selectedDate);
  }, [agenda, selectedDate]);

  const activeDayFaculty = useMemo(() => {
    const fMap = new Map();
    for (const slot of activeDaySlots) {
      if (!fMap.has(slot.facultyId)) {
        fMap.set(slot.facultyId, {
          faculty: getFaculty(slot.facultyId),
          slots: [],
        });
      }
      fMap.get(slot.facultyId).slots.push(slot);
    }
    return Array.from(fMap.values()).sort((a, b) => {
      const timeDiff = a.slots[0].start.localeCompare(b.slots[0].start);
      if (timeDiff !== 0) return timeDiff;
      return (a.faculty?.name || '').localeCompare(b.faculty?.name || '');
    });
  }, [activeDaySlots, getFaculty]);

  const nextAvailableDay = useMemo(() => {
    return openSlots.find((s) => s.date > selectedDate)?.date;
  }, [openSlots, selectedDate]);

  // Selected faculty & department for entity tab mode
  const currentFacultyGroup = useMemo(() => {
    if (!groupedByFaculty.length) return null;
    return groupedByFaculty.find((g) => g.faculty.id === selectedFacultyId) || groupedByFaculty[0];
  }, [groupedByFaculty, selectedFacultyId]);

  const currentDeptGroup = useMemo(() => {
    if (!groupedByDept.length) return null;
    return groupedByDept.find((g) => g.department === selectedDept) || groupedByDept[0];
  }, [groupedByDept, selectedDept]);

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
        <div className="calendar-view-controls">
          {viewActions}
          <div className="toggle" role="group" aria-label="Availability display">
            {['calendar', 'agenda'].map((value) => (
              <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)}>
                {value === 'agenda' ? 'Agenda' : 'Week grid'}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="btn sm" disabled={!openSlots.length} onClick={handleJumpNext}>
          Next available time
        </button>
      </div>

      {view === 'agenda' ? (
        <div className="agenda-container">
          <div className="agenda-header-controls">
            <div className="agenda-scope-row">
              <div className="agenda-scope-pills" role="group" aria-label="Date range scope">
                <button
                  type="button"
                  className={`agenda-scope-btn ${scope === 'all' ? 'active' : ''}`}
                  onClick={() => handleScopeChange('all')}
                  aria-pressed={scope === 'all'}
                >
                  All upcoming ({openSlots.length})
                </button>
                <button
                  type="button"
                  className={`agenda-scope-btn ${scope === 'this-week' ? 'active' : ''}`}
                  onClick={() => handleScopeChange('this-week')}
                  aria-pressed={scope === 'this-week'}
                >
                  This week ({countThisWeek})
                </button>
                <button
                  type="button"
                  className={`agenda-scope-btn ${scope === 'next-week' ? 'active' : ''}`}
                  onClick={() => handleScopeChange('next-week')}
                  aria-pressed={scope === 'next-week'}
                >
                  Next week ({countNextWeek})
                </button>
              </div>

              <div className="agenda-sort-control">
                <label htmlFor="agenda-sort-select">Sort by:</label>
                <select
                  id="agenda-sort-select"
                  className="agenda-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="date">Date & time (soonest first)</option>
                  <option value="faculty">Faculty name (A–Z)</option>
                  <option value="department">Department</option>
                </select>
              </div>
            </div>

            <div className="agenda-filters-card">
              <div className="agenda-filter-field">
                <label htmlFor="agenda-faculty-select">Faculty</label>
                <select
                  id="agenda-faculty-select"
                  value={facultyFilter}
                  onChange={(e) => setFacultyFilter(e.target.value)}
                >
                  <option value="">All faculty ({facultyOptions.length})</option>
                  {facultyOptions.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="agenda-filter-field">
                <label htmlFor="agenda-time-select">Time of day</label>
                <select
                  id="agenda-time-select"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                >
                  <option value="">Any time</option>
                  <option value="morning">Morning (before 12 PM)</option>
                  <option value="afternoon">Afternoon (12 PM onwards)</option>
                </select>
              </div>

              <div className="agenda-filter-field">
                <label htmlFor="agenda-from-date">From date</label>
                <input
                  id="agenda-from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => handleFromDateChange(e.target.value)}
                />
              </div>

              <div className="agenda-filter-field">
                <label htmlFor="agenda-to-date">Through date</label>
                <input
                  id="agenda-to-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => handleToDateChange(e.target.value)}
                />
              </div>

              {isFiltered && (
                <button
                  type="button"
                  className="agenda-reset-btn"
                  onClick={handleClearFilters}
                  title="Reset all filters and sort order"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

          {/* Agenda view mode switcher bar */}
          <div className="agenda-view-mode-bar">
            <div className="week-nav" style={{ gap: 6 }}>
              <button type="button" aria-label="Previous week" onClick={() => handleWeekNav(-1)}>‹</button>
              <button type="button" onClick={handleJumpThisWeek}>This week</button>
              <button type="button" aria-label="Next week" onClick={() => handleWeekNav(1)}>›</button>
              <span className="muted small" style={{ marginLeft: 8, fontWeight: 600 }}>
                {fmtShort(weekStart)} – {fmtShort(addDays(weekStart, 6))}
              </span>
            </div>

            <div className="toggle sm auto" role="group" aria-label="Display style">
              <button
                type="button"
                aria-pressed={displayMode === 'day'}
                onClick={() => setDisplayMode('day')}
                title="Single day view (zero scrolling)"
              >
                Day by day
              </button>
              <button
                type="button"
                aria-pressed={displayMode === 'all'}
                onClick={() => setDisplayMode('all')}
                title="View all days in list"
              >
                All days
              </button>
            </div>
          </div>

          {/* =====================================================================
              ZERO-SCROLL MODE: Day by Day Navigation Strip
              ===================================================================== */}
          {displayMode === 'day' && sortBy === 'date' && (
            <>
              {/* 7-Day Interactive Strip */}
              <div className="agenda-day-strip" role="group" aria-label="Select day">
                {weekDays.map((day) => {
                  const dateObj = parseDate(day);
                  const dow = DOW_NAMES[dateObj.getDay()];
                  const num = dateObj.getDate();
                  const slotCount = slotsByDate.get(day) || 0;
                  const isSelected = day === selectedDate;
                  const isToday = day === today;

                  return (
                    <button
                      key={day}
                      type="button"
                      className={`agenda-day-tab ${isSelected ? 'selected' : ''} ${slotCount === 0 ? 'empty' : ''} ${isToday ? 'today' : ''}`}
                      onClick={() => setSelectedDate(day)}
                      aria-pressed={isSelected}
                      title={`${fmtLong(day)} · ${slotCount} available`}
                    >
                      <span className="agenda-tab-dow">{dow}</span>
                      <span className="agenda-tab-num">{num}</span>
                      <span className="agenda-tab-count">
                        {slotCount > 0 ? `${slotCount} open` : '—'}
                      </span>
                      {isToday && <span className="agenda-tab-today-dot" title="Today" />}
                    </button>
                  );
                })}
              </div>

              {/* Day Stepper Control */}
              <div className="agenda-day-stepper">
                <button
                  type="button"
                  className="agenda-stepper-btn"
                  onClick={() => {
                    const prev = addDays(selectedDate, -1);
                    setSelectedDate(prev);
                    if (!weekDays.includes(prev)) setWeekStart(weekStartOf(prev));
                  }}
                  aria-label="Previous day"
                >
                  ‹ {fmtShort(addDays(selectedDate, -1))}
                </button>

                <div className="agenda-stepper-current">
                  <strong>{fmtLong(selectedDate)}, {selectedDate.split('-')[0]}</strong>
                  {selectedDate === today && <span className="agenda-today-tag">Today</span>}
                  <span className="muted small">({activeDaySlots.length} available)</span>
                </div>

                <button
                  type="button"
                  className="agenda-stepper-btn"
                  onClick={() => {
                    const next = addDays(selectedDate, 1);
                    setSelectedDate(next);
                    if (!weekDays.includes(next)) setWeekStart(weekStartOf(next));
                  }}
                  aria-label="Next day"
                >
                  {fmtShort(addDays(selectedDate, 1))} ›
                </button>
              </div>

              {/* Active Day Faculty & Slots */}
              {activeDayFaculty.length > 0 ? (
                <div className="agenda-faculty-list">
                  {activeDayFaculty.map((fItem) => {
                    const primaryLocation = fItem.slots[0]?.location;
                    return (
                      <article className="agenda-faculty-card" key={fItem.faculty.id}>
                        <div className="agenda-faculty-top">
                          <Avatar person={fItem.faculty} size="md" />
                          <div className="agenda-faculty-details">
                            <div className="agenda-faculty-name-wrap">
                              <strong>{fItem.faculty.name}</strong>
                              {fItem.faculty.pronouns && (
                                <span className="profile-pronouns">{fItem.faculty.pronouns}</span>
                              )}
                            </div>
                            <div className="agenda-faculty-sub">
                              <span>{fItem.faculty.rank ? `${fItem.faculty.rank} · ` : ''}{fItem.faculty.department}</span>
                              {primaryLocation && <span> · {primaryLocation}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="agenda-pills-wrap" role="group" aria-label={`Available times for ${fItem.faculty.name}`}>
                          <div className="agenda-pill-label">Available times:</div>
                          {fItem.slots.map((slot) => {
                            const isSelected = slot.id === pickedSlotId;
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                className={`agenda-time-pill ${isSelected ? 'selected' : ''}`}
                                aria-pressed={isSelected}
                                aria-label={`Choose ${fmtRange(slot.start, slot.end)} with ${fItem.faculty.name}`}
                                title={`${fmtRange(slot.start, slot.end)} · ${slot.mode === 'online' ? 'Online' : slot.location}`}
                                onClick={() => onPick([slot])}
                              >
                                {isSelected && <span aria-hidden="true">✓ </span>}
                                {fmtRange(slot.start, slot.end)}
                                {slot.mode === 'online' && <span className="pill-mode">· Online</span>}
                              </button>
                            );
                          })}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="agenda-day-empty">
                  <p className="muted">No consultation times available on {fmtLong(selectedDate)}.</p>
                  {nextAvailableDay && (
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => {
                        setSelectedDate(nextAvailableDay);
                        if (!weekDays.includes(nextAvailableDay)) {
                          setWeekStart(weekStartOf(nextAvailableDay));
                        }
                      }}
                    >
                      Jump to next available: {fmtShort(nextAvailableDay)} ({slotsByDate.get(nextAvailableDay) || 0} open) →
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* =====================================================================
              ZERO-SCROLL MODE: Faculty Strip (when Sort by Faculty is selected)
              ===================================================================== */}
          {displayMode === 'day' && sortBy === 'faculty' && currentFacultyGroup && (
            <>
              <div className="agenda-entity-strip" role="group" aria-label="Select faculty">
                {groupedByFaculty.map((fg) => {
                  const isSel = fg.faculty.id === currentFacultyGroup.faculty.id;
                  return (
                    <button
                      key={fg.faculty.id}
                      type="button"
                      className={`agenda-entity-tab ${isSel ? 'selected' : ''}`}
                      onClick={() => setSelectedFacultyId(fg.faculty.id)}
                      aria-pressed={isSel}
                    >
                      <span>{fg.faculty.name.replace(/^(Dr\.|Prof\.)\s*/, "")}</span>
                      <span className="tab-badge">{fg.count}</span>
                    </button>
                  );
                })}
              </div>

              <article className="agenda-grouped-card">
                <div className="agenda-grouped-head">
                  <Avatar person={currentFacultyGroup.faculty} size="md" />
                  <div className="agenda-faculty-details">
                    <div className="agenda-faculty-name-wrap">
                      <strong>{currentFacultyGroup.faculty.name}</strong>
                      {currentFacultyGroup.faculty.pronouns && (
                        <span className="profile-pronouns">{currentFacultyGroup.faculty.pronouns}</span>
                      )}
                    </div>
                    <div className="agenda-faculty-sub">
                      {currentFacultyGroup.faculty.rank ? `${currentFacultyGroup.faculty.rank} · ` : ''}{currentFacultyGroup.faculty.department} · {currentFacultyGroup.count} available times
                    </div>
                  </div>
                </div>

                {currentFacultyGroup.dates.map(({ date, slots: dateSlots }) => (
                  <div className="agenda-date-row" key={date}>
                    <div className="agenda-date-row-head">
                      <span className="agenda-date-row-title">{fmtLong(date)}</span>
                      <span className="muted small">{dateSlots[0]?.location || (dateSlots[0]?.mode === 'online' ? 'Online' : '')}</span>
                    </div>
                    <div className="agenda-pills-wrap" style={{ marginTop: 6, paddingTop: 0, borderTop: 'none' }}>
                      {dateSlots.map((slot) => {
                        const isSelected = slot.id === pickedSlotId;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            className={`agenda-time-pill ${isSelected ? 'selected' : ''}`}
                            aria-pressed={isSelected}
                            aria-label={`Choose ${fmtRange(slot.start, slot.end)} with ${currentFacultyGroup.faculty.name}`}
                            title={`${fmtRange(slot.start, slot.end)} · ${slot.mode === 'online' ? 'Online' : slot.location}`}
                            onClick={() => onPick([slot])}
                          >
                            {isSelected && <span aria-hidden="true">✓ </span>}
                            {fmtRange(slot.start, slot.end)}
                            {slot.mode === 'online' && <span className="pill-mode">· Online</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </article>
            </>
          )}

          {/* =====================================================================
              ZERO-SCROLL MODE: Department Strip (when Sort by Dept is selected)
              ===================================================================== */}
          {displayMode === 'day' && sortBy === 'department' && currentDeptGroup && (
            <>
              <div className="agenda-entity-strip" role="group" aria-label="Select department">
                {groupedByDept.map((dg) => {
                  const isSel = dg.department === currentDeptGroup.department;
                  return (
                    <button
                      key={dg.department}
                      type="button"
                      className={`agenda-entity-tab ${isSel ? 'selected' : ''}`}
                      onClick={() => setSelectedDept(dg.department)}
                      aria-pressed={isSel}
                    >
                      <span>{dg.department}</span>
                      <span className="tab-badge">{dg.totalDeptSlots}</span>
                    </button>
                  );
                })}
              </div>

              <div className="agenda-dept-section">
                {currentDeptGroup.facultyList.map((fGroup) => (
                  <article className="agenda-grouped-card" key={fGroup.faculty.id}>
                    <div className="agenda-grouped-head">
                      <Avatar person={fGroup.faculty} size="md" />
                      <div className="agenda-faculty-details">
                        <div className="agenda-faculty-name-wrap">
                          <strong>{fGroup.faculty.name}</strong>
                          {fGroup.faculty.pronouns && (
                            <span className="profile-pronouns">{fGroup.faculty.pronouns}</span>
                          )}
                        </div>
                        <div className="agenda-faculty-sub">
                          {fGroup.faculty.rank || 'Faculty'} · {fGroup.count} available times
                        </div>
                      </div>
                    </div>

                    {fGroup.dates.map(({ date, slots: dateSlots }) => (
                      <div className="agenda-date-row" key={date}>
                        <div className="agenda-date-row-head">
                          <span className="agenda-date-row-title">{fmtLong(date)}</span>
                          <span className="muted small">{dateSlots[0]?.location || (dateSlots[0]?.mode === 'online' ? 'Online' : '')}</span>
                        </div>
                        <div className="agenda-pills-wrap" style={{ marginTop: 6, paddingTop: 0, borderTop: 'none' }}>
                          {dateSlots.map((slot) => {
                            const isSelected = slot.id === pickedSlotId;
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                className={`agenda-time-pill ${isSelected ? 'selected' : ''}`}
                                aria-pressed={isSelected}
                                aria-label={`Choose ${fmtRange(slot.start, slot.end)} with ${fGroup.faculty.name}`}
                                title={`${fmtRange(slot.start, slot.end)} · ${slot.mode === 'online' ? 'Online' : slot.location}`}
                                onClick={() => onPick([slot])}
                              >
                                {isSelected && <span aria-hidden="true">✓ </span>}
                                {fmtRange(slot.start, slot.end)}
                                {slot.mode === 'online' && <span className="pill-mode">· Online</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </article>
                ))}
              </div>
            </>
          )}

          {/* =====================================================================
              ALL DAYS MODE: Bounded container (avoids page blowout)
              ===================================================================== */}
          {displayMode === 'all' && (
            <div className="agenda-all-days-scroll">
              {sortBy === 'date' && groupedByDate.map((group) => {
                const isToday = group.date === today;
                return (
                  <section className="agenda-day-group" key={group.date} aria-label={`${fmtLong(group.date)}`}>
                    <div className="agenda-day-header">
                      <div className="agenda-day-title-row">
                        <h3 className="agenda-day-title">{fmtLong(group.date)}, {group.date.split('-')[0]}</h3>
                        {isToday && <span className="agenda-today-tag">Today</span>}
                      </div>
                      <span className="agenda-day-count">
                        {group.count} {group.count === 1 ? 'time' : 'times'} available
                      </span>
                    </div>

                    <div className="agenda-faculty-list">
                      {group.facultyList.map((fItem) => {
                        const primaryLocation = fItem.slots[0]?.location;
                        return (
                          <article className="agenda-faculty-card" key={fItem.faculty.id}>
                            <div className="agenda-faculty-top">
                              <Avatar person={fItem.faculty} size="md" />
                              <div className="agenda-faculty-details">
                                <div className="agenda-faculty-name-wrap">
                                  <strong>{fItem.faculty.name}</strong>
                                  {fItem.faculty.pronouns && (
                                    <span className="profile-pronouns">{fItem.faculty.pronouns}</span>
                                  )}
                                </div>
                                <div className="agenda-faculty-sub">
                                  <span>{fItem.faculty.rank ? `${fItem.faculty.rank} · ` : ''}{fItem.faculty.department}</span>
                                  {primaryLocation && <span> · {primaryLocation}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="agenda-pills-wrap" role="group" aria-label={`Available times for ${fItem.faculty.name}`}>
                              <div className="agenda-pill-label">Available consultation slots:</div>
                              {fItem.slots.map((slot) => {
                                const isSelected = slot.id === pickedSlotId;
                                return (
                                  <button
                                    key={slot.id}
                                    type="button"
                                    className={`agenda-time-pill ${isSelected ? 'selected' : ''}`}
                                    aria-pressed={isSelected}
                                    aria-label={`Choose ${fmtRange(slot.start, slot.end)} with ${fItem.faculty.name}`}
                                    title={`${fmtRange(slot.start, slot.end)} · ${slot.mode === 'online' ? 'Online' : slot.location}`}
                                    onClick={() => onPick([slot])}
                                  >
                                    {isSelected && <span aria-hidden="true">✓ </span>}
                                    {fmtRange(slot.start, slot.end)}
                                    {slot.mode === 'online' && <span className="pill-mode">· Online</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

              {sortBy === 'faculty' && groupedByFaculty.map((fGroup) => (
                <article className="agenda-grouped-card" key={fGroup.faculty.id}>
                  <div className="agenda-grouped-head">
                    <Avatar person={fGroup.faculty} size="md" />
                    <div className="agenda-faculty-details">
                      <div className="agenda-faculty-name-wrap">
                        <strong>{fGroup.faculty.name}</strong>
                        {fGroup.faculty.pronouns && (
                          <span className="profile-pronouns">{fGroup.faculty.pronouns}</span>
                        )}
                      </div>
                      <div className="agenda-faculty-sub">
                        {fGroup.faculty.rank ? `${fGroup.faculty.rank} · ` : ''}{fGroup.faculty.department} · {fGroup.count} available {fGroup.count === 1 ? 'time' : 'times'}
                      </div>
                    </div>
                  </div>

                  {fGroup.dates.map(({ date, slots: dateSlots }) => (
                    <div className="agenda-date-row" key={date}>
                      <div className="agenda-date-row-head">
                        <span className="agenda-date-row-title">{fmtLong(date)}</span>
                        <span className="muted small">{dateSlots[0]?.location || (dateSlots[0]?.mode === 'online' ? 'Online' : '')}</span>
                      </div>
                      <div className="agenda-pills-wrap" style={{ marginTop: 6, paddingTop: 0, borderTop: 'none' }}>
                        {dateSlots.map((slot) => {
                          const isSelected = slot.id === pickedSlotId;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              className={`agenda-time-pill ${isSelected ? 'selected' : ''}`}
                              aria-pressed={isSelected}
                              aria-label={`Choose ${fmtRange(slot.start, slot.end)} with ${fGroup.faculty.name}`}
                              title={`${fmtRange(slot.start, slot.end)} · ${slot.mode === 'online' ? 'Online' : slot.location}`}
                              onClick={() => onPick([slot])}
                            >
                              {isSelected && <span aria-hidden="true">✓ </span>}
                              {fmtRange(slot.start, slot.end)}
                              {slot.mode === 'online' && <span className="pill-mode">· Online</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </article>
              ))}

              {sortBy === 'department' && groupedByDept.map(({ department, facultyList, totalDeptSlots }) => (
                <section className="agenda-dept-section" key={department}>
                  <div className="agenda-dept-header">
                    {department} · <span className="muted small" style={{ fontWeight: 500 }}>{totalDeptSlots} available {totalDeptSlots === 1 ? 'time' : 'times'}</span>
                  </div>

                  {facultyList.map((fGroup) => (
                    <article className="agenda-grouped-card" key={fGroup.faculty.id}>
                      <div className="agenda-grouped-head">
                        <Avatar person={fGroup.faculty} size="md" />
                        <div className="agenda-faculty-details">
                          <div className="agenda-faculty-name-wrap">
                            <strong>{fGroup.faculty.name}</strong>
                            {fGroup.faculty.pronouns && (
                              <span className="profile-pronouns">{fGroup.faculty.pronouns}</span>
                            )}
                          </div>
                          <div className="agenda-faculty-sub">
                            {fGroup.faculty.rank || 'Faculty'} · {fGroup.count} available {fGroup.count === 1 ? 'time' : 'times'}
                          </div>
                        </div>
                      </div>

                      {fGroup.dates.map(({ date, slots: dateSlots }) => (
                        <div className="agenda-date-row" key={date}>
                          <div className="agenda-date-row-head">
                            <span className="agenda-date-row-title">{fmtLong(date)}</span>
                            <span className="muted small">{dateSlots[0]?.location || (dateSlots[0]?.mode === 'online' ? 'Online' : '')}</span>
                          </div>
                          <div className="agenda-pills-wrap" style={{ marginTop: 6, paddingTop: 0, borderTop: 'none' }}>
                            {dateSlots.map((slot) => {
                              const isSelected = slot.id === pickedSlotId;
                              return (
                                <button
                                  key={slot.id}
                                  type="button"
                                  className={`agenda-time-pill ${isSelected ? 'selected' : ''}`}
                                  aria-pressed={isSelected}
                                  aria-label={`Choose ${fmtRange(slot.start, slot.end)} with ${fGroup.faculty.name}`}
                                  title={`${fmtRange(slot.start, slot.end)} · ${slot.mode === 'online' ? 'Online' : slot.location}`}
                                  onClick={() => onPick([slot])}
                                >
                                  {isSelected && <span aria-hidden="true">✓ </span>}
                                  {fmtRange(slot.start, slot.end)}
                                  {slot.mode === 'online' && <span className="pill-mode">· Online</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </article>
                  ))}
                </section>
              ))}
            </div>
          )}

          {!agenda.length && (
            <div className="card empty" style={{ marginTop: 16 }}>
              <h3>No available times match your filters</h3>
              <p className="muted">
                {openSlots.length
                  ? 'Try adjusting your date scope, faculty, or time of day filter.'
                  : 'No available times for the current faculty search.'}
              </p>
              {isFiltered && (
                <div className="btn-row" style={{ justifyContent: 'center' }}>
                  <button type="button" className="btn sm" onClick={handleClearFilters}>
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
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
          {count(period) === 0 && (
            <p className="notice" role="status">
              {!openSlots.length
                ? "No available times for the current faculty search."
                : `No available times in this period. ${count(period === "morning" ? "afternoon" : "morning")} available in the other period this week. Use Next available time or Agenda to see more.`}
            </p>
          )}
          <div className="cal-scroll">
            <div className={`calendar-days ${includeWeekend ? 'full-week' : ''}`} role="group" aria-label="Weekly availability">
              {days.map((day) => {
                const dayTimes = times.filter((time) => cells[`${day}|${time}`]?.length);
                return (
                  <section className="calendar-day" key={day} aria-label={fmtDayHeader(day)}>
                    <h4 className={`calendar-day-heading ${day === today ? 'today' : ''}`}>{fmtDayHeader(day)}</h4>
                    <p className="calendar-period-label">{period === 'morning' ? 'Morning' : 'Afternoon'}</p>
                    {dayTimes.map((time) => (
                      <div className="calendar-slot" key={time}>{renderCell(day, time)}</div>
                    ))}
                    {!dayTimes.length && <p className="muted small calendar-empty">No times in this period</p>}
                  </section>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            className="link-btn weekend-toggle"
            aria-pressed={includeWeekend}
            onClick={() => setIncludeWeekend((previous) => !previous)}
          >
            {includeWeekend ? 'Show weekdays only' : 'Include weekend'}
          </button>
        </>
      )}

      <div className="legend">
        <span><i style={{ background: "var(--green-100)" }} />Available</span>
        <span><i style={{ background: "#f1efe6", border: "1px solid var(--line)" }} />Confirmed</span>
        <span><i style={{ background: "var(--amber-bg)" }} />Reserved / pending</span>
      </div>
    </div>
  );
}
