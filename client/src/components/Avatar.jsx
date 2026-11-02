import { initials } from '../utils/format.js';

export default function Avatar({ person, size }) {
  return (
    <div className={`avatar ${size || ""}`} style={{ background: person.color || "#2d5a48" }} aria-hidden="true">
      {initials(person.name)}
    </div>
  );
}
