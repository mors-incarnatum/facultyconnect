import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../../hooks/useApp.js';
import { useStudentRecords } from '../../hooks/useAppointments.js';
import Avatar from '../../components/Avatar.jsx';
import AppointmentGuidance from '../../components/AppointmentGuidance.jsx';
import PageHead from '../../components/PageHead.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import AppointmentDialog from '../../components/AppointmentDialog.jsx';
import { canManageAppointment, isCurrentAppointment, modeLabel, STATUSES } from '../../utils/presentation.js';
import { fmtLong, fmtMonthDay, fmtRange, fmtTime } from '../../utils/format.js';

export default function AppointmentsPage() {
    const detailHeading = useRef(null);
    const listHeading = useRef(null);
    const returnPosition = useRef(0);
    const [dialog, setDialog] = useState(null);
    const { now } = useApp();
    const mine = useStudentRecords();
    const [params, setParams] = useSearchParams();
    const status = STATUSES.includes(params.get('status')) ? params.get('status') : '';

    function handleFilter(key, value) {
        const next = new URLSearchParams(params);
        next.delete('id');
        next.delete('scope');
        if (value) {
            next.set(key, value);
        } else {
            next.delete(key);
        }
        setParams(next);
    }

    function stamp(a) {
        return a.slot.date + a.slot.start;
    }

    const current = mine
        .filter(function (a) {
            return isCurrentAppointment(a, a.slot, now);
        })
        .sort(function (a, b) {
            return stamp(a).localeCompare(stamp(b));
        });
    const previous = mine
        .filter(function (a) {
            return !isCurrentAppointment(a, a.slot, now);
        })
        .sort(function (a, b) {
            return stamp(b).localeCompare(stamp(a));
        });
    const pool = current.concat(previous);
    const list = status
        ? pool.filter(function (a) {
            return a.status === status;
        })
        : pool;
    const sel = list.find(function (a) {
        return a.id === params.get('id');
    }) || list[0] || null;

    function handleSelect(id) {
        const next = new URLSearchParams(params);
        next.set('id', id);
        returnPosition.current = window.scrollY;
        setParams(next);
        if (window.matchMedia('(max-width: 1100px)').matches) {
            requestAnimationFrame(function () {
                if (detailHeading.current) {
                    detailHeading.current.focus();
                    detailHeading.current.scrollIntoView({ block: 'start' });
                }
            });
        }
    }

    function handleBackToList() {
        if (listHeading.current) {
            listHeading.current.focus({ preventScroll: true });
        }
        window.scrollTo(0, returnPosition.current);
    }

    function handleDialogSaved(mode) {
        setDialog(null);
        if (mode === 'cancel' && status && sel) {
            const next = new URLSearchParams(params);
            next.delete('status');
            next.set('id', sel.id);
            setParams(next);
        }
    }

    return (
        <>
            <PageHead title="My appointments" subtitle="Review your current consultations and previous appointment records." />
            <div className="filters" role="group" aria-label="Appointment status" ref={listHeading} tabIndex={-1}>
                <button
                    type="button"
                    aria-pressed={!status}
                    onClick={function () { handleFilter('status', ''); }}
                >
                    All statuses ({pool.length})
                </button>
                {STATUSES.map(function (category) {
                    const count = pool.filter(function (a) {
                        return a.status === category;
                    }).length;
                    return (
                        <button
                            key={category}
                            type="button"
                            aria-pressed={status === category}
                            onClick={function () { handleFilter('status', category); }}
                        >
                            {category[0].toUpperCase() + category.slice(1)} ({count})
                        </button>
                    );
                })}
            </div>
            <div className="two-col appointments-workspace">
                <div>
                    {list.length === 0 && (
                        <div className="card empty">
                            <h3>No appointments here</h3>
                            <p className="muted">
                                Try a different filter, or <Link to="/student/faculty">find a faculty member</Link>.
                            </p>
                        </div>
                    )}
                    {list.map(function (a) {
                        const selected = Boolean(sel && sel.id === a.id);
                        return (
                            <button
                                key={a.id}
                                type="button"
                                className={`appt-row ${selected ? 'selected' : ''}`}
                                onClick={function () { handleSelect(a.id); }}
                                aria-pressed={selected}
                            >
                                <span style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
                                    <Avatar person={a.faculty} size="sm" />
                                    <span style={{ minWidth: 0 }}>
                                        <strong>{a.faculty.name}</strong>
                                        <span className="meta">
                                            {fmtMonthDay(a.slot.date)} · {fmtRange(a.slot.start, a.slot.end)} · {a.subject}
                                        </span>
                                    </span>
                                </span>
                                <span><StatusBadge status={a.status} /></span>
                            </button>
                        );
                    })}
                </div>
                {sel && (
                    <aside className="card detail" aria-label="Appointment details">
                        <StatusBadge status={sel.status} />
                        <div className="appointment-faculty">
                            <Avatar person={sel.faculty} size="lg" />
                            <div>
                                <h3 ref={detailHeading} tabIndex={-1}>
                                    {sel.faculty.name}
                                    {sel.faculty.pronouns && (
                                        <span className="profile-pronouns" style={{ marginLeft: 6, fontSize: 11 }}>
                                            {sel.faculty.pronouns}
                                        </span>
                                    )}
                                </h3>
                                <div className="muted small">{sel.faculty.rank} · {sel.faculty.department}</div>
                                <div className="muted small">{sel.faculty.office}</div>
                            </div>
                        </div>
                        <button type="button" className="link-btn mobile-details-back" onClick={handleBackToList}>
                            ← Back to appointment list
                        </button>
                        <div className="day">{fmtLong(sel.slot.date)}</div>
                        <div className="time">{fmtTime(sel.slot.start)}–{fmtTime(sel.slot.end)}</div>
                        <p className="muted">
                            {sel.slot.mode === 'online'
                                ? sel.slot.location || modeLabel(sel.slot)
                                : `${modeLabel(sel.slot)} · ${sel.slot.location}`}
                        </p>
                        <AppointmentGuidance status={sel.status} autoDeclined={sel.autoDeclined} slot={sel.slot} />
                        <hr className="divider" />
                        <strong>{sel.subject}{sel.topic ? ` · ${sel.topic}` : ''}</strong>
                        <p className="muted" style={{ marginTop: 8 }}>
                            {sel.topic ? sel.description : 'No topic added.'}
                        </p>
                        {canManageAppointment(sel, sel.slot, now) ? (
                            <div className="actions">
                                <button
                                    type="button"
                                    className="btn block"
                                    onClick={function () { setDialog('edit'); }}
                                >
                                    {sel.topic ? 'Edit Topic' : 'Add a topic'}
                                </button>
                                <button
                                    type="button"
                                    className="link-btn danger"
                                    onClick={function () { setDialog('cancel'); }}
                                >
                                    Cancel Appointment
                                </button>
                                <p className="muted small" style={{ textAlign: 'center' }}>
                                    Manage your consultation topic before the meeting.
                                </p>
                                {sel.topic && (
                                    <Link style={{ textAlign: 'center' }} to={`/student/appointments/${sel.id}/delete-topic`}>
                                        Delete topic
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <p className="muted small" style={{ marginTop: 16 }}>
                                Editing is closed for this appointment.
                            </p>
                        )}
                    </aside>
                )}
            </div>
            {dialog && sel && (
                <AppointmentDialog
                    key={`${sel.id}:${dialog}`}
                    appointment={sel}
                    mode={dialog}
                    onClose={function () { setDialog(null); }}
                    onSaved={handleDialogSaved}
                />
            )}
        </>
    );
}
