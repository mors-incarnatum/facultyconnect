const db = require('../models/db.js');

const User = require('../models/UserModel.js');

const Faculty = require('../models/FacultyModel.js');

const Student = require('../models/StudentModel.js');

const Schedule = require('../models/ScheduleModel.js');

const seed = require('../models/seed.js');

const presentation = require('../utils/presentation.js');

const auth = require('../utils/auth.js');

const http = require('../utils/http.js');

const signupController = {

    // GET /register - views/register.hbs (?role=faculty preselects the faculty form)
    getRegister: function (req, res) {
        if (req.user) {
            return res.redirect(auth.homeFor(req.user.role));
        }
        return res.render('register', {
            title: 'Create an account',
            values: { role: http.str(req.query.role) === 'faculty' ? 'faculty' : 'student' }
        });
    },

    // POST /register - creates a student or faculty account, then redirects to /register/success
    postRegister: async function (req, res) {
        var role = http.str(req.body.role) === 'faculty' ? 'faculty' : 'student';
        var name = http.str(req.body.name);
        var email = http.str(req.body.email).toLowerCase();
        var department = http.str(req.body.department);
        var password = typeof req.body.password === 'string' ? req.body.password : '';
        var confirm = typeof req.body.confirm === 'string' ? req.body.confirm : '';

        var values = { role: role, name: name, email: email, department: department };

        function fail(status, message) {
            return res.status(status).render('register', {
                title: 'Create an account',
                values: values,
                error: message
            });
        }

        try {

            if (!name || !email || !password) {
                return fail(400, 'Enter your name, email address, and password.');
            }
            if (req.body.confirm !== undefined && password !== confirm) {
                return fail(400, 'Passwords do not match.');
            }

            var existing = await db.findOne(User, { email: email });
            if (existing != null) {
                return fail(409, 'An account with that email address already exists.');
            }

            var allUsers = await db.findMany(User, {}, 'id');
            var created;

            if (role === 'faculty') {
                var facultyId = presentation.nextUserId(allUsers, 'f');

                created = await db.insertOne(Faculty, {
                    id: facultyId,
                    role: 'faculty',
                    name: name,
                    email: email,
                    pw: password,
                    rank: 'Faculty',
                    department: presentation.DEPARTMENTS.indexOf(department) !== -1 ? department : presentation.DEPARTMENTS[0],
                    subjects: [],
                    courses: [],
                    specialties: [],
                    office: 'To be announced',
                    color: '#2d5a48',
                    bio: 'Profile details coming soon.'
                });

                await db.insertOne(Schedule, {
                    facultyId: facultyId,
                    weekly: seed.defaultWeeklyHours(),
                    exceptions: [],
                    location: 'To be announced',
                    weeks: 4
                });
            } else {
                created = await db.insertOne(Student, {
                    id: presentation.nextUserId(allUsers, 's'),
                    role: 'student',
                    name: name,
                    email: email,
                    pw: password,
                    program: 'Undeclared',
                    interests: []
                });
            }

            return res.redirect('/register/success?id=' + encodeURIComponent(created.id));
        } catch (err) {
            console.error('Error inserting user document:', err);
            return fail(500, 'Unable to create account right now.');
        }
    },

    // GET /register/success - views/register-success.hbs
    getRegisterSuccess: async function (req, res) {
        try {

            var account = await db.findOne(User, { id: http.str(req.query.id) }, 'id name email role');
            if (account == null) {
                return res.redirect('/register');
            }

            return res.render('register-success', {
                title: 'Account created',
                account: account,
                isFacultyAccount: account.role === 'faculty'
            });
        } catch (err) {
            console.error('Error loading registration result:', err);
            return http.sendError(res, 500, 'Unable to load this page.');
        }
    },

    // GET /getCheckEmail?email= - JSON used by the register form to warn about a taken email
    getCheckEmail: async function (req, res) {
        try {

            var email = http.str(req.query.email).toLowerCase();
            if (!email) {
                return res.send(null);
            }

            var result = await db.findOne(User, { email: email }, 'email');
            return res.send(result);
        } catch (err) {
            console.error('Error checking email availability:', err);
            return res.status(500).send(null);
        }
    }

};

module.exports = signupController;