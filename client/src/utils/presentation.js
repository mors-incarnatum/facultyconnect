import { addDays, addMinutes, fmtShort, minutesBetween, parseDate, toIso } from './format.js';
import { hasEnded, isFutureSlot, slotTime } from './clock.js';

export const UNIVERSITY = 'De La Salle University';
export const SEMESTER = 'Term 1, AY 2026–2027';
export const departments = [
    'Software Technology',
    'Information Technology',
    'Computer Technology',
];

export const ACTIVE = ['pending', 'confirmed'];
export const STATUSES = ['pending', 'confirmed', 'completed', 'declined', 'cancelled'];

export const AUTO_DECLINE_HOURS = 24;
const HOUR_MS = 60 * 60 * 1000;

export const AUTO_DECLINED_MESSAGE = 'This request was automatically declined because it was not accepted 24 hours before the consultation.';
export const AUTO_DECLINED_FACULTY_MESSAGE = 'This request was automatically declined because it was not accepted 24 hours before the consultation.';
export const REQUEST_CLOSED_MESSAGE = 'Requests for this time closed 24 hours before the consultation, so it can no longer be booked. Choose a later time.';

export function requestDeadline(slot) {
    return slotTime(slot) - AUTO_DECLINE_HOURS * HOUR_MS;
}

export function isRequestOpen(slot, now) {
    return Boolean(slot && now.getTime() < requestDeadline(slot));
}

export function shouldAutoDecline(appointment, slot, now) {
    return Boolean(
        appointment
        && appointment.status === 'pending'
        && slot
        && !isRequestOpen(slot, now)
    );
}

export function formatDeadline(slot) {
    const d = new Date(requestDeadline(slot));
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return `${fmtShort(iso)}, ${time}`;
}

export function applyAutoDecline(appointments, slots, now) {
    return appointments.map(function (appointment) {
        if (appointment.status !== 'pending') {
            return appointment;
        }
        const slot = slots.find(function (s) {
            return s.id === appointment.slotId;
        }) || null;
        if (shouldAutoDecline(appointment, slot, now)) {
            return Object.assign({}, appointment, { status: 'declined', autoDeclined: true });
        }
        return appointment;
    });
}

export function isCurrentAppointment(appointment, slot, now) {
    return ACTIVE.includes(appointment.status) && !hasEnded(slot, now);
}

export function canManageAppointment(appointment, slot, now) {
    return (
        Boolean(appointment)
        && ACTIVE.includes(appointment.status)
        && !shouldAutoDecline(appointment, slot, now)
        && isFutureSlot(slot, now)
    );
}

export function defaultWeeklyHours() {
    return [
        { day: 'Monday', enabled: true, start: '13:00', end: '15:00' },
        { day: 'Tuesday', enabled: false, start: '13:00', end: '15:00' },
        { day: 'Wednesday', enabled: true, start: '13:00', end: '15:00' },
        { day: 'Thursday', enabled: true, start: '10:00', end: '12:00' },
        { day: 'Friday', enabled: true, start: '09:00', end: '11:00' },
    ];
}

export function intervalsOf(row) {
    if (row && row.intervals) {
        return row.intervals;
    }
    return [{ start: row.start, end: row.end }];
}

export function facultyTransitions(appointment, slot, now) {
    if (appointment && appointment.status === 'pending') {
        return isRequestOpen(slot, now) ? ['confirmed', 'declined'] : [];
    }
    if (appointment && appointment.status === 'confirmed') {
        return hasEnded(slot, now) ? ['completed'] : ['cancelled'];
    }
    return [];
}

export function nextUserId(users, prefix) {
    let max = 0;
    for (const user of users) {
        const id = user.id || '';
        if (id.startsWith(prefix)) {
            const num = parseInt(id.slice(prefix.length), 10);
            if (!Number.isNaN(num) && num > max) {
                max = num;
            }
        }
    }
    return prefix + (max + 1);
}

export function nextAppointmentId(appointments, requestedId) {
    if (requestedId && !appointments.some(function (a) { return a.id === requestedId; })) {
        return requestedId;
    }
    let max = 0;
    for (const appointment of appointments) {
        const id = appointment.id || '';
        if (id.startsWith('a')) {
            const num = parseInt(id.slice(1), 10);
            if (!Number.isNaN(num) && num > max) {
                max = num;
            }
        }
    }
    return 'a' + (max + 1);
}

function isValidTime(value) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '');
}

function isValidCalendarDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && toIso(parseDate(value)) === value;
}

export function validateSlot(slot, slots, ignoredId) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(slot.date || '')
        || !isValidTime(slot.start)
        || !isValidTime(slot.end)) {
        return 'Enter a valid date and time.';
    }
    if (toIso(parseDate(slot.date)) !== slot.date) {
        return 'Enter a valid calendar date.';
    }
    if (minutesBetween(slot.start, slot.end) !== 30) {
        return 'Each consultation slot must be 30 minutes.';
    }
    if (!slot.location || !slot.location.trim()) {
        return 'Enter a location or meeting details.';
    }

    const overlaps = slots.some(function (s) {
        return (
            s.id !== ignoredId
            && s.facultyId === slot.facultyId
            && s.date === slot.date
            && s.start < slot.end
            && slot.start < s.end
        );
    });
    if (overlaps) {
        return 'This time overlaps an existing slot.';
    }
    return '';
}

