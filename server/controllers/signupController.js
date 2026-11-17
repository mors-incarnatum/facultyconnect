const db = require('../models/db.js');

const User = require('../models/UserModel.js');

const Faculty = require('../models/FacultyModel.js');

const Student = require('../models/StudentModel.js');

const Schedule = require('../models/ScheduleModel.js');

const seed = require('../models/seed.js');

const presentation = require('../utils/presentation.js');

const signupController = {

    postRegister: async function (req, res) {
        try {

            var role = req.body.role === 'faculty' ? 'faculty' : 'student';
            var trimmedName = (req.body.name || '').trim();
            var normalizedEmail = (req.body.email || '').trim().toLowerCase();
            var department = req.body.department;
            var password = req.body.password || 'password123';

            var existing = await db.findOne(User, { email: normalizedEmail });
            if (existing != null) {
                return res.send({
                    ok: false,
                    error: 'An account with that email address already exists.'
                });
            }

            var allUsers = await db.findMany(User, {});

            if (role === 'faculty') {
                var facultyId = presentation.nextUserId(allUsers, 'f');
                var facultyDoc = {
                    id: facultyId,
                    role: 'faculty',
                    name: trimmedName,
                    email: normalizedEmail,
                    pw: password,
                    rank: 'Faculty',
                    department: department || 'Software Technology',
                    subjects: [],
                    courses: [],
                    specialties: [],
                    office: 'To be announced',
                    color: '#2d5a48',
                    bio: 'Profile details coming soon.'
                };

                var facultyResponse = await db.insertOne(Faculty, facultyDoc);

                var scheduleResponse = await db.insertOne(Schedule, {
                    facultyId: facultyId,
                    weekly: seed.defaultWeeklyHours(),
                    exceptions: [],
                    location: 'To be announced',
                    weeks: 4
                });

                if (facultyResponse != null && scheduleResponse != null) {
                    return res.send({
                        ok: true,
                        user: facultyResponse,
                        schedule: {
                            weekly: scheduleResponse.weekly,
                            exceptions: scheduleResponse.exceptions,
                            location: scheduleResponse.location,
                            weeks: scheduleResponse.weeks
                        }
                    });
                }
            }

            var studentId = presentation.nextUserId(allUsers, 's');
            var studentDoc = {
                id: studentId,
                role: 'student',
                name: trimmedName,
                email: normalizedEmail,
                pw: password,
                program: 'Undeclared',
                interests: []
            };

            var studentResponse = await db.insertOne(Student, studentDoc);

            if (studentResponse != null) {
                return res.send({
                    ok: true,
                    user: studentResponse
                });
            }

            return res.status(500).send({
                ok: false,
                error: 'Unable to create account right now.'
            });
        } catch (err) {
            console.error('Error inserting user document:', err);
            return res.status(500).send({
                ok: false,
                error: 'Unable to create account right now.'
            });
        }
    },

    getCheckEmail: async function (req, res) {
        try {

            var email = (req.query.email || '').trim().toLowerCase();
            if (!email) {
                return res.send(null);
            }

            var query = { email: email };
            var projection = 'email';

            var result = await db.findOne(User, query, projection);
            return res.send(result);
        } catch (err) {
            console.error('Error checking email availability:', err);
            return res.status(500).send(null);
        }
    }

};

module.exports = signupController;
