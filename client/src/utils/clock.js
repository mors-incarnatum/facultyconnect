import { parseDate, toIso } from './format.js';

// Slot dates and times use the browser's local timezone throughout the UI.
export const slotTime = (slot, field = 'start') => {
  if (!slot?.date || !slot[field]) return NaN;
  const date = parseDate(slot.date);
  const [hours, minutes] = slot[field].split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
};

export const hasStarted = (slot, now) => slotTime(slot) <= now.getTime();
export const hasEnded = (slot, now) => slotTime(slot, 'end') <= now.getTime();
export const isFutureSlot = (slot, now) => slotTime(slot) > now.getTime();
export const localDate = (now) => toIso(now);
