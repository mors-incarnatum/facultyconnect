const format = require('./format.js');

const clock = require('./clock.js');

const ACTIVE = ['pending', 'confirmed'];

const AUTO_DECLINE_HOURS = 24;
const HOUR_MS = 60 * 60 * 1000;

function requestDeadline(slot) {
    return clock.slotTime(slot) - AUTO_DECLINE_HOURS * HOUR_MS;
}

function isRequestOpen(slot, now) {
    return Boolean(slot && now.getTime() < requestDeadline(slot));
}

function shouldAutoDecline(appointment, slot, now) {
    return Boolean(
        appointment != null
        && appointment.status === 'pending'
        && slot != null
        && !isRequestOpen(slot, now)
    );
}

function canManageAppointment(appointment, slot, now) {
    return (
        appointment != null
        && ACTIVE.indexOf(appointment.status) !== -1
        && !shouldAutoDecline(appointment, slot, now)
        && clock.isFutureSlot(slot, now)
    );
}

function intervalsOf(row) {
    if (row && row.intervals) {
        return row.intervals;
    }
    return [{ start: row.start, end: row.end }];
}

function facultyTransitions(appointment, slot, now) {
    if (appointment != null && appointment.status === 'pending') {
        return isRequestOpen(slot, now) ? ['confirmed', 'declined'] : [];
    }
    if (appointment != null && appointment.status === 'confirmed') {
        return clock.hasEnded(slot, now) ? ['completed'] : ['cancelled'];
    }
    return [];
}

function nextUserId(users, prefix) {
    var max = 0;
    for (var i = 0; i < users.length; i++) {
        var id = users[i].id || '';
        if (id.indexOf(prefix) === 0) {
            var num = parseInt(id.slice(prefix.length), 10);
            if (!isNaN(num) && num > max) {
                max = num;
            }
        }
    }
    return prefix + (max + 1);
}

function nextAppointmentId(appointments, requestedId) {
    if (requestedId) {
        var foundRequested = false;
        for (var i = 0; i < appointments.length; i++) {
            if (appointments[i].id === requestedId) {
                foundRequested = true;
                break;
            }
        }
        if (!foundRequested) {
            return requestedId;
        }
    }

    var max = 0;
    for (var j = 0; j < appointments.length; j++) {
        var id = appointments[j].id || '';
        if (id.indexOf('a') === 0) {
            var num = parseInt(id.slice(1), 10);
            if (!isNaN(num) && num > max) {
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
        return false;
    }
    return format.toIso(format.parseDate(value)) === value;
}

function validateSlot(slot, slots, ignoredId) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(slot.date || '')
        || !isValidTime(slot.start)
        || !isValidTime(slot.end)) {
        return 'Enter a valid date and time.';
    }
    if (format.toIso(format.parseDate(slot.date)) !== slot.date) {
        return 'Enter a valid calendar date.';
    }
    if (format.minutesBetween(slot.start, slot.end) !== 30) {
        return 'Each consultation slot must be 30 minutes.';
    }
    if (!slot.location || !slot.location.trim()) {
        return 'Enter a location or meeting details.';
    }

    for (var i = 0; i < slots.length; i++) {
        var s = slots[i];
        if (s.id !== ignoredId
            && s.facultyId === slot.facultyId
            && s.date === slot.date
            && s.start < slot.end
            && slot.start < s.end) {
            return 'This time overlaps an existing slot.';
        }
    }

    return '';
}

function exceptionIncludes(exceptions, date) {
    var list = exceptions || [];
    for (var i = 0; i < list.length; i++) {
        var e = list[i];
        if (typeof e === 'string') {
            if (e === date) {
                return true;
            }
        } else if (e != null && e.start <= date && date <= e.end) {
            return true;
        }
    }
    return false;
}

function validateWeeklyHours(weekly) {
    if (!Array.isArray(weekly)) {
        return 'Invalid weekly schedule.';
    }

    for (var rIndex = 0; rIndex < weekly.length; rIndex++) {
        var row = weekly[rIndex];
        if (!row || !row.enabled) {
            continue;
        }

        var intervals = intervalsOf(row);
        if (!intervals.length) {
            return row.day + ': add at least one interval.';
        }

        for (var i = 0; i < intervals.length; i++) {
            var start = intervals[i].start;
            var end = intervals[i].end;
            var duration = format.minutesBetween(start || '', end || '');

            if (!isValidTime(start) || !isValidTime(end) || duration <= 0 || duration % 30 !== 0) {
                return row.day + ': choose a time range in 30-minute intervals.';
            }

            for (var j = 0; j < intervals.length; j++) {
                if (j !== i && start < intervals[j].end && intervals[j].start < end) {
                    return row.day + ': intervals must not overlap.';
                }
            }
        }
    }

    return '';
}

