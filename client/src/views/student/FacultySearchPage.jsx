import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../hooks/useApp.js';
import Avatar from '../../components/Avatar.jsx';
import Field from '../../components/Field.jsx';
import PageHead from '../../components/PageHead.jsx';
import { departments, modeLabel } from '../../utils/presentation.js';
import WeekCalendar from '../../components/WeekCalendar.jsx';
import { fmtLong, fmtRange, fmtShort, fmtTime } from '../../utils/format.js';
import { useFacultyResults } from '../../hooks/useFacultyResults.js';

export default function FacultySearchPage({ view }) {
    const { availableSlotsFor, getSlot, selection, setSelection, user } = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const { q, dept, results, params, setParams } = useFacultyResults();
    const preview = useRef(null);
    const [filters, setFilters] = useState({ q: q, dept: dept });
    const [sameTime, setSameTime] = useState([]);

    useEffect(function () {
        setFilters({ q: q, dept: dept });
        setSameTime([]);
    }, [q, dept]);

    function handleChange(event) {
        const { name, value } = event.target;
        setFilters(function (prev) {
            return Object.assign({}, prev, { [name]: value });
        });
    }

    function handleSubmit(e) {
        e.preventDefault();
        const next = {};
        if (filters.q.trim()) {
            next.q = filters.q.trim();
        }
        if (filters.dept) {
            next.dept = filters.dept;
        }
        setParams(next);
    }

    function handleClearSearch() {
        setFilters({ q: '', dept: '' });
        setParams({});
    }

    const selectedFacultyParam = params.get('faculty') || selection.facultyId;
    const selFaculty = results.find(function (f) {
        return f.id === selectedFacultyParam;
    }) || results[0] || null;
    const options = selFaculty ? availableSlotsFor(selFaculty.id) : [];
    const chosen = getSlot(params.get('slot') || selection.slotId);
    const selSlot = options.find(function (s) {
        return chosen && s.id === chosen.id;
    }) || options[0] || null;

    function choose(facultyId, slotId) {
        setSelection({ facultyId: facultyId, slotId: slotId });
        const next = new URLSearchParams(params);
        next.set('faculty', facultyId);
        if (slotId) {
            next.set('slot', slotId);
        } else {
            next.delete('slot');
        }
        setParams(next);
        if (window.matchMedia('(max-width: 1100px)').matches && preview.current) {
            preview.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }
    }

    function pickFaculty(f) {
        const firstSlot = availableSlotsFor(f.id)[0];
        choose(f.id, firstSlot ? firstSlot.id : null);
    }

    function pickSlot(s) {
        choose(s.facultyId, s.id);
    }

    function handlePickSlots(pickedSlots) {
        pickSlot(pickedSlots[0]);
        setSameTime(pickedSlots.length > 1 ? pickedSlots : []);
    }

    const onward = Object.assign({}, location.state, {
        returnTo: location.pathname + location.search,
    });
    const upNext = results
        .flatMap(function (f) {
            return availableSlotsFor(f.id).slice(0, 2).map(function (s) {
                return { s: s, f: f };
            });
        })
        .sort(function (a, b) {
            return (a.s.date + a.s.start).localeCompare(b.s.date + b.s.start);
        })
        .slice(0, 3);

    return (
        <>
            <PageHead
                title="Find your academic guide"
                subtitle={
                    view === 'list'
                        ? 'Compare faculty, then choose a consultation time that works for you.'
                        : 'Explore available times while keeping faculty details close at hand.'
                }
            />
            <details className={`faculty-search-options ${view === 'list' ? 'list-search-options' : ''}`} open={view === 'list'}>
                <summary>Search and filter faculty</summary>
                <form className="search-bar" onSubmit={handleSubmit} role="search">
                    <Field
                        name="q"
                        label="Search faculty"
                        value={filters.q}
                        onChange={handleChange}
                        placeholder="Search by name, department, or subject"
                    />
                    <Field name="dept" label="Department" as="select" value={filters.dept} onChange={handleChange}>
                        <option value="">All departments</option>
                        {departments.map(function (d) {
                            return <option key={d}>{d}</option>;
                        })}
                    </Field>
                    <button className="btn primary" type="submit">Search</button>
                </form>
            </details>

            {view === 'list' && (
                <div className="toolbar">
                    <strong className="muted small">
                        {results.length} faculty · {dept || 'All departments'}{q ? ` · “${q}”` : ''}
                    </strong>
                    <div className="toggle auto" role="group" aria-label="View">
                        <button
                            type="button"
                            aria-pressed={view === 'list'}
                            onClick={function () {
                                navigate(`/student/faculty${location.search}`, { state: location.state });
                            }}
                        >
                            List
                        </button>
                        <button
                            type="button"
                            aria-pressed={view === 'calendar'}
                            onClick={function () {
                                navigate(`/student/faculty/calendar${location.search}`, { state: location.state });
                            }}
                        >
                            Calendar
                        </button>
                    </div>
                </div>
            )}

            <div className={`two-col ${view === 'list' ? 'faculty-directory' : 'calendar-directory'}`}>
                <div>
                    {results.length === 0 ? (
                        <div className="card empty">
                            <h3>No faculty match your search</h3>
                            <p className="muted">Try a different name, subject, or department.</p>
                            <div className="btn-row" style={{ justifyContent: 'center' }}>
                                <button className="btn" onClick={handleClearSearch}>Clear search</button>
                            </div>
                        </div>
                    ) : view === 'list' ? (
                        <>
                            <div className="list-head">
                                <span>Faculty</span>
                                <span>Next available</span>
                            </div>
                            {results.map(function (f) {
                                const next = availableSlotsFor(f.id)[0];
                                const selected = selFaculty && selFaculty.id === f.id;
                                return (
                                    <button
                                        key={f.id}
                                        type="button"
                                        className={`row ${selected ? 'selected' : ''}`}
                                        onClick={function () { pickFaculty(f); }}
                                        aria-pressed={selected}
                                    >
                                        <span className="who">
                                            <Avatar person={f} />
                                            <span style={{ minWidth: 0 }}>
                                                <strong>
                                                    {f.name}
                                                    {f.pronouns && (
                                                        <span className="profile-pronouns" style={{ marginLeft: 6 }}>
                                                            {f.pronouns}
                                                        </span>
                                                    )}
                                                </strong>
                                                <span className="muted small">{f.department}</span>
                                                {f.specialties && (
                                                    <span
                                                        className="muted small"
                                                        style={{
                                                            display: 'block',
                                                            fontSize: 11,
                                                            opacity: 0.85,
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                        }}
                                                    >
                                                        {f.specialties.slice(0, 2).join(' · ')}
                                                    </span>
                                                )}
                                            </span>
                                        </span>
                                        <span className="when">
                                            {next ? (
                                                <>
                                                    <strong>{fmtShort(next.date)} · {fmtTime(next.start)}</strong>
                                                    <span className="muted small">
                                                        {next.mode === 'online' ? 'Online consultation' : next.location}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="muted small">No open times</span>
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                            <div className="notice" style={{ marginTop: 4 }}>
                                Choose a faculty member to see their consultation details.
                                <div className="muted small" style={{ marginTop: 8 }}>
                                    Slots are checked again when you submit.
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <WeekCalendar
                                className="availability-calendar"
                                viewActions={(
                                    <div className="toggle auto" role="group" aria-label="View">
                                        <button
                                            type="button"
                                            onClick={function () {
                                                navigate(`/student/faculty${location.search}`, { state: location.state });
                                            }}
                                        >
                                            List
                                        </button>
                                        <button type="button" aria-pressed="true">Calendar</button>
                                    </div>
                                )}
                                facultyIds={results.map(function (f) { return f.id; })}
                                studentId={user.id}
                                pickedSlotId={selSlot ? selSlot.id : undefined}
                                onPick={handlePickSlots}
                            />
                            {sameTime.length > 1 && (
                                <div className="card tint" style={{ marginTop: 16 }}>
                                    <strong>Available at the same time</strong>
                                    <div className="btn-row" style={{ marginTop: 10 }}>
                                        {sameTime.map(function (s) {
                                            const match = results.find(function (f) {
                                                return f.id === s.facultyId;
                                            });
                                            return (
                                                <button
                                                    key={s.id}
                                                    className="btn sm"
                                                    onClick={function () { pickSlot(s); }}
                                                >
                                                    {match ? match.name : ''}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            <details className="calendar-coming-up">
                                <summary>Coming up</summary>
                                <div className="next-week">
                                    {upNext.length ? (
                                        upNext.map(function ({ s, f }) {
                                            return (
                                                <button
                                                    key={s.id}
                                                    className="link-btn"
                                                    style={{ marginRight: 16 }}
                                                    onClick={function () { pickSlot(s); }}
                                                >
                                                    {f.name.replace(/^(Dr\.|Prof\.)\s*/, '')} · {fmtShort(s.date)} · {fmtTime(s.start)}
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <span className="muted">No open times for this search.</span>
                                    )}
                                </div>
                            </details>
                        </>
                    )}
                </div>

                {selFaculty && view === 'calendar' ? (
                    <aside className="selected-slot-summary" ref={preview} aria-label="Selected consultation time">
                        <div>
                            <strong>
                                {selFaculty.name}
                                {selSlot ? ` · ${fmtShort(selSlot.date)} · ${fmtRange(selSlot.start, selSlot.end)}` : ''}
                            </strong>
                            <p>{selSlot ? `${modeLabel(selSlot)} · ${selSlot.location}` : 'No open consultation times at the moment.'}</p>
                        </div>
                        {selSlot && (
                            <Link
                                className="btn primary"
                                aria-label="Request consultation →"
                                to={`/student/request?slot=${selSlot.id}`}
                                state={onward}
                            >
                                Continue →
                            </Link>
                        )}
                    </aside>
                ) : selFaculty && (
                    <aside className="card preview" aria-label="Faculty profile" ref={preview}>
                        <div className="eyebrow">Faculty profile</div>
                        <div className="head">
                            <Avatar person={selFaculty} size="lg" />
                            <div>
                                <h3>
                                    {selFaculty.name}
                                    {selFaculty.pronouns && (
                                        <span className="profile-pronouns" style={{ marginLeft: 6, fontSize: 11 }}>
                                            {selFaculty.pronouns}
                                        </span>
                                    )}
                                </h3>
                                <div className="muted small">{selFaculty.rank}</div>
                                <strong>{selFaculty.department}</strong>
                            </div>
                        </div>
                        {selFaculty.motto && (
                            <p className="profile-quote" style={{ fontSize: 12, padding: '8px 12px', margin: '10px 0' }}>
                                “{selFaculty.motto}”
                            </p>
                        )}
                        <p className="muted" style={{ margin: '8px 0' }}>
                            {selFaculty.subjects.join(' · ')}<br />{selFaculty.courses.join(' and ')}
                        </p>
                        {selFaculty.specialties && (
                            <div className="profile-tags" style={{ marginBottom: 10 }}>
                                {selFaculty.specialties.slice(0, 3).map(function (spec) {
                                    return (
                                        <span
                                            key={spec}
                                            className="profile-tag highlight"
                                            style={{ fontSize: 11, padding: '2px 8px' }}
                                        >
                                            {spec}
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                        {selFaculty.consultationTip && (
                            <div className="profile-tip" style={{ padding: '8px 10px', fontSize: 12, marginBottom: 12 }}>
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
                                <p className="muted" style={{ marginBottom: 16 }}>
                                    {modeLabel(selSlot)} · 30 minutes<br />{selSlot.location}
                                </p>
                                <Link
                                    className="btn primary block"
                                    to={`/student/request?slot=${selSlot.id}`}
                                    state={onward}
                                >
                                    Request consultation →
                                </Link>
                                <div style={{ marginTop: 18 }}>
                                    <strong>Other available times</strong>
                                    <ul>
                                        {options
                                            .filter(function (s) { return s.id !== selSlot.id; })
                                            .slice(0, 4)
                                            .map(function (s) {
                                                return (
                                                    <li key={s.id}>
                                                        <button onClick={function () { pickSlot(s); }}>
                                                            {fmtShort(s.date)} · {fmtRange(s.start, s.end)}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        {options.length <= 1 && (
                                            <li className="muted small">No other times right now.</li>
                                        )}
                                    </ul>
                                </div>
                            </>
                        ) : (
                            <div className="notice warn">No open consultation times at the moment.</div>
                        )}
                        <hr className="divider" />
                        <p className="muted small">
                            Pending requests reserve the selected slot until the faculty responds.
                        </p>
                        <p style={{ marginTop: 10 }}>
                            <Link to={`/student/faculty/${selFaculty.id}`} state={onward}>View full profile →</Link>
                        </p>
                    </aside>
                )}
            </div>
        </>
    );
}
