const db = require('../models/db.js');

const User = require('../models/UserModel.js');

const Faculty = require('../models/FacultyModel.js');

const auth = require('../utils/auth.js');

const http = require('../utils/http.js');

const controller = {

    getFavicon: function (req, res) {
        res.status(204).end();
    },

    // GET / - landing page (views/index.hbs)
    getHome: async function (req, res) {
        try {

            var faculty = await db.findMany(Faculty, {}, '-pw');

            return res.render('index', {
                title: 'FacultyConnect',
                faculty: faculty.slice(0, 3)
            });
        } catch (err) {
            console.error('Error loading home page:', err);
            return http.sendError(res, 500, 'Unable to load this page.');
        }
    },

    // GET /login - views/login.hbs
    getLogin: function (req, res) {
        if (req.user) {
            return res.redirect(auth.homeFor(req.user.role));
        }
        return res.render('login', {
            title: 'Sign in',
            email: http.str(req.query.email)
        });
    },

    // POST /login - checks the email and password, then stores the user id in a cookie
    postLogin: async function (req, res) {
        try {

            var email = http.str(req.body.email).toLowerCase();
            var password = typeof req.body.password === 'string' ? req.body.password : '';

            if (!email || !password) {
                return res.status(400).render('login', {
                    title: 'Sign in',
                    email: email,
                    error: 'Enter your email address and password.'
                });
            }

            var result = await db.findOne(User, { email: email });

            if (result == null || result.pw !== password) {
                return res.status(401).render('login', {
                    title: 'Sign in',
                    email: email,
                    error: 'Incorrect email address or password.'
                });
            }

            auth.signIn(res, result);
            return res.redirect(auth.homeFor(result.role));
        } catch (err) {
            console.error('Error during login:', err);
            return http.sendError(res, 500, 'Unable to sign in right now.');
        }
    },

    // GET or POST /logout - clears the cookie and goes back to the landing page
    logout: function (req, res) {
        auth.signOut(res);
        return res.redirect('/');
    },

    // GET /student/help - views/student/help.hbs
    getStudentHelp: function (req, res) {
        return res.render('student/help', { title: 'Help' });
    },

    // GET /faculty/help - views/faculty/help.hbs
    getFacultyHelp: function (req, res) {
        return res.render('faculty/help', { title: 'Help' });
    }

};

module.exports = controller;