import { hasEnded, isFutureSlot } from '../../utils/clock.js';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../hooks/useApp.js';
import Field from '../../components/Field.jsx';
import PageHead from '../../components/PageHead.jsx';
import PublishedSlotDay from '../../components/PublishedSlotDay.jsx';
import AvailabilityTabs from '../../components/AvailabilityTabs.jsx';
import { addDays, fmtShort, weekStartOf } from '../../utils/format.js';

const weekLabel = (start) => `${fmtShort(start)} – ${fmtShort(addDays(start, 6))}, ${addDays(start, 6).slice(0, 4)}`;

const PublishedSlotsPage = () => {
  const { now, user, slots, holderOf, appointments } = useApp();
  const [filters, setFilters] = useState({ date: '', status: '' });
  const [selectedWeek, setSelectedWeek] = useState('');
  const referencedSlotIds = new Set(appointments.map((appointment) => appointment.slotId));
  const list = slots
    .filter((slot) => slot.facultyId === user.id && !hasEnded(slot, now))
    .map((slot) => ({ slot, holder: holderOf(slot.id) }))
    .filter(({ slot, holder }) => (
      (holder || isFutureSlot(slot, now))
      && (!filters.date || slot.date === filters.date)
      && (!filters.status || (holder?.status || 'available') === filters.status)
    ))
    .sort((a, b) => (a.slot.date + a.slot.start).localeCompare(b.slot.date + b.slot.start));
  const weeks = [...new Set(list.map(({ slot }) => weekStartOf(slot.date)))];
  const activeWeek = weeks.includes(selectedWeek) ? selectedWeek : weeks[0];
  const weekIndex = weeks.indexOf(activeWeek);
  const days = new Map();
  list.filter(({ slot }) => weekStartOf(slot.date) === activeWeek).forEach((entry) => {
    const entries = days.get(entry.slot.date) || [];
    entries.push(entry);
    days.set(entry.slot.date, entries);
  });

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setSelectedWeek('');
  };

  const handleClearFilters = () => {
    setFilters({ date: '', status: '' });
    setSelectedWeek('');
  };

  return (
    <>
      <PageHead title="My consultation availability" subtitle="Create, review, edit, or remove the dates and times students can request." />
      <AvailabilityTabs><Link className="btn primary" to="/faculty/availability?add=1">+ Add availability</Link></AvailabilityTabs>
      <div className="filters">
        <Field name="date" label="Filter slots by date" type="date" value={filters.date} onChange={handleFilterChange} />
        <Field name="status" label="Filter slot status" as="select" value={filters.status} onChange={handleFilterChange}>
          <option value="">All statuses</option>
          {['available', 'pending', 'confirmed'].map((status) => <option key={status}>{status}</option>)}
        </Field>
        <button className="btn" onClick={handleClearFilters}>Clear filters</button>
      </div>
      <section className="card published-slots">
        <h2>Published time slots</h2>
        <p className="muted faculty-spaced">Browse by week and expand a day to manage its slots. Each slot allows one appointment.</p>
        {!list.length && (
          <div className="empty">
            <h3>{filters.date || filters.status ? 'No matching slots' : 'No published slots'}</h3>
            <p className="muted">{filters.date || filters.status ? 'Try another date or status, or clear the filters.' : 'Add a time or publish weekly hours to get started.'}</p>
          </div>
        )}
        {weeks.length > 0 && (
          <>
            <div className="published-week-navigation" role="group" aria-label="Published slot weeks">
              <button className="btn" disabled={weekIndex === 0} onClick={() => setSelectedWeek(weeks[weekIndex - 1])}>← Previous week</button>
              <Field name="publishedWeek" label="Published week" as="select" value={activeWeek} onChange={(event) => setSelectedWeek(event.target.value)}>
                {weeks.map((week) => <option key={week} value={week}>{weekLabel(week)}</option>)}
              </Field>
              <button className="btn" disabled={weekIndex === weeks.length - 1} onClick={() => setSelectedWeek(weeks[weekIndex + 1])}>Next week →</button>
            </div>
            <p className="muted small" role="status">Week {weekIndex + 1} of {weeks.length} with matching slots · {list.length} {list.length === 1 ? 'slot' : 'slots'} total</p>
            <div className="published-days" key={activeWeek}>
              {[...days].map(([date, entries]) => <PublishedSlotDay key={date} date={date} entries={entries} referencedSlotIds={referencedSlotIds} />)}
            </div>
          </>
        )}
      </section>
    </>
  );
};

export default PublishedSlotsPage;