function isValidException(exception) {
    var start = typeof exception === 'string' ? exception : (exception ? exception.start : '');
    var end = typeof exception === 'string' ? exception : (exception ? exception.end : '');
    return Boolean(
        start
        && end
        && isValidCalendarDate(start)
        && isValidCalendarDate(end)
        && start <= end
    );
}

function createSlotIdGenerator(slots) {
    var max = 0;
    for (var i = 0; i < slots.length; i++) {
        var id = slots[i].id || '';
        if (id.indexOf('sl') === 0) {
            var num = parseInt(id.slice(2), 10);
            if (!isNaN(num) && num > max) {
                max = num;
            }
        }
    }

    return function () {
        max += 1;
        return 'sl' + (max < 10 ? '0' + max : String(max));
    };
}

function publishSchedule(options) {
    var slots = options.slots;
    var appointments = options.appointments;
    var facultyId = options.facultyId;
    var weekly = options.weekly;
    var exceptions = options.exceptions || [];
    var location = options.location || '';
    var today = options.today;
    var now = options.now || format.parseDate(today);
    var nextId = options.nextId;
    var weeks = options.weeks;

    if (!location.trim()) {
        return { ok: false, error: 'Enter a location or meeting details.' };
    }

    var error = validateWeeklyHours(weekly);
    if (error) {
        return { ok: false, error: error };
    }

    for (var exIndex = 0; exIndex < exceptions.length; exIndex++) {
        if (!isValidException(exceptions[exIndex])) {
            return { ok: false, error: 'Choose a valid exception date range.' };
        }
    }

    var numWeeks = Math.max(1, Math.min(16, Number(weeks) || 4));
    var until = format.addDays(today, numWeeks * 7 - 1);

    var referenced = {};
    for (var aIndex = 0; aIndex < appointments.length; aIndex++) {
        referenced[appointments[aIndex].slotId] = true;
    }

    var retained = [];
    for (var sIndex = 0; sIndex < slots.length; sIndex++) {
        var slotItem = slots[sIndex];
        if (slotItem.facultyId !== facultyId
            || slotItem.date < today
            || referenced[slotItem.id]
            || slotItem.source !== 'weekly') {
            retained.push(slotItem);
        }
    }

    var result = [];
    for (var rIndex = 0; rIndex < retained.length; rIndex++) {
        var kept = retained[rIndex];
        if (kept.facultyId !== facultyId
            || !exceptionIncludes(exceptions, kept.date)
            || referenced[kept.id]
            || kept.date < today) {
            result.push(kept);
        }
    }

    for (var date = today; date <= until; date = format.addDays(date, 1)) {
        var day = format.parseDate(date).getDay();
        var row = weekly[day - 1];
        if (day === 0 || day === 6 || !row || !row.enabled || exceptionIncludes(exceptions, date)) {
            continue;
        }

        var intervals = intervalsOf(row);
        for (var i = 0; i < intervals.length; i++) {
            var interval = intervals[i];
            for (var start = interval.start; start < interval.end; start = format.addMinutes(start, 30)) {
                var candidate = {
                    facultyId: facultyId,
                    date: date,
                    start: start,
                    end: format.addMinutes(start, 30),
                    mode: 'in-person',
                    location: location.trim(),
                    source: 'weekly'
                };

                if (clock.isFutureSlot(candidate, now) && !validateSlot(candidate, result)) {
                    result.push(Object.assign({ id: nextId() }, candidate));
                }
            }
        }
    }

    return { ok: true, slots: result };
}

function hasActiveHolder(appointments, slot, now) {
    for (var i = 0; i < appointments.length; i++) {
        var a = appointments[i];
        if (a.slotId !== slot.id) {
            continue;
        }
        if (a.status === 'confirmed') {
            return true;
        }
        if (a.status === 'pending' && isRequestOpen(slot, now)) {
            return true;
        }
    }
    return false;
}

const presentation = {
    requestDeadline: requestDeadline,
    isRequestOpen: isRequestOpen,
    shouldAutoDecline: shouldAutoDecline,
    canManageAppointment: canManageAppointment,
    intervalsOf: intervalsOf,
    facultyTransitions: facultyTransitions,
    nextUserId: nextUserId,
    nextAppointmentId: nextAppointmentId,
    validateSlot: validateSlot,
    exceptionIncludes: exceptionIncludes,
    validateWeeklyHours: validateWeeklyHours,
    isValidException: isValidException,
    createSlotIdGenerator: createSlotIdGenerator,
    publishSchedule: publishSchedule,
    hasActiveHolder: hasActiveHolder
};

module.exports = presentation;
