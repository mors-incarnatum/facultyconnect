const db = require('./db.js');

const Faculty = require('./FacultyModel.js');

const Student = require('./StudentModel.js');

const Slot = require('./SlotModel.js');

const Appointment = require('./AppointmentModel.js');

const presentation = require('../utils/presentation.js');

function indexById(list) {
    var map = {};
    for (var i = 0; i < list.length; i++) {
        map[list[i].id] = list[i];
    }
    return map;
}

// Loads every collection once and returns a snapshot that the view helpers work on.
// Pending requests that passed the 24-hour deadline are shown as auto-declined.
async function loadWorld(now) {
    var faculty = await db.findMany(Faculty, {}, '-pw');
    var students = await db.findMany(Student, {}, '-pw');
    var slots = await db.findMany(Slot, {});
    var rawAppointments = await db.findMany(Appointment, {});

    var slotsById = indexById(slots);

    return {
        now: now,
        faculty: faculty,
        students: students,
        slots: slots,
        slotsById: slotsById,
        facultyById: indexById(faculty),
        studentById: indexById(students),
        rawAppointments: rawAppointments,
        appointments: presentation.applyAutoDecline(rawAppointments, slotsById, now)
    };
}

module.exports = {
    loadWorld: loadWorld
};