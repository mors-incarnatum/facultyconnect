import { initials, cap, fmtShort } from "../utils/format.js";
import { TODAY } from "../data/mock.js";

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

export function Field({ label, as = "input", error, children, ...props }) {
  const Tag = as;
  return (
    <label className={`field ${error ? "invalid" : ""}`}>
      <span>{label}</span>
      {as === "select" ? <select {...props}>{children}</select> : <Tag {...props} />}
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
