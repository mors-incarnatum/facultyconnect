import { parseDate, toIso } from './format.js';

export function slotTime(slot, field = 'start') {
    if (!slot || !slot.date || !slot[field]) {
        return NaN;
    }
    const date = parseDate(slot.date);
    const parts = slot[field].split(':').map(Number);
    date.setHours(parts[0], parts[1], 0, 0);
    return date.getTime();
}

export function hasStarted(slot, now) {
    return slotTime(slot) <= now.getTime();
}

export function hasEnded(slot, now) {
    return slotTime(slot, 'end') <= now.getTime();
}

export function isFutureSlot(slot, now) {
    return slotTime(slot) > now.getTime();
}

export function localDate(now) {
    return toIso(now);
}
