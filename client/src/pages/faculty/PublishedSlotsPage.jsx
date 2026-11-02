import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../hooks/useApp.js';
import { TODAY } from '../../data/initialData.js';
import Field from '../../components/Field.jsx';
import PageHead from '../../components/PageHead.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { modeLabel } from '../../utils/presentation.js';
import { fmtShort, fmtRange } from '../../utils/format.js';

const PublishedSlotsPage = () => {
  const { user, slots, holderOf, appointments } = useApp();
  const [filters, setFilters] = useState({ date: '', status: '' });
  const referencedSlotIds = new Set(appointments.map((appointment) => appointment.slotId));
  const list = slots
    .filter((slot) => slot.facultyId === user.id && slot.date >= TODAY)
    .map((slot) => ({ slot, holder: holderOf(slot.id) }))
    .filter(({ slot, holder }) => (
      (!filters.date || slot.date === filters.date)
      && (!filters.status || (holder?.status || 'available') === filters.status)
    ))
    .sort((a, b) => (a.slot.date + a.slot.start).localeCompare(b.slot.date + b.slot.start));

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => setFilters({ date: '', status: '' });

  return (
    <>
      <PageHead title="My consultation availability" subtitle="Create, review, edit, or remove the dates and times students can request." />
      <div className="toolbar"><Link className="btn primary" to="/faculty/availability/new">+ Add availability</Link></div>
      <div className="filters">
        <Field name="date" label="Filter slots by date" type="date" value={filters.date} onChange={handleFilterChange} />
        <Field name="status" label="Filter slot status" as="select" value={filters.status} onChange={handleFilterChange}>
          <option value="">All statuses</option>
          {['available', 'pending', 'confirmed'].map((status) => <option key={status}>{status}</option>)}
        </Field>
        <button className="btn" onClick={handleClearFilters}>Clear filters</button>
      </div>
      <section className="card">
        <h2>Published time slots</h2>
        <p className="muted faculty-spaced">Each slot allows one appointment. Reserved slots cannot receive another request.</p>
        {!list.length && (
          <div className="empty">
            <h3>No published slots</h3>
            <p className="muted">Add a time or publish weekly hours to get started.</p>
          </div>
        )}
        {list.map(({ slot, holder }, index) => (
          <div key={slot.id}>
            {(index === 0 || list[index - 1].slot.date !== slot.date) && <h3 className="slot-date">{fmtShort(slot.date)}</h3>}
            <div className="appt-row">
              <div>
                <strong>{fmtShort(slot.date)} · {fmtRange(slot.start, slot.end)}</strong>
                <span className="meta">{modeLabel(slot)} · {slot.location}</span>
              </div>
              <StatusBadge status={holder?.status || 'available'} />
              <div className="slot-actions">
                {holder ? (
                  <Link to={`/faculty/consultations/${holder.id}`}>View appointment</Link>
                ) : referencedSlotIds.has(slot.id) ? (
                  <span className="muted small">History retained</span>
                ) : (
                  <>
                    <Link to={`/faculty/availability/${slot.id}/edit`}>Edit</Link>
                    <Link to={`/faculty/availability/${slot.id}/remove`}>Remove</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>
    </>
  );
};

export default PublishedSlotsPage;
