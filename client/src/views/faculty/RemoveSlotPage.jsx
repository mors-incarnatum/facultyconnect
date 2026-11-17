import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../hooks/useApp.js';
import PageHead from '../../components/PageHead.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import { modeLabel } from '../../utils/presentation.js';
import { fmtShort, fmtRange } from '../../utils/format.js';
import MissingRecord from '../../components/MissingRecord.jsx';

const RemoveSlotPage = () => {
  const { id } = useParams();
  const { user, getSlot, holderOf, removeFacultySlot, setFeedback } = useApp();
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const slot = getSlot(id);

  const handleRemove = () => {
    const result = removeFacultySlot(id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const feedback = 'Time slot removed for this demo.';
    setFeedback(feedback);
    navigate('/faculty/availability/slots', { state: { feedback } });
  };

  if (!slot || slot.facultyId !== user.id) return <MissingRecord availability />;
  const holder = holderOf(id);

  return (
    <>
      <PageHead title="Remove this time slot?" subtitle="Review the schedule before removing it from your published availability." />
      <div className="card">
        <h2>{fmtShort(slot.date)} · {fmtRange(slot.start, slot.end)}</h2>
        <p className="muted faculty-spaced">{modeLabel(slot)} · {slot.location}</p>
        <StatusBadge status={holder?.status || 'available'} />
        <p className="faculty-spaced">
          {holder ? 'This time is reserved. Manage its appointment before changing availability.' : 'Students will no longer be able to request this time slot.'}
        </p>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="btn-row">
          <button className="btn danger" disabled={!!holder} onClick={handleRemove}>Remove time slot</button>
          <Link className="btn" to="/faculty/availability/slots">Keep time slot</Link>
        </div>
      </div>
    </>
  );
};

export default RemoveSlotPage;
