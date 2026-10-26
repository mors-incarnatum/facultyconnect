import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../../state/AppContext.jsx";
import { departments } from "../../data/mock.js";
import { Avatar, Field, PageHead, modeLabel } from "../../components/ui.jsx";
import WeekCalendar from "../../components/WeekCalendar.jsx";
import { fmtLong, fmtRange, fmtShort, fmtTime } from "../../utils/format.js";

function useFacultyResults() {
  const { faculty } = useApp();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const dept = params.get("dept") || "";
  const term = q.trim().toLowerCase();
  const results = faculty.filter((f) => {
    if (dept && f.department !== dept) return false;
    if (!term) return true;
    return [f.name, f.department, ...f.subjects, ...f.courses].join(" ").toLowerCase().includes(term);
  });
  return { q, dept, results, setParams };
}

export default function FacultySearch({ view }) {
  const { availableSlotsFor, getSlot, selection, setSelection, user } = useApp();
  const navigate = useNavigate();
  const { q, dept, results, setParams } = useFacultyResults();
  const [draftQ, setDraftQ] = useState(q);
  const [draftDept, setDraftDept] = useState(dept);
  const [sameTime, setSameTime] = useState([]);

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (draftQ.trim()) next.q = draftQ.trim();
    if (draftDept) next.dept = draftDept;
    setParams(next);
  };

  // Derived selection: keep the chosen faculty/slot when still valid.
  const selFaculty = results.find((f) => f.id === selection.facultyId) || results[0] || null;
  const options = selFaculty ? availableSlotsFor(selFaculty.id) : [];
  const chosen = getSlot(selection.slotId);
  const selSlot = options.find((s) => s.id === chosen?.id) || options[0] || null;

  const pickFaculty = (f) => setSelection({ facultyId: f.id, slotId: availableSlotsFor(f.id)[0]?.id || null });
  const pickSlot = (s) => setSelection({ facultyId: s.facultyId, slotId: s.id });
  const upNext = results.flatMap((f) => availableSlotsFor(f.id).slice(0, 2).map((s) => ({ s, f })))
    .sort((a, b) => (a.s.date + a.s.start).localeCompare(b.s.date + b.s.start)).slice(0, 3);

  return (
    <>
      <PageHead
        title="Find your academic guide"
        subtitle={view === "list" ? "Compare faculty, then choose a consultation time that works for you." : "Explore available times while keeping faculty details close at hand."}
      />
      <form className="search-bar" onSubmit={submit} role="search">
        <Field label="Search faculty" value={draftQ} onChange={(e) => setDraftQ(e.target.value)} placeholder="Search by name, department, or subject" />
        <Field label="Department" as="select" value={draftDept} onChange={(e) => setDraftDept(e.target.value)}>
          <option value="">All departments</option>
          {departments.map((d) => <option key={d}>{d}</option>)}
        </Field>
        <button className="btn primary" type="submit">Search</button>
      </form>

      <div className="toolbar">
        <strong className="muted small">{results.length} faculty · {dept || "All departments"}{q ? ` · “${q}”` : ""}</strong>
        <div className="toggle auto" role="group" aria-label="View">
          <button type="button" aria-pressed={view === "list"} onClick={() => navigate(`/student/faculty${window.location.hash.includes("?") ? "?" + window.location.hash.split("?")[1] : ""}`)}>List</button>
          <button type="button" aria-pressed={view === "calendar"} onClick={() => navigate(`/student/faculty/calendar${window.location.hash.includes("?") ? "?" + window.location.hash.split("?")[1] : ""}`)}>Calendar</button>
        </div>
      </div>

      <div className="two-col">
        <div>
          {results.length === 0 ? (
            <div className="card empty">
              <h3>No faculty match your search</h3>
              <p className="muted">Try a different name, subject, or department.</p>
              <div className="btn-row" style={{ justifyContent: "center" }}>
                <button className="btn" onClick={() => { setDraftQ(""); setDraftDept(""); setParams({}); }}>Clear search</button>
              </div>
            </div>
          ) : view === "list" ? (
            <>
              <div className="list-head"><span>Faculty</span><span>Next available</span><span style={{ textAlign: "center" }}>Action</span></div>
              {results.map((f) => {
                const next = availableSlotsFor(f.id)[0];
                const selected = selFaculty?.id === f.id;
                return (
                  <button key={f.id} type="button" className={`row ${selected ? "selected" : ""}`} onClick={() => pickFaculty(f)} aria-pressed={selected}>
                    <span className="who">
                      <Avatar person={f} />
                      <span><strong>{f.name}</strong><span className="muted small">{f.department}</span></span>
                    </span>
                    <span className="when">
                      {next ? (<><strong>{fmtShort(next.date)} · {fmtTime(next.start)}</strong><span className="muted small">{next.mode === "online" ? "Online consultation" : next.location}</span></>) : <span className="muted small">No open times</span>}
                    </span>
                    <span className="act">{selected ? "Selected" : "View profile"}</span>
                  </button>
                );
              })}
              <div className="notice" style={{ marginTop: 4 }}>
                Choose a faculty member to see their consultation details.
                <div className="muted small" style={{ marginTop: 8 }}>Availability updated Oct 26, 2026 · 9:45 AM. Slots are checked again when you submit.</div>
              </div>
            </>
          ) : (
            <>
              <WeekCalendar
                facultyIds={results.map((f) => f.id)}
                studentId={user.id}
                pickedSlotId={selSlot?.id}
                onPick={(slots) => { pickSlot(slots[0]); setSameTime(slots.length > 1 ? slots : []); }}
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
          <aside className="card preview" aria-label="Faculty preview">
            <div className="eyebrow">Faculty preview</div>
            <div className="head">
              <Avatar person={selFaculty} size="lg" />
              <div>
                <h3>{selFaculty.name}</h3>
                <div className="muted small">{selFaculty.rank}</div>
                <strong>{selFaculty.department}</strong>
              </div>
            </div>
            <p className="muted">{selFaculty.subjects.join(" · ")}<br />{selFaculty.courses.join(" and ")}</p>
            <hr className="divider" />
            {selSlot ? (
              <>
                <span className="badge">Available</span>
                <div className="when-big">{fmtLong(selSlot.date)}</div>
                <div className="time-big">{fmtRange(selSlot.start, selSlot.end)}</div>
                <p className="muted" style={{ marginBottom: 16 }}>{modeLabel(selSlot)} · 30 minutes<br />{selSlot.location}</p>
                <Link className="btn primary block" to={`/student/request?slot=${selSlot.id}`}>Request consultation →</Link>
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
            <p style={{ marginTop: 10 }}><Link to={`/student/faculty/${selFaculty.id}`}>View full profile →</Link></p>
          </aside>
        )}
      </div>
    </>
  );
}
