import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import { modeLabel } from '../utils/presentation.js';
import { fmtShort, fmtRange } from '../utils/format.js';

const PublishedSlotDay = ({ date, entries, referencedSlotIds }) => {
  const reservedCount = entries.filter(({ holder }) => holder).length;

  return (
    <details className="published-day" name="published-slot-day">
      <summary>
        <span className="published-day-title">{fmtShort(date)}</span>
        <span className="published-day-counts">
          {entries.length} {entries.length === 1 ? 'slot' : 'slots'} · {entries.length - reservedCount} available · {reservedCount} reserved
        </span>
      </summary>
      <div className="published-day-slots">
        {entries.map(({ slot, holder }) => (
          <div className="appt-row" key={slot.id}>
            <div>
              <strong>{fmtRange(slot.start, slot.end)}</strong>
              <span className="meta">{modeLabel(slot)} · {slot.location}</span>
            </div>
            <StatusBadge status={holder?.status || 'available'} />
            <div className="slot-actions">
              {holder ? (
                <Link className="btn" to={`/faculty/consultations/${holder.id}`}>View appointment</Link>
              ) : referencedSlotIds.has(slot.id) ? (
                <span className="muted small">History retained</span>
              ) : (
                <>
                  <Link className="btn" to={`/faculty/availability/${slot.id}/edit`}>Edit</Link>
                  <Link className="btn" to={`/faculty/availability/${slot.id}/remove`}>Remove</Link>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
};

export default PublishedSlotDay;
