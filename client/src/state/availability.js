import { addDays, addMinutes, minutesBetween, parseDate, toIso } from "../utils/format.js";
import { hasEnded, isFutureSlot } from '../utils/clock.js';
import { isRequestOpen } from './appointments.js';

export const defaultWeeklyHours = () => [
  { day: "Monday", enabled: true, start: "13:00", end: "15:00" },
  { day: "Tuesday", enabled: false, start: "13:00", end: "15:00" },
  { day: "Wednesday", enabled: true, start: "13:00", end: "15:00" },
  { day: "Thursday", enabled: true, start: "10:00", end: "12:00" },
  { day: "Friday", enabled: true, start: "09:00", end: "11:00" },
];
export function validateSlot(slot, slots, ignoredId) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slot.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.end)) return "Enter a valid date and time.";
  if (toIso(parseDate(slot.date)) !== slot.date) return "Enter a valid calendar date.";
  if (minutesBetween(slot.start, slot.end) !== 30) return "Each consultation slot must be 30 minutes.";
  if (!slot.location?.trim()) return "Enter a location or meeting details.";
  if (slots.some((s) => s.id !== ignoredId && s.facultyId === slot.facultyId && s.date === slot.date && s.start < slot.end && slot.start < s.end)) return "This time overlaps an existing slot.";
  return "";
}

export const intervalsOf = (row) => row.intervals || [{ start: row.start, end: row.end }];
export const exceptionIncludes = (exceptions, date) => exceptions.some((e) => typeof e === "string" ? e === date : e.start <= date && date <= e.end);

export function facultyTransitions(appointment, slot, now) {
  // Pending requests can be accepted or declined only until 24 hours before the slot.
  if (appointment?.status === "pending") return isRequestOpen(slot, now) ? ["confirmed", "declined"] : [];
  if (appointment?.status === "confirmed") return hasEnded(slot, now) ? ["completed"] : ["cancelled"];
  return [];
}

const isValidTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const validateWeeklyHours = (weekly) => {
  for (const row of weekly.filter((r) => r.enabled)) {
    const intervals = intervalsOf(row);
    if (!intervals.length) return `${row.day}: add at least one interval.`;
    for (const [i, { start, end }] of intervals.entries()) {
      const duration = minutesBetween(start, end);
      if (!isValidTime(start) || !isValidTime(end) || duration <= 0 || duration % 30 !== 0) {
        return `${row.day}: choose a time range in 30-minute intervals.`;
      }
      if (intervals.some((other, j) => j !== i && start < other.end && other.start < end)) {
        return `${row.day}: intervals must not overlap.`;
      }
    }
  }
  return '';
};

const isValidException = (exception) => {
  const start = typeof exception === 'string' ? exception : exception.start;
  const end = typeof exception === 'string' ? exception : exception.end;
  const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && toIso(parseDate(value)) === value;
  return !!start && !!end && isDate(start) && isDate(end) && start <= end;
};

// Rebuild the next four weeks, preserving occupied slots and appointment history.
export function publishSchedule({ slots, appointments, facultyId, weekly, exceptions, location, today, now = parseDate(today), nextId, weeks = 4 }) {
  if (!location.trim()) return { ok: false, error: 'Enter a location or meeting details.' };
  const error = validateWeeklyHours(weekly);
  if (error) return { ok: false, error };
  if (!exceptions.every(isValidException)) return { ok: false, error: 'Choose a valid exception date range.' };
  const numWeeks = Math.max(1, Math.min(16, Number(weeks) || 4));
  const until = addDays(today, numWeeks * 7 - 1);
  const referenced = new Set(appointments.map((a) => a.slotId));
  const retained = slots.filter((s) => s.facultyId !== facultyId || s.date < today || referenced.has(s.id) || s.source !== "weekly");
  const blocked = (date) => exceptionIncludes(exceptions, date);
  const result = retained.filter((s) => s.facultyId !== facultyId || !blocked(s.date) || referenced.has(s.id) || s.date < today);
  for (let date = today; date <= until; date = addDays(date, 1)) {
    const day = parseDate(date).getDay();
    const row = weekly[day - 1];
    if (day === 0 || day === 6 || !row?.enabled || blocked(date)) continue;
    for (const interval of intervalsOf(row)) {
      for (let start = interval.start; start < interval.end; start = addMinutes(start, 30)) {
        const slot = {
          facultyId, date, start, end: addMinutes(start, 30),
          mode: 'in-person', location: location.trim(), source: 'weekly',
        };
        if (isFutureSlot(slot, now) && !validateSlot(slot, result)) result.push({ ...slot, id: nextId('sl') });
      }
    }
  }
  return { ok: true, slots: result };
}