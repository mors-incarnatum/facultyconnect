import { hasEnded, isFutureSlot } from '../utils/clock.js';

export const ACTIVE = ["pending", "confirmed"];
export const STATUSES = ["pending", "confirmed", "completed", "declined", "cancelled"];

export const isCurrentAppointment = (appointment, slot, now) =>
  ACTIVE.includes(appointment.status) && !hasEnded(slot, now);

export const canManageAppointment = (appointment, slot, now) =>
  ACTIVE.includes(appointment?.status) && isFutureSlot(slot, now);
