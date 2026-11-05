import { useSearchParams } from 'react-router-dom';
import { useApp } from './useApp.js';

export function useFacultyResults() {
  const { faculty } = useApp();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const dept = params.get("dept") || "";
  const term = q.trim().toLowerCase();
  const results = faculty.filter((f) => {
    if (dept && f.department !== dept) return false;
    if (!term) return true;
    return [f.name, f.department, ...f.subjects, ...f.courses].join(" ").toLowerCase().includes(term);
  });
  return { q, dept, results, params, setParams };
}
