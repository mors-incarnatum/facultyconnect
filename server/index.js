const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const { engine } = require('express-handlebars');

const apiRoutes = require('./routes/routes.js');
const webRoutes = require('./routes/webRoutes.js');
const db = require('./models/db.js');
const seed = require('./models/seed.js');
const format = require('./utils/format.js');
const presentation = require('./utils/presentation.js');

const app = express();
const port = Number(process.env.PORT) || 5000;
const apiPrefix = process.env.API_PREFIX || '/api';
const corsOrigin = process.env.CORS_ORIGIN || '*';

// Configure Handlebars (.hbs)
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
    helpers: {
        eq: function (a, b) { return String(a) === String(b); },
        neq: function (a, b) { return String(a) !== String(b); },
        gt: function (a, b) { return Number(a) > Number(b); },
        lt: function (a, b) { return Number(a) < Number(b); },
        lte: function (a, b) { return Number(a) <= Number(b); },
        add: function (a, b) { return Number(a) + Number(b); },
        sub: function (a, b) { return Number(a) - Number(b); },
        or: function (a, b) { return Boolean(a || b); },
        and: function (a, b) { return Boolean(a && b); },
        json: function (ctx) { return JSON.stringify(ctx); },
        cap: function (str) { return format.cap(str || ''); },
        initials: function (name) { return format.initials(name || ''); },
        fmtLong: function (iso) { return iso ? format.fmtLong(iso) : ''; },
        fmtShort: function (iso) { return iso ? format.fmtShort(iso) : ''; },
        fmtMonthDay: function (iso) { return iso ? format.fmtMonthDay(iso) : ''; },
        fmtDayHeader: function (iso) { return iso ? format.fmtDayHeader(iso) : ''; },
        fmtTime: function (t) { return t ? format.fmtTime(t) : ''; },
        fmtRange: function (s, e) { return (s && e) ? format.fmtRange(s, e) : ''; },
        modeLabel: function (slot) { return slot ? presentation.modeLabel(slot) : ''; },
        topicLine: function (appt) { return appt ? presentation.topicLine(appt) : ''; },
        join: function (arr, sep) {
            return Array.isArray(arr) ? arr.join(typeof sep === 'string' ? sep : ', ') : '';
        },
        slice: function (arr, start, end) {
            return Array.isArray(arr) ? arr.slice(start, end) : [];
        },
        shortName: function (name) {
            return String(name || '').replace(/^(Dr\.|Prof\.)\s*/, '');
        },
        shortDay: function (day) {
            return String(day || '').slice(0, 3);
        },
        encodeUri: function (val) {
            return encodeURIComponent(val || '');
        }
    }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors(corsOrigin === '*' ? undefined : { origin: corsOrigin }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET || 'facultyconnect-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

// Expose session user, flash feedback, and common labels to all .hbs views
app.use(function (req, res, next) {
    res.locals.user = req.session.user || null;
    res.locals.feedback = req.session.feedback || '';
    delete req.session.feedback;
    res.locals.university = presentation.UNIVERSITY;
    res.locals.semester = presentation.SEMESTER;
    res.locals.todayLabel = presentation.todayLabel(new Date());
    res.locals.currentPath = req.path;
    next();
});

// Keep JSON API intact
app.use(apiPrefix, apiRoutes);

// Server-rendered Handlebars (.hbs) pages
app.use('/', webRoutes);

// 404 handler
app.use(function (req, res) {
    if (req.path.startsWith(apiPrefix)) {
        return res.status(404).send({ ok: false, error: 'Route not found' });
    }
    res.status(404).render('notFound', { title: 'Page not found' });
});

async function main() {
    try {
        await db.connect();
        await seed.seedIfEmpty();
        app.listen(port, function () {
            console.log('FacultyConnect (.hbs) listening at http://localhost:' + port);
        });
    } catch (err) {
        console.log('Connection to MongoDB failed: ');
        console.error(err);
    }
}

main();