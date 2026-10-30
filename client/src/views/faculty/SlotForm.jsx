import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useApp } from "../../state/AppContext.jsx";
import { TODAY } from "../../data/mock.js";
import { Field, PageHead, StatusBadge, modeLabel } from "../../components/ui.jsx";
import { fmtShort, fmtRange } from "../../utils/format.js";
import { MissingRecord } from "./shared.jsx";

export default function SlotForm() {
  const { id } = useParams();
  const { user, getSlot, holderOf, saveFacultySlot } = useApp();
  const slot = id ? getSlot(id) : null;
  const [form, setForm] = useState(() => slot ? { ...slot } : { date: TODAY, start: "14:00", end: "14:30", mode: "in-person", location: user.office });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  if (id && (!slot || slot.facultyId !== user.id)) return <MissingRecord availability />;
  const occupied = id && holderOf(id);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    const result = saveFacultySlot(form, id);
    if (!result.ok) return setError(result.error);
    navigate("/faculty/availability/saved", { state: { slot: { ...form, id: result.id } } });
  };
  return <><PageHead title={id ? "Edit availability" : "Create consultation availability"} subtitle="Set the date and time students can request." /><div className="toolbar"><Link to="/faculty/availability/slots">← Back to my availability</Link></div><div className="two-col"><form className="card" onSubmit={submit}><h2 className="section-title">Consultation schedule</h2>{error && <div className="form-error" role="alert">{error}</div>}{occupied ? <div className="notice warn">This slot is reserved. <Link to={`/faculty/consultations/${occupied.id}`}>View appointment</Link></div> : <><Field label="Date" type="date" min={TODAY} required value={form.date} onChange={set("date")} /><div className="field-row"><Field label="Start time" type="time" required value={form.start} onChange={set("start")} /><Field label="End time" type="time" required value={form.end} onChange={set("end")} /></div><Field label="Consultation mode" as="select" value={form.mode} onChange={set("mode")}><option value="in-person">In person</option><option value="online">Online</option></Field><Field label="Location / meeting details" required value={form.location} onChange={set("location")} /><p className="muted small">One appointment per slot · 30-minute consultations.</p><div className="btn-row"><button className="btn primary" type="submit">{id ? "Save changes" : "Publish availability"}</button><Link className="btn" to="/faculty/availability/slots">Cancel</Link></div></>}</form><aside className="card tint"><h2>Keep availability current</h2><p className="faculty-spaced">Students see published dates and time slots when they browse your profile. Changes are reflected in their availability view.</p><p className="muted small">Review any existing appointment before changing an occupied slot.</p></aside></div></>;
}

export function RemoveSlot() {
  const { id } = useParams();
  const { user, getSlot, holderOf, removeFacultySlot } = useApp();
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const slot = getSlot(id);
  if (!slot || slot.facultyId !== user.id) return <MissingRecord availability />;
  const holder = holderOf(id);
  return <><PageHead title="Remove this time slot?" subtitle="Review the schedule before removing it from your published availability." /><div className="card"><h2>{fmtShort(slot.date)} · {fmtRange(slot.start, slot.end)}</h2><p className="muted faculty-spaced">{modeLabel(slot)} · {slot.location}</p><StatusBadge status={holder?.status || "available"} /><p className="faculty-spaced">{holder ? "This time is reserved. Manage its appointment before changing availability." : "Students will no longer be able to request this time slot."}</p>{error && <div className="form-error" role="alert">{error}</div>}<div className="btn-row"><button className="btn danger" disabled={!!holder} onClick={() => { const result = removeFacultySlot(id); if (!result.ok) return setError(result.error); navigate("/faculty/availability/removed", { state: { slot: result.slot } }); }}>Remove time slot</button><Link className="btn" to="/faculty/availability/slots">Keep time slot</Link></div></div></>;
}

export function AvailabilityOutcome({ removed = false }) {
  const { state } = useLocation();
  return <><PageHead title={removed ? "Time slot removed" : "Availability saved"} subtitle={removed ? "This selected slot has been removed from published availability." : "Your consultation schedules are ready for students to view."} /><div className="notice">{removed ? "Removal complete" : "Your availability is up to date"}</div><div className="card faculty-spaced">{state?.slot ? <><h2>{removed ? "Removed consultation slot" : "Published consultation slot"}</h2><p className="faculty-spaced">{fmtShort(state.slot.date)} · {fmtRange(state.slot.start, state.slot.end)}</p><p className="muted">One appointment · {state.slot.location}</p></> : <p>{state?.published ? "Weekly hours and date exceptions have been published for the next four weeks." : "Review your current published availability below."}</p>}<div className="btn-row"><Link className="btn primary" to="/faculty/availability/slots">Back to availability</Link></div></div></>;
}
