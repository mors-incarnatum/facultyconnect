import { fmtShort } from '../utils/format.js';
import { hasEnded, isFutureSlot, slotTime } from '../utils/clock.js';

export const ACTIVE = ["pending", "confirmed"];
export const STATUSES = ["pending", "confirmed", "completed", "declined", "cancelled"];

export const AUTO_DECLINE_HOURS = 24;
const HOUR_MS = 60 * 60 * 1000;

export const AUTO_DECLINED_MESSAGE = "This request was automatically declined because it was not accepted 24 hours before the consultation.";
export const AUTO_DECLINED_FACULTY_MESSAGE = "This request was automatically declined because it was not accepted 24 hours before the consultation.";
export const REQUEST_CLOSED_MESSAGE = "Requests for this time closed 24 hours before the consultation, so it can no longer be booked. Choose a later time.";

export const requestDeadline = (slot) => slotTime(slot) - AUTO_DECLINE_HOURS * HOUR_MS;
/** Students may book, and faculty may accept, only while this is true. */
export const isRequestOpen = (slot, now) => now.getTime() < requestDeadline(slot);
export const shouldAutoDecline = (appointment, slot, now) => (
  appointment?.status === "pending" && !!slot && !isRequestOpen(slot, now)
);

export const formatDeadline = (slot) => {
  const d = new Date(requestDeadline(slot));
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${fmtShort(iso)}, ${time}`;
};

export function applyAutoDecline(appointments, slots, now) {
  const result = [];

  for (const appointment of appointments) {
    if (appointment.status !== "pending") {
      result.push(appointment);
      continue;
    }

    let slot = null;
    for (const s of slots) {
      if (s.id === appointment.slotId) {
        slot = s;
      }
    }

    if (shouldAutoDecline(appointment, slot, now)) {
      result.push({ ...appointment, status: "declined", autoDeclined: true });
    } else {
      result.push(appointment);
    }
  }

  return result;
}

export const isCurrentAppointment = (appointment, slot, now) => ACTIVE.includes(appointment.status) && !hasEnded(slot, now);
export const canManageAppointment = (appointment, slot, now) => ACTIVE.includes(appointment?.status) && isFutureSlot(slot, now);