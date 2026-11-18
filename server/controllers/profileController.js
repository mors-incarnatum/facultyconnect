const presentation = require('../utils/presentation.js');

const format = require('../utils/format.js');

const viewdata = require('../utils/viewdata.js');

const http = require('../utils/http.js');

const queries = require('../models/queries.js');

function matchesSearch(faculty, q) {
    if (!q) {
        return true;
    }
    var haystack = [faculty.name, faculty.department]
        .concat(faculty.subjects || [])
        .concat(faculty.courses || [])
        .join(' ')
        .toLowerCase();
    return haystack.indexOf(q) !== -1;
}

// Shared by the list view and the calendar view of "Find faculty".
async function renderFacultySearch(req, res, view) {
    try {

        var world = await queries.loadWorld(new Date());

        var q = http.str(req.query.q);
        var dept = http.str(req.query.dept);

        var results = world.faculty
            .filter(function (f) {
                return (!dept || f.department === dept) && matchesSearch(f, q.toLowerCase());
            })
            .map(function (f) {
                var open = viewdata.availableSlotsFor(world, f.id);
                return Object.assign({}, f, {
                    nextSlot: open[0] || null,
                    openCount: open.length
                });
            });

        var selectedId = http.str(req.query.faculty);
        var selected = null;
        for (var i = 0; i < results.length; i++) {
            if (results[i].id === selectedId) {
                selected = results[i];
            }
        }
        if (selected == null) {
            selected = results[0] || null;
        }

        var selectedSlots = selected ? viewdata.availableSlotsFor(world, selected.id) : [];
        var slotId = http.str(req.query.slot);
        var selectedSlot = null;
        for (var j = 0; j < selectedSlots.length; j++) {
            if (selectedSlots[j].id === slotId) {
                selectedSlot = selectedSlots[j];
            }
        }
        if (selectedSlot == null) {
            selectedSlot = selectedSlots[0] || null;
        }

        var upNext = [];
        results.forEach(function (f) {
            viewdata.availableSlotsFor(world, f.id).slice(0, 2).forEach(function (s) {
                upNext.push(Object.assign({}, s, { faculty: viewdata.publicUser(f) }));
            });
        });
        upNext.sort(function (a, b) {
            return viewdata.sortKey(a).localeCompare(viewdata.sortKey(b));
        });
        upNext = upNext.slice(0, 3);

        var search = new URLSearchParams();
        if (q) {
            search.set('q', q);
        }
        if (dept) {
            search.set('dept', dept);
        }

        var context = {
            title: 'Find faculty',
            view: view,
            isList: view === 'list',
            isCalendar: view === 'calendar',
            q: q,
            dept: dept,
            total: results.length,
            results: results,
            selected: selected,
            selectedSlots: selectedSlots,
            selectedSlot: selectedSlot,
            upNext: upNext,
            searchQuery: search.toString(),
            returnTo: req.originalUrl
        };

        if (view === 'calendar') {
            var weekParam = http.str(req.query.week);
            var weekStart = /^\d{4}-\d{2}-\d{2}$/.test(weekParam)
                ? format.weekStartOf(weekParam)
                : format.weekStartOf(format.toIso(world.now));

            var available = [];
            results.forEach(function (f) {
                viewdata.availableSlotsFor(world, f.id).forEach(function (s) {
                    available.push(viewdata.slotWithFaculty(world, s));
                });
            });

            context.week = viewdata.buildWeek({
                weekStart: weekStart,
                includeWeekend: http.str(req.query.weekend) === '1',
                today: format.toIso(world.now),
                available: available,
                mine: viewdata.studentRecords(world, req.user.id)
            });
        }

        return res.render('student/faculty-search', context);
    } catch (err) {
        console.error('Error searching faculty records:', err);
        return http.sendError(res, 500, 'Unable to load faculty right now.');
    }
}

const profileController = {

    // GET /student/faculty?q=&dept=&faculty=&slot= - views/student/faculty-search.hbs (list view)
    getFacultyList: function (req, res) {
        return renderFacultySearch(req, res, 'list');
    },

    // GET /student/faculty/calendar?q=&dept=&faculty=&slot=&week=&weekend= - same view, calendar layout
    getFacultyCalendar: function (req, res) {
        return renderFacultySearch(req, res, 'calendar');
    },

    // GET /student/faculty/:id - views/student/faculty-profile.hbs
    getFacultyProfile: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var found = world.facultyById[http.str(req.params.id)];

            if (found == null) {
                return res.status(404).render('student/faculty-profile', {
                    title: 'Faculty member not found',
                    notFound: true
                });
            }

            var backTo = http.safeBack(req.query.back, '/student/faculty');

            return res.render('student/faculty-profile', {
                title: found.name,
                faculty: viewdata.publicUser(found),
                slots: viewdata.availableSlotsFor(world, found.id),
                backTo: backTo,
                backQuery: encodeURIComponent(req.originalUrl)
            });
        } catch (err) {
            console.error('Error retrieving faculty profile:', err);
            return http.sendError(res, 500, 'Unable to load faculty profile.');
        }
    }

};

module.exports = profileController;