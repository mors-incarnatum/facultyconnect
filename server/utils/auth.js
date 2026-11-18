const db = require('../models/db.js');

const User = require('../models/UserModel.js');

const http = require('./http.js');

const presentation = require('./presentation.js');

const format = require('./format.js');

// Phase 2 login state: a plain cookie holding the signed-in user's id.
// There is no express-session and no password hashing yet (not required for this phase).

function homeFor(role) {
    return role === 'faculty' ? '/faculty' : '/student';
}

function signIn(res, user) {
    res.cookie(http.USER_COOKIE, user.id, { httpOnly: true, sameSite: 'lax' });
}

function signOut(res) {
    res.clearCookie(http.USER_COOKIE);
}

// Runs on every request: loads the signed-in user and the locals every view can use.
async function attachUser(req, res, next) {
    try {
        req.cookies = http.parseCookies(req.headers.cookie);
        req.user = null;

        var userId = req.cookies[http.USER_COOKIE];
        if (userId) {
            var found = await db.findOne(User, { id: String(userId) }, '-pw');
            if (found != null) {
                req.user = found;
            } else {
                signOut(res);
            }
        }

        var now = new Date();
        res.locals.user = req.user;
        res.locals.isStudent = Boolean(req.user && req.user.role === 'student');
        res.locals.isFaculty = Boolean(req.user && req.user.role === 'faculty');
        res.locals.homePath = req.user ? homeFor(req.user.role) : '/';
        res.locals.university = presentation.UNIVERSITY;
        res.locals.semester = presentation.SEMESTER;
        res.locals.departments = presentation.DEPARTMENTS;
        res.locals.statuses = presentation.STATUSES;
        res.locals.today = format.toIso(now);
        res.locals.currentPath = req.path;
        res.locals.flash = http.readFlash(req, res);
        next();
    } catch (err) {
        next(err);
    }
}

function requireRole(role) {
    return function (req, res, next) {
        if (!req.user) {
            http.setFlash(res, { error: 'Please sign in to continue.' });
            return res.redirect('/login');
        }
        if (req.user.role !== role) {
            return res.redirect(homeFor(req.user.role));
        }
        return next();
    };
}

module.exports = {
    homeFor: homeFor,
    signIn: signIn,
    signOut: signOut,
    attachUser: attachUser,
    requireStudent: requireRole('student'),
    requireFaculty: requireRole('faculty')
};