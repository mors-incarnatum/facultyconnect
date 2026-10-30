import { addDays, addMinutes, minutesBetween, parseDate } from "../utils/format.js";

export const defaultWeeklyHours = () => [
  { day: "Monday", enabled: true, start: "13:00", end: "15:00" },
  { day: "Tuesday", enabled: false, start: "13:00", end: "15:00" },
  { day: "Wednesday", enabled: true, start: "13:00", end: "15:00" },
  { day: "Thursday", enabled: true, start: "10:00", end: "12:00" },
  { day: "Friday", enabled: true, start: "09:00", end: "11:00" },
];
export function validateSlot(slot, slots, ignoredId) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slot.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.start) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.end)) return "Enter a valid date and time.";
  if (minutesBetween(slot.start, slot.end) !== 30) return "Each consultation slot must be 30 minutes.";
  if (!slot.location?.trim()) return "Enter a location or meeting details.";
  if (slots.some((s) => s.id !== ignoredId && s.facultyId === slot.facultyId && s.date === slot.date && s.start < slot.end && slot.start < s.end)) return "This time overlaps an existing slot.";
  return "";
}

// Rebuild the next four weeks, preserving occupied slots and appointment history.
export function publishSchedule({ slots, appointments, facultyId, weekly, exceptions, location, today, nextId }) {
  if (!location.trim()) return { ok: false, error: "Enter a location or meeting details." };
  for (const row of weekly.filter((r) => r.enabled)) {
    const duration = minutesBetween(row.start, row.end);
    if (!Number.isFinite(duration) || duration <= 0 || duration % 30 !== 0) return { ok: false, error: `${row.day}: choose a time range in 30-minute intervals.` };
  }
  const until = addDays(today, 27);
  const referenced = new Set(appointments.map((a) => a.slotId));
  const retained = slots.filter((s) => s.facultyId !== facultyId || s.date < today || s.date > until || referenced.has(s.id) || s.source !== "weekly");
  const blocked = new Set(exceptions);
  const result = retained.filter((s) => s.facultyId !== facultyId || !blocked.has(s.date) || referenced.has(s.id) || s.date < today || s.date > until);
  for (let date = today; date <= until; date = addDays(date, 1)) {
    const day = parseDate(date).getDay();
    const row = weekly[day - 1];
    if (day === 0 || day === 6 || !row?.enabled || blocked.has(date)) continue;
    for (let start = row.start; start < row.end; start = addMinutes(start, 30)) {
      const slot = { facultyId, date, start, end: addMinutes(start, 30), mode: "in-person", location: location.trim(), source: "weekly" };
      if (!validateSlot(slot, result)) result.push({ ...slot, id: nextId("sl") });
    }
  }
  return { ok: true, slots: result };
}
