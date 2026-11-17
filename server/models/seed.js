const db = require('./db.js');

const Faculty = require('./FacultyModel.js');

const Student = require('./StudentModel.js');

const Slot = require('./SlotModel.js');

const Appointment = require('./AppointmentModel.js');

const Schedule = require('./ScheduleModel.js');

const initialData = require('./initialData.json');

function toIso(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

function addDays(iso, n) {
    var parts = iso.split('-').map(Number);
    var d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + n);
    return toIso(d);
}

function defaultWeeklyHours() {
    return [
        { day: 'Monday', enabled: true, start: '13:00', end: '15:00' },
        { day: 'Tuesday', enabled: false, start: '13:00', end: '15:00' },
        { day: 'Wednesday', enabled: true, start: '13:00', end: '15:00' },
        { day: 'Thursday', enabled: true, start: '10:00', end: '12:00' },
        { day: 'Friday', enabled: true, start: '09:00', end: '11:00' }
    ];
}

const seed = {

    defaultWeeklyHours: defaultWeeklyHours,

    seedIfEmpty: async function () {

        var existingFaculty = await db.findMany(Faculty, {});
        if (existingFaculty.length === 0) {
            var facultyDocs = initialData.initialFaculty.map(function (f) {
                return Object.assign({}, f, {
                    role: 'faculty',
                    email: f.email.trim().toLowerCase(),
                    pw: 'password123'
                });
            });

            await db.insertMany(Faculty, facultyDocs);
        }

        var existingStudents = await db.findMany(Student, {});
        if (existingStudents.length === 0) {
            var studentDocs = initialData.initialStudents.map(function (s) {
                return Object.assign({}, s, {
                    role: 'student',
                    email: s.email.trim().toLowerCase(),
                    pw: 'password123'
                });
            });

            await db.insertMany(Student, studentDocs);
        }

        var existingSlots = await db.findMany(Slot, {});
        if (existingSlots.length === 0) {
            var today = toIso(new Date());
            var slotDocs = initialData.initialSlots.map(function (slot) {
                return {
                    id: slot.id,
                    facultyId: slot.facultyId,
                    date: addDays(today, slot.dayOffset),
                    start: slot.start,
                    end: slot.end,
                    mode: slot.mode,
                    location: slot.location,
                    source: slot.source || 'manual'
                };
            });

            await db.insertMany(Slot, slotDocs);
        }

        var existingAppointments = await db.findMany(Appointment, {});
        if (existingAppointments.length === 0) {
            var appointmentDocs = initialData.initialAppointments.map(function (a) {
                return {
                    id: a.id,
                    studentId: a.studentId,
                    slotId: a.slotId,
                    status: a.status,
                    subject: a.subject,
                    topic: a.topic != null ? a.topic : null,
                    description: a.description != null ? a.description : null,
                    autoDeclined: Boolean(a.autoDeclined)
                };
            });

            await db.insertMany(Appointment, appointmentDocs);
        }

        var existingSchedules = await db.findMany(Schedule, {});
        if (existingSchedules.length === 0) {
            var scheduleDocs = initialData.initialFaculty.map(function (f) {
                return {
                    facultyId: f.id,
                    weekly: defaultWeeklyHours(),
                    exceptions: [],
                    location: f.office || 'CCS Consultation Room',
                    weeks: 4
                };
            });

            await db.insertMany(Schedule, scheduleDocs);
        }
    }

};

module.exports = seed;
