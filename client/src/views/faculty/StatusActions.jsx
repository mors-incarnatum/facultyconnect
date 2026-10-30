import { useNavigate } from "react-router-dom";
import { useApp } from "../../state/AppContext.jsx";

export default function StatusActions({ appointment: a, compact = false }) {
  const { updateFacultyStatus } = useApp();
  const navigate = useNavigate();
  const statuses = a.status === "pending" ? ["confirmed", "declined", "completed", "cancelled"] : a.status === "confirmed" ? ["completed", "cancelled"] : [];
  const labels = { confirmed: "Accept request", declined: "Decline request", completed: "Mark completed", cancelled: "Cancel consultation" };
  return <div className={compact ? "btn-row" : "stack"}>{(compact ? statuses.slice(0, 2) : statuses).map((status) => <button key={status} className={`btn ${status === "confirmed" ? "primary" : ""}`} onClick={() => {
    if (updateFacultyStatus(a.id, status).ok) navigate(`/faculty/consultations/${a.id}/updated`, { state: { status } });
  }}>{labels[status]}</button>)}</div>;
}
