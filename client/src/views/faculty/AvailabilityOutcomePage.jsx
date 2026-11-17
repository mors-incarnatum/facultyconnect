import { Link, useLocation } from 'react-router-dom';
import PageHead from '../../components/PageHead.jsx';
import { fmtShort, fmtRange } from '../../utils/format.js';

export default function AvailabilityOutcomePage({ removed = false }) {
  const { state } = useLocation();
  const weeks = Number(state?.weeks) || 4;
  return <><PageHead title={removed ? "Time slot removed" : "Availability saved"} subtitle={removed ? "This selected slot has been removed from published availability." : "Your consultation schedules are ready for students to view."} /><div className="notice">{removed ? "Removal complete" : "Your availability is up to date"}</div><div className="card faculty-spaced">{state?.slot ? <><h2>{removed ? "Removed consultation slot" : "Published consultation slot"}</h2><p className="faculty-spaced">{fmtShort(state.slot.date)} · {fmtRange(state.slot.start, state.slot.end)}</p><p className="muted">One appointment · {state.slot.location}</p></> : <p>{state?.published ? `Weekly hours and date exceptions have been published for the next ${weeks === 1 ? '1 week' : `${weeks} weeks`}.` : "Review your current published availability below."}</p>}<div className="btn-row"><Link className="btn primary" to="/faculty/availability/slots">Back to availability</Link></div></div></>;
}
