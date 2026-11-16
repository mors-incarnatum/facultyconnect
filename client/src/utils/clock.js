(function (FC) {
  'use strict';

  const { parseDate, toIso } = FC;

  // Slot dates and times use the browser's local timezone throughout the UI.
  const slotTime = (slot, field = 'start') => {
    if (!slot?.date || !slot[field]) return NaN;
    const date = parseDate(slot.date);
    const [hours, minutes] = slot[field].split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date.getTime();
  };

  const hasStarted = (slot, now) => slotTime(slot) <= now.getTime();
  const hasEnded = (slot, now) => slotTime(slot, 'end') <= now.getTime();
  const isFutureSlot = (slot, now) => slotTime(slot) > now.getTime();
  const localDate = (now) => toIso(now);

  Object.assign(FC, {
    slotTime,
    hasStarted,
    hasEnded,
    isFutureSlot,
    localDate,
  });
})(globalThis.FC = globalThis.FC || {});