export function exceptionIncludes(exceptions, date) {
    return (exceptions || []).some(function (e) {
        if (typeof e === 'string') {
            return e === date;
        }
        return e.start <= date && date <= e.end;
    });
}

export function validateWeeklyHours(weekly) {
    if (!Array.isArray(weekly)) {
        return 'Invalid weekly schedule.';
    }
    for (const row of weekly) {
        if (!row || !row.enabled) {
            continue;
        }
        const intervals = intervalsOf(row);
        if (!intervals.length) {
            return `${row.day}: add at least one interval.`;
        }
        for (let i = 0; i < intervals.length; i++) {
            const start = intervals[i].start;
            const end = intervals[i].end;
            const duration = minutesBetween(start || '', end || '');
            if (!isValidTime(start) || !isValidTime(end) || duration <= 0 || duration % 30 !== 0) {
                return `${row.day}: choose a time range in 30-minute intervals.`;
            }
            const hasOverlap = intervals.some(function (other, j) {
                return j !== i && start < other.end && other.start < end;
            });
            if (hasOverlap) {
                return `${row.day}: intervals must not overlap.`;
            }
        }
    }
    return '';
}

export function isValidException(exception) {
    const start = typeof exception === 'string' ? exception : (exception ? exception.start : '');
    const end = typeof exception === 'string' ? exception : (exception ? exception.end : '');
    return Boolean(
        start
        && end
        && isValidCalendarDate(start)
        && isValidCalendarDate(end)
        && start <= end
    );
}

export function createSlotIdGenerator(slots) {
    let max = 0;
    for (const slot of slots) {
        const id = slot.id || '';
        if (id.startsWith('sl')) {
            const num = parseInt(id.slice(2), 10);
            if (!Number.isNaN(num) && num > max) {
                max = num;
            }
        }
    }
    return function () {
        max += 1;
        return 'sl' + (max < 10 ? '0' + max : String(max));
    };
}

export function publishSchedule(options) {
    const slots = options.slots;
    const appointments = options.appointments;
    const facultyId = options.facultyId;
    const weekly = options.weekly;
    const exceptions = options.exceptions || [];
    const location = options.location || '';
    const today = options.today;
    const now = options.now || parseDate(today);
    const nextId = options.nextId;
    const weeks = options.weeks;

    if (!location.trim()) {
        return { ok: false, error: 'Enter a location or meeting details.' };
    }
    const error = validateWeeklyHours(weekly);
    if (error) {
        return { ok: false, error };
    }
    if (!exceptions.every(isValidException)) {
        return { ok: false, error: 'Choose a valid exception date range.' };
    }

    const numWeeks = Math.max(1, Math.min(16, Number(weeks) || 4));
    const until = addDays(today, numWeeks * 7 - 1);
    const referenced = new Set(appointments.map(function (a) { return a.slotId; }));
    const retained = slots.filter(function (s) {
        return s.facultyId !== facultyId || s.date < today || referenced.has(s.id) || s.source !== 'weekly';
    });
    const result = retained.filter(function (s) {
        return s.facultyId !== facultyId || !exceptionIncludes(exceptions, s.date) || referenced.has(s.id) || s.date < today;
    });

    for (let date = today; date <= until; date = addDays(date, 1)) {
        const day = parseDate(date).getDay();
        const row = weekly[day - 1];
        if (day === 0 || day === 6 || !row || !row.enabled || exceptionIncludes(exceptions, date)) {
            continue;
        }
        for (const interval of intervalsOf(row)) {
            for (let start = interval.start; start < interval.end; start = addMinutes(start, 30)) {
                const candidate = {
                    facultyId,
                    date,
                    start,
                    end: addMinutes(start, 30),
                    mode: 'in-person',
                    location: location.trim(),
                    source: 'weekly',
                };
                if (isFutureSlot(candidate, now) && !validateSlot(candidate, result)) {
                    result.push(Object.assign({ id: nextId() }, candidate));
                }
            }
        }
    }

    return { ok: true, slots: result };
}

export function hasActiveHolder(appointments, slot, now) {
    return appointments.some(function (a) {
        if (a.slotId !== slot.id) {
            return false;
        }
        if (a.status === 'confirmed') {
            return true;
        }
        return a.status === 'pending' && isRequestOpen(slot, now);
    });
}

export function modeLabel(slot) {
    return slot.mode === 'online' ? 'Online' : 'In person';
}

export function todayLabel(now) {
    return `${fmtShort(toIso(now))}, ${now.getFullYear()} · ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · Local time`;
}

export function topicLine(a) {
    return a.topic ? `${a.subject} · ${a.topic}` : 'No topic added';
}
