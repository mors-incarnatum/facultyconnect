import { cap } from '../utils/format.js';

export default function StatusBadge({ status }) {
  return <span className={`badge ${status}`}>{cap(status)}</span>;
}
