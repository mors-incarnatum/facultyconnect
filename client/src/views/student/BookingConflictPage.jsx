import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../hooks/useApp.js';
import PageHead from '../../components/PageHead.jsx';
import { fmtLong, fmtRange } from '../../utils/format.js';

export default function BookingConflictPage() {
  const [params] = useSearchParams();
  const { state } = useLocation();
  const { getSlot, getFaculty, availableSlotsFor, setSelection } = useApp();
  const navigate = useNavigate();
  const slot = getSlot(params.get("slot"));
  const f = slot && getFaculty(slot.facultyId);
  const others = f ? availableSlotsFor(f.id).filter((s) => s.id !== slot.id).slice(0, 3) : [];

  const handleChooseTime = () => {
    if (f) setSelection({ facultyId: f.id, slotId: others[0]?.id || null });
    navigate(`/student/faculty/calendar${f ? `?faculty=${f.id}` : ''}`, { state });
  };
  return (
    <>
      <PageHead title="That time was just taken" subtitle="Another student reserved this slot before your request was submitted." />
      <div className="card">
        <span className="badge pending">Slot reserved</span>
        {slot && <h2 style={{ fontSize: 26, margin: "14px 0 6px" }}>{f.name} · {fmtLong(slot.date)} · {fmtRange(slot.start, slot.end)}</h2>}
        <p className="muted" style={{ marginBottom: 18 }}>Slots are checked again when you submit, so two students can never hold the same time.</p>
        {others.length > 0 && (
          <>
            <strong>Other times with {f.name}</strong>
            <div className="btn-row" style={{ marginTop: 10 }}>
              {others.map((s) => <Link key={s.id} className="btn sm" to={`/student/request?slot=${s.id}`} state={state}>{fmtLong(s.date)} · {fmtRange(s.start, s.end)}</Link>)}
            </div>
          </>
        )}
        <div className="btn-row">
          <button className="btn primary" onClick={handleChooseTime}>Choose another time</button>
          <Link className="btn" to="/student">Back to overview</Link>
        </div>
      </div>
    </>
  );
}
