const db = require('../models/db.js');

const User = require('../models/UserModel.js');

const Faculty = require('../models/FacultyModel.js');

const Student = require('../models/StudentModel.js');

const Slot = require('../models/SlotModel.js');

const Appointment = require('../models/AppointmentModel.js');

const Schedule = require('../models/ScheduleModel.js');

const controller = {

    getFavicon: function (req, res) {
        res.status(204).end();
    },

    getBootstrap: async function (req, res) {
        try {

            var faculty = await db.findMany(Faculty, {});
            var students = await db.findMany(Student, {});
            var slots = await db.findMany(Slot, {});
            var appointments = await db.findMany(Appointment, {});
            var scheduleDocs = await db.findMany(Schedule, {});

            var schedules = {};
            for (var i = 0; i < scheduleDocs.length; i++) {
                var doc = scheduleDocs[i];
                schedules[doc.facultyId] = {
                    weekly: doc.weekly,
                    exceptions: doc.exceptions || [],
                    location: doc.location,
                    weeks: doc.weeks || 4
                };
            }

            res.send({
                ok: true,
                faculty: faculty,
                students: students,
                slots: slots,
                appointments: appointments,
                schedules: schedules
            });
        } catch (err) {
            console.error('Error loading bootstrap data:', err);
            res.status(500).send({
                ok: false,
                error: 'Failed to load application data from the database.'
            });
        }
    },

    postLogin: async function (req, res) {
        try {

            var email = (req.body.email || '').trim().toLowerCase();
            var query = { email: email };

            var result = await db.findOne(User, query);

            if (result != null) {
                return res.send({
                    ok: true,
                    role: result.role,
                    user: result
                });
            } else {
                return res.send({
                    ok: false,
                    error: 'No account found for that email address.'
                });
            }
        } catch (err) {
            console.error('Error during login:', err);
            return res.status(500).send({
                ok: false,
                error: 'Unable to sign in right now.'
            });
        }
    }

};

module.exports = controller;
