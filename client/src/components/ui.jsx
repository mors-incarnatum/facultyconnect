import { useId } from "react";
import { initials, cap, fmtShort } from "../utils/format.js";
import { TODAY } from "../data/initialData.js";

export function Avatar({ person, size }) {
  return (
    <div className={`avatar ${size || ""}`} style={{ background: person.color || "#2d5a48" }} aria-hidden="true">
      {initials(person.name)}
    </div>
  );
}

export function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{cap(status)}</span>;
}

export function AppointmentGuidance({ status }) {
  const guidance = {
    pending: "Awaiting faculty approval. This time is reserved, but the meeting is not confirmed yet.",
    confirmed: "Your consultation is confirmed. Review the topic and meeting details before attending.",
    completed: "This consultation is complete. The details remain available in your appointment history.",
    declined: "This request was declined. You can choose another available time or faculty member.",
    cancelled: "This appointment was cancelled. You can request a new consultation when you are ready.",
  };
  return guidance[status] ? <p className="notice appointment-guidance">{guidance[status]}</p> : null;
}

export function Field({ label, as = "input", error, children, ...props }) {
  const Tag = as;
  const labelId = useId();
  return (
    <label className={`field ${error ? "invalid" : ""}`}>
      <span id={labelId}>{label}</span>
      {as === "select" ? <select aria-labelledby={labelId} {...props}>{children}</select> : <Tag aria-labelledby={labelId} {...props} />}
    </label>
  );
}

export function PageHead({ title, subtitle }) {
  return (
    <div className="page-head">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

export const modeLabel = (slot) => (slot.mode === "online" ? "Online" : "In person");
export const todayLabel = () => `${fmtShort(TODAY)}, 2026 · Campus local time`;
