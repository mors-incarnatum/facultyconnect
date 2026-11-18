const format = require('./format.js');

const clock = require('./clock.js');

const presentation = require('./presentation.js');

// Pure functions that turn raw database records into the data shapes the views render.
// "world" is the object built by models/queries.js loadWorld().

function publicUser(user) {
    if (!user) {
        return null;
    }
    var copy = Object.assign({}, user);
    delete copy.pw;
    delete copy._id;
    delete copy.__v;
    return copy;
}

var ACTION_LABELS = {
    confirmed: 'Accept request',
    declined: 'Decline request',
    completed: 'Mark completed',
    cancelled: 'Cancel consultation'
};

function sortKey(slot) {
    return slot.date + slot.start;
}

function holderOf(world, slotId) {
    for (var i = 0; i < world.appointments.length; i++) {
        var a = world.appointments[i];
        if (a.slotId === slotId && presentation.ACTIVE.indexOf(a.status) !== -1) {
            return a;
        }
    }
    return null;
}

function isAvailable(world, slot) {
    return Boolean(
        slot != null
        && clock.isFutureSlot(slot, world.now)
        && presentation.isRequestOpen(slot, world.now)
        && holderOf(world, slot.id) == null
    );
}

function availableSlotsFor(world, facultyId) {
    return world.slots
        .filter(function (slot) {
            return slot.facultyId === facultyId && isAvailable(world, slot);
        })
        .sort(function (a, b) {
            return sortKey(a).localeCompare(sortKey(b));
        });
}

// An appointment joined with its slot, faculty member and student, plus derived flags.
function detail(world, appointment) {
    if (appointment == null) {
        return null;
    }

    var slot = world.slotsById[appointment.slotId] || null;
    var facultyMember = slot ? world.facultyById[slot.facultyId] : null;
    var student = world.studentById[appointment.studentId] || null;
    var now = world.now;
    var transitions = slot != null ? presentation.facultyTransitions(appointment, slot, now) : [];

    return Object.assign({}, appointment, {
        slot: slot,
        faculty: publicUser(facultyMember),
        student: publicUser(student),
        topicLine: presentation.topicLine(appointment),
        isCurrent: presentation.isCurrentAppointment(appointment, slot, now),
        canManage: slot != null && presentation.canManageAppointment(appointment, slot, now),
        transitions: transitions,
        actions: transitions.map(function (status) {
            return {
                status: status,
                label: ACTION_LABELS[status],
                needsConfirm: status === 'declined' || status === 'cancelled',
                primary: status === 'confirmed' || status === 'completed'
            };
        }),
        isActive: presentation.ACTIVE.indexOf(appointment.status) !== -1,
        requestOpen: slot != null && presentation.isRequestOpen(slot, now),
        deadline: slot != null ? presentation.formatDeadline(slot) : '',
        modeLabel: presentation.modeLabel(slot),
        slotEnded: slot != null && clock.hasEnded(slot, now)
    });
}

function appointmentById(world, id) {
    for (var i = 0; i < world.appointments.length; i++) {
        if (world.appointments[i].id === id) {
            return world.appointments[i];
        }
    }
    return null;
}

function studentRecords(world, studentId) {
    return world.appointments
        .filter(function (a) {
            return a.studentId === studentId;
        })
        .map(function (a) {
            return detail(world, a);
        })
        .filter(function (a) {
            return a.slot != null;
        });
}

function facultyRecords(world, facultyId) {
    return world.appointments
        .filter(function (a) {
            var slot = world.slotsById[a.slotId];
            return Boolean(slot && slot.facultyId === facultyId);
        })
        .map(function (a) {
            return detail(world, a);
        })
        .sort(function (a, b) {
            return sortKey(a.slot).localeCompare(sortKey(b.slot));
        });
}

// Current appointments first (soonest first), then past ones (most recent first).
function orderStudentRecords(records) {
    var current = records
        .filter(function (a) {
            return a.isCurrent;
        })
        .sort(function (a, b) {
            return sortKey(a.slot).localeCompare(sortKey(b.slot));
        });
    var previous = records
        .filter(function (a) {
            return !a.isCurrent;
        })
        .sort(function (a, b) {
            return sortKey(b.slot).localeCompare(sortKey(a.slot));
        });
    return current.concat(previous);
}

function countByStatus(records) {
    var counts = {};
    presentation.STATUSES.forEach(function (status) {
        counts[status] = 0;
    });
    records.forEach(function (a) {
        counts[a.status] = (counts[a.status] || 0) + 1;
    });
    return counts;
}

function statusCounts(records) {
    var counts = countByStatus(records);
    return presentation.STATUSES.map(function (status) {
        return { status: status, label: format.cap(status), count: counts[status] };
    });
}

function slotWithFaculty(world, slot) {
    return Object.assign({}, slot, {
        faculty: publicUser(world.facultyById[slot.facultyId]),
        modeLabel: presentation.modeLabel(slot)
    });
}

// One week of the calendar: available slots plus the signed-in student's own appointments.
function buildWeek(options) {
    var weekStart = options.weekStart;
    var count = options.includeWeekend ? 7 : 5;
    var days = [];

    for (var i = 0; i < count; i++) {
        var date = format.addDays(weekStart, i);
        days.push({
            date: date,
            isToday: date === options.today,
            available: options.available.filter(function (slot) {
                return slot.date === date;
            }),
            mine: (options.mine || []).filter(function (a) {
                return a.slot && a.slot.date === date;
            })
        });
    }

    return {
        weekStart: weekStart,
        weekLabel: format.fmtWeekRange(weekStart),
        prevWeek: format.addDays(weekStart, -7),
        nextWeek: format.addDays(weekStart, 7),
        thisWeek: format.weekStartOf(options.today),
        includeWeekend: Boolean(options.includeWeekend),
        days: days
    };
}

function greeting(now) {
    var hour = now.getHours();
    return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

module.exports = {
    publicUser: publicUser,
    sortKey: sortKey,
    holderOf: holderOf,
    isAvailable: isAvailable,
    availableSlotsFor: availableSlotsFor,
    detail: detail,
    appointmentById: appointmentById,
    studentRecords: studentRecords,
    facultyRecords: facultyRecords,
    orderStudentRecords: orderStudentRecords,
    countByStatus: countByStatus,
    statusCounts: statusCounts,
    slotWithFaculty: slotWithFaculty,
    buildWeek: buildWeek,
    greeting: greeting
};