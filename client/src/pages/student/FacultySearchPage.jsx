import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp.js';
import { departments } from '../../data/initialData.js';
import Avatar from '../../components/Avatar.jsx';
import Field from '../../components/Field.jsx';
import PageHead from '../../components/PageHead.jsx';
import { modeLabel } from '../../utils/presentation.js';
import WeekCalendar from '../../components/WeekCalendar.jsx';
import { fmtLong, fmtRange, fmtShort, fmtTime } from '../../utils/format.js';
import { useFacultyResults } from '../../hooks/useFacultyResults.js';

export default function FacultySearchPage({ view }) {
  const { availableSlotsFor, getSlot, selection, setSelection, user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { q, dept, results, params, setParams } = useFacultyResults();
  const preview = useRef(null);
  const [filters, setFilters] = useState({ q, dept });
  const [sameTime, setSameTime] = useState([]);
  useEffect(() => {
    setFilters({ q, dept });
    setSameTime([]);
  }, [q, dept]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {};
    if (filters.q.trim()) next.q = filters.q.trim();
    if (filters.dept) next.dept = filters.dept;
    setParams(next);
  };

  const handleClearSearch = () => {
    setFilters({ q: '', dept: '' });
    setParams({});
  };

  // Derived selection: keep the chosen faculty/slot when still valid.
  const selFaculty = results.find((f) => f.id === (params.get("faculty") || selection.facultyId)) || results[0] || null;
  const options = selFaculty ? availableSlotsFor(selFaculty.id) : [];
  const chosen = getSlot(params.get("slot") || selection.slotId);
  const selSlot = options.find((s) => s.id === chosen?.id) || options[0] || null;

  const choose = (facultyId, slotId) => {
    setSelection({ facultyId, slotId });
    const next = new URLSearchParams(params);
    next.set("faculty", facultyId);
    if (slotId) next.set("slot", slotId); else next.delete("slot");
    setParams(next);
    if (window.matchMedia("(max-width: 1100px)").matches) preview.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  };
  const pickFaculty = (f) => choose(f.id, availableSlotsFor(f.id)[0]?.id || null);
  const pickSlot = (s) => choose(s.facultyId, s.id);
  const handlePickSlots = (slots) => {
    pickSlot(slots[0]);
    setSameTime(slots.length > 1 ? slots : []);
  };
  const onward = { ...location.state, returnTo: location.pathname + location.search };
  const upNext = results.flatMap((f) => availableSlotsFor(f.id).slice(0, 2).map((s) => ({ s, f })))
    .sort((a, b) => (a.s.date + a.s.start).localeCompare(b.s.date + b.s.start)).slice(0, 3);

  return (
    <>
      <PageHead
        title="Find your academic guide"
        subtitle={view === "list" ? "Compare faculty, then choose a consultation time that works for you." : "Explore available times while keeping faculty details close at hand."}
      />
      <form className="search-bar" onSubmit={handleSubmit} role="search">
        <Field name="q" label="Search faculty" value={filters.q} onChange={handleChange} placeholder="Search by name, department, or subject" />
        <Field name="dept" label="Department" as="select" value={filters.dept} onChange={handleChange}>
          <option value="">All departments</option>
          {departments.map((d) => <option key={d}>{d}</option>)}
        </Field>
        <button className="btn primary" type="submit">Search</button>
      </form>

      <div className="toolbar">
        <strong className="muted small">{results.length} faculty · {dept || "All departments"}{q ? ` · “${q}”` : ""}</strong>
        <div className="toggle auto" role="group" aria-label="View">
          <button type="button" aria-pressed={view === "list"} onClick={() => navigate(`/student/faculty${location.search}`, { state: location.state })}>List</button>
          <button type="button" aria-pressed={view === "calendar"} onClick={() => navigate(`/student/faculty/calendar${location.search}`, { state: location.state })}>Calendar</button>
        </div>
      </div>

      <div className={`two-col ${view === "list" ? "faculty-directory" : ""}`}>
        <div>
          {results.length === 0 ? (
            <div className="card empty">
              <h3>No faculty match your search</h3>
              <p className="muted">Try a different name, subject, or department.</p>
              <div className="btn-row" style={{ justifyContent: "center" }}>
                <button className="btn" onClick={handleClearSearch}>Clear search</button>
              </div>
            </div>
          ) : view === "list" ? (
            <>
              <div className="list-head"><span>Faculty</span><span>Next available</span></div>
              {results.map((f) => {
                const next = availableSlotsFor(f.id)[0];
                const selected = selFaculty?.id === f.id;
                return (
                  <button key={f.id} type="button" className={`row ${selected ? "selected" : ""}`} onClick={() => pickFaculty(f)} aria-pressed={selected}>
                    <span className="who">
                      <Avatar person={f} />
                      <span style={{ minWidth: 0 }}>
                        <strong>
                          {f.name}
                          {f.pronouns && <span className="profile-pronouns" style={{ marginLeft: 6 }}>{f.pronouns}</span>}
                        </strong>
                        <span className="muted small">{f.department}</span>
                        {f.specialties && <span className="muted small" style={{ display: 'block', fontSize: 11, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.specialties.slice(0, 2).join(' · ')}</span>}
                      </span>
                    </span>
                    <span className="when">
                      {next ? (<><strong>{fmtShort(next.date)} · {fmtTime(next.start)}</strong><span className="muted small">{next.mode === "online" ? "Online consultation" : next.location}</span></>) : <span className="muted small">No open times</span>}
                    </span>
                  </button>
                );
              })}
              <div className="notice" style={{ marginTop: 4 }}>
                Choose a faculty member to see their consultation details.
                <div className="muted small" style={{ marginTop: 8 }}>Slots are checked again when you submit.</div>
              </div>
            </>
          ) : (
            <>
              <WeekCalendar
                facultyIds={results.map((f) => f.id)}
                studentId={user.id}
                pickedSlotId={selSlot?.id}
                onPick={handlePickSlots}
              />
              {sameTime.length > 1 && (
                <div className="card tint" style={{ marginTop: 16 }}>
                  <strong>Available at the same time</strong>
                  <div className="btn-row" style={{ marginTop: 10 }}>
                    {sameTime.map((s) => (
                      <button key={s.id} className="btn sm" onClick={() => pickSlot(s)}>{results.find((f) => f.id === s.facultyId)?.name}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="next-week">
                <strong>Coming up</strong>
                {upNext.length ? upNext.map(({ s, f }) => (
                  <button key={s.id} className="link-btn" style={{ marginRight: 16 }} onClick={() => pickSlot(s)}>
                    {f.name.replace(/^(Dr\.|Prof\.)\s*/, "")} · {fmtShort(s.date)} · {fmtTime(s.start)}
                  </button>
                )) : <span className="muted">No open times for this search.</span>}
              </div>
            </>
          )}
        </div>

        {selFaculty && (
          <aside className="card preview" aria-label="Faculty profile" ref={preview}>
            <div className="eyebrow">Faculty profile</div>
            <div className="head">
              <Avatar person={selFaculty} size="lg" />
              <div>
                <h3>
                  {selFaculty.name}
                  {selFaculty.pronouns && <span className="profile-pronouns" style={{ marginLeft: 6, fontSize: 11 }}>{selFaculty.pronouns}</span>}
                </h3>
                <div className="muted small">{selFaculty.rank}</div>
                <strong>{selFaculty.department}</strong>
              </div>
            </div>
            {selFaculty.motto && (
              <p className="profile-quote" style={{ fontSize: 12, padding: "8px 12px", margin: "10px 0" }}>
                “{selFaculty.motto}”
              </p>
            )}
            <p className="muted" style={{ margin: "8px 0" }}>
              {selFaculty.subjects.join(" · ")}<br />{selFaculty.courses.join(" and ")}
            </p>
            {selFaculty.specialties && (
              <div className="profile-tags" style={{ marginBottom: 10 }}>
                {selFaculty.specialties.slice(0, 3).map((spec) => (
                  <span key={spec} className="profile-tag highlight" style={{ fontSize: 11, padding: "2px 8px" }}>{spec}</span>
                ))}
              </div>
            )}
            {selFaculty.consultationTip && (
              <div className="profile-tip" style={{ padding: "8px 10px", fontSize: 12, marginBottom: 12 }}>
                <span className="profile-tip-icon" style={{ fontSize: 13 }} aria-hidden="true">💡</span>
                <div><strong>Tip:</strong> {selFaculty.consultationTip}</div>
              </div>
            )}
            <hr className="divider" />
            {selSlot ? (
              <>
                <span className="badge">Available</span>
                <div className="when-big">{fmtLong(selSlot.date)}</div>
                <div className="time-big">{fmtRange(selSlot.start, selSlot.end)}</div>
                <p className="muted" style={{ marginBottom: 16 }}>{modeLabel(selSlot)} · 30 minutes<br />{selSlot.location}</p>
                <Link className="btn primary block" to={`/student/request?slot=${selSlot.id}`} state={onward}>Request consultation →</Link>
                <div style={{ marginTop: 18 }}><strong>Other available times</strong>
                  <ul>
                    {options.filter((s) => s.id !== selSlot.id).slice(0, 4).map((s) => (
                      <li key={s.id}><button onClick={() => pickSlot(s)}>{fmtShort(s.date)} · {fmtRange(s.start, s.end)}</button></li>
                    ))}
                    {options.length <= 1 && <li className="muted small">No other times right now.</li>}
                  </ul>
                </div>
              </>
            ) : <div className="notice warn">No open consultation times at the moment.</div>}
            <hr className="divider" />
            <p className="muted small">Pending requests reserve the selected slot until the faculty responds.</p>
            <p style={{ marginTop: 10 }}><Link to={`/student/faculty/${selFaculty.id}`} state={onward}>View full profile →</Link></p>
          </aside>
        )}
      </div>
    </>
  );
}
