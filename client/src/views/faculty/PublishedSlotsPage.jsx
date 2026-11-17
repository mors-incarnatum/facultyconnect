import { hasEnded, isFutureSlot } from '../../utils/clock.js';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../hooks/useApp.js';
import Field from '../../components/Field.jsx';
import PageHead from '../../components/PageHead.jsx';
import PublishedSlotDay from '../../components/PublishedSlotDay.jsx';
import AvailabilityTabs from '../../components/AvailabilityTabs.jsx';
import { addDays, fmtShort, weekStartOf } from '../../utils/format.js';

function weekLabel(start) {
    const endIso = addDays(start, 6);
    return `${fmtShort(start)} – ${fmtShort(endIso)}, ${endIso.slice(0, 4)}`;
}

function PublishedSlotsPage() {
    const { now, user, slots, holderOf, appointments } = useApp();
    const [filters, setFilters] = useState({ date: '', status: '' });
    const [selectedWeek, setSelectedWeek] = useState('');
    const referencedSlotIds = new Set(appointments.map(function (appointment) {
        return appointment.slotId;
    }));

    const list = slots
        .filter(function (slot) {
            return slot.facultyId === user.id && !hasEnded(slot, now);
        })
        .map(function (slot) {
            return { slot: slot, holder: holderOf(slot.id) };
        })
        .filter(function ({ slot, holder }) {
            const slotStatus = (holder && holder.status) || 'available';
            return (
                (holder || isFutureSlot(slot, now))
                && (!filters.date || slot.date === filters.date)
                && (!filters.status || slotStatus === filters.status)
            );
        })
        .sort(function (a, b) {
            return (a.slot.date + a.slot.start).localeCompare(b.slot.date + b.slot.start);
        });

    const weeks = Array.from(new Set(list.map(function ({ slot }) {
        return weekStartOf(slot.date);
    })));
    const activeWeek = weeks.includes(selectedWeek) ? selectedWeek : weeks[0];
    const weekIndex = weeks.indexOf(activeWeek);
    const days = new Map();

    list.filter(function ({ slot }) {
        return weekStartOf(slot.date) === activeWeek;
    }).forEach(function (entry) {
        const entries = days.get(entry.slot.date) || [];
        entries.push(entry);
        days.set(entry.slot.date, entries);
    });

    function handleFilterChange(event) {
        const { name, value } = event.target;
        setFilters(function (prev) {
            return Object.assign({}, prev, { [name]: value });
        });
        setSelectedWeek('');
    }

    function handleClearFilters() {
        setFilters({ date: '', status: '' });
        setSelectedWeek('');
    }

    return (
        <>
            <PageHead
                title="My consultation availability"
                subtitle="Create, review, edit, or remove the dates and times students can request."
            />
            <AvailabilityTabs>
                <Link className="btn primary" to="/faculty/availability?add=1">+ Add availability</Link>
            </AvailabilityTabs>
            <div className="filters">
                <Field
                    name="date"
                    label="Filter slots by date"
                    type="date"
                    value={filters.date}
                    onChange={handleFilterChange}
                />
                <Field
                    name="status"
                    label="Filter slot status"
                    as="select"
                    value={filters.status}
                    onChange={handleFilterChange}
                >
                    <option value="">All statuses</option>
                    {['available', 'pending', 'confirmed'].map(function (status) {
                        return <option key={status}>{status}</option>;
                    })}
                </Field>
                <button className="btn" onClick={handleClearFilters}>Clear filters</button>
            </div>
            <section className="card published-slots">
                <h2>Published time slots</h2>
                <p className="muted faculty-spaced">
                    Browse by week and expand a day to manage its slots. Each slot allows one appointment.
                </p>
                {!list.length && (
                    <div className="empty">
                        <h3>{filters.date || filters.status ? 'No matching slots' : 'No published slots'}</h3>
                        <p className="muted">
                            {filters.date || filters.status
                                ? 'Try another date or status, or clear the filters.'
                                : 'Add a time or publish weekly hours to get started.'}
                        </p>
                    </div>
                )}
                {weeks.length > 0 && (
                    <>
                        <div className="published-week-navigation" role="group" aria-label="Published slot weeks">
                            <button
                                className="btn"
                                disabled={weekIndex === 0}
                                onClick={function () { setSelectedWeek(weeks[weekIndex - 1]); }}
                            >
                                ← Previous week
                            </button>
                            <Field
                                name="publishedWeek"
                                label="Published week"
                                as="select"
                                value={activeWeek}
                                onChange={function (event) { setSelectedWeek(event.target.value); }}
                            >
                                {weeks.map(function (week) {
                                    return <option key={week} value={week}>{weekLabel(week)}</option>;
                                })}
                            </Field>
                            <button
                                className="btn"
                                disabled={weekIndex === weeks.length - 1}
                                onClick={function () { setSelectedWeek(weeks[weekIndex + 1]); }}
                            >
                                Next week →
                            </button>
                        </div>
                        <p className="muted small" role="status">
                            Week {weekIndex + 1} of {weeks.length} with matching slots · {list.length} {list.length === 1 ? 'slot' : 'slots'} total
                        </p>
                        <div className="published-days" key={activeWeek}>
                            {Array.from(days).map(function ([date, entries]) {
                                return (
                                    <PublishedSlotDay
                                        key={date}
                                        date={date}
                                        entries={entries}
                                        referencedSlotIds={referencedSlotIds}
                                    />
                                );
                            })}
                        </div>
                    </>
                )}
            </section>
        </>
    );
}

export default PublishedSlotsPage;
