const db = require('../models/db.js');

const Slot = require('../models/SlotModel.js');

const Appointment = require('../models/AppointmentModel.js');

const Schedule = require('../models/ScheduleModel.js');

const seed = require('../models/seed.js');

const queries = require('../models/queries.js');

const format = require('../utils/format.js');

const clock = require('../utils/clock.js');

const presentation = require('../utils/presentation.js');

const viewdata = require('../utils/viewdata.js');

const http = require('../utils/http.js');

const WEEK_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 12, 16];

function isTruthy(value) {
    return value === true || value === 'on' || value === 'true' || value === '1';
}

// Form fields such as weekly[0][start] arrive as arrays or index-keyed objects.
function toList(value) {
    if (Array.isArray(value)) {
        return value;
    }
    if (value != null && typeof value === 'object') {
        return Object.keys(value)
            .sort(function (a, b) {
                return Number(a) - Number(b);
            })
            .map(function (key) {
                return value[key];
            });
    }
    return [];
}

// Builds the weekly hours (Monday-Friday) from the submitted schedule form.
//   weekly[i][enabled]=on   weekly[i][intervals][j][start]=09:00   weekly[i][intervals][j][end]=11:00
function parseWeekly(body) {
    var defaults = seed.defaultWeeklyHours();
    var submitted = toList(body.weekly);

    return defaults.map(function (fallback, index) {
        var row = submitted[index] && typeof submitted[index] === 'object' ? submitted[index] : {};
        var intervals = toList(row.intervals)
            .map(function (interval) {
                return {
                    start: http.str(interval && interval.start),
                    end: http.str(interval && interval.end)
                };
            })
            .filter(function (interval) {
                return interval.start || interval.end;
            });

        if (intervals.length === 0) {
            intervals = [{
                start: http.str(row.start) || fallback.start,
                end: http.str(row.end) || fallback.end
            }];
        }

        var parsed = {
            day: fallback.day,
            enabled: isTruthy(row.enabled),
            start: intervals[0].start,
            end: intervals[0].end
        };
        if (intervals.length > 1) {
            parsed.intervals = intervals;
        }
        return parsed;
    });
}

//   exceptions[i][start]  exceptions[i][end]  exceptions[i][remove]=on   newException[start]  newException[end]
function parseExceptions(body) {
    var list = toList(body.exceptions)
        .filter(function (e) {
            return e && typeof e === 'object' && !isTruthy(e.remove);
        })
        .map(function (e) {
            return { start: http.str(e.start), end: http.str(e.end) };
        });

    var extra = body.newException;
    if (extra && typeof extra === 'object' && (http.str(extra.start) || http.str(extra.end))) {
        var start = http.str(extra.start) || http.str(extra.end);
        list.push({ start: start, end: http.str(extra.end) || start });
    }
    return list;
}

function normalizeSchedule(doc, user) {
    if (doc == null) {
        return {
            weekly: seed.defaultWeeklyHours(),
            exceptions: [],
            location: user.office || '',
            weeks: 4
        };
    }
    return {
        weekly: doc.weekly,
        exceptions: doc.exceptions || [],
        location: doc.location,
        weeks: doc.weeks || 4
    };
}

// Context for views/faculty/availability.hbs
function availabilityContext(world, user, schedule, extra) {
    var today = format.toIso(world.now);
    var weeks = Number(schedule.weeks) || 4;

    return Object.assign({
        title: 'Availability manager',
        schedule: {
            location: schedule.location,
            weeks: weeks,
            exceptions: schedule.exceptions,
            weekly: schedule.weekly.map(function (row, index) {
                return Object.assign({}, row, {
                    index: index,
                    intervals: presentation.intervalsOf(row).map(function (interval, intervalIndex) {
                        return Object.assign({}, interval, { index: intervalIndex });
                    })
                });
            })
        },
        weekOptions: WEEK_OPTIONS.map(function (value) {
            return { value: value, selected: value === weeks };
        }),
        lastDate: format.addDays(today, weeks * 7 - 1),
        slotForm: {
            date: today,
            start: '14:00',
            end: '14:30',
            mode: 'in-person',
            location: schedule.location || user.office || ''
        },
        showAdd: false
    }, extra);
}

function ownConsultation(world, id, facultyId) {
    var raw = viewdata.appointmentById(world, http.str(id));
    var slot = raw ? world.slotsById[raw.slotId] : null;
    if (raw == null || slot == null || slot.facultyId !== facultyId) {
        return null;
    }
    return viewdata.detail(world, raw);
}

function hasHistory(world, slotId) {
    for (var i = 0; i < world.rawAppointments.length; i++) {
        if (world.rawAppointments[i].slotId === slotId) {
            return true;
        }
    }
    return false;
}

function slotFields(req, user) {
    var start = http.str(req.body.start);
    var end = http.str(req.body.end);
    if (!end && /^([01]\d|2[0-3]):[0-5]\d$/.test(start)) {
        end = format.addMinutes(start, 30);
    }
    return {
        facultyId: user.id,
        date: http.str(req.body.date),
        start: start,
        end: end,
        mode: http.str(req.body.mode) === 'online' ? 'online' : 'in-person',
        location: http.str(req.body.location)
    };
}

function weekLabel(start) {
    var endIso = format.addDays(start, 6);
    return format.fmtShort(start) + ' – ' + format.fmtShort(endIso) + ', ' + endIso.slice(0, 4);
}

const facultyController = {

    // GET /faculty - views/faculty/overview.hbs
    getOverview: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var records = viewdata.facultyRecords(world, req.user.id);

            return res.render('faculty/overview', {
                title: 'Overview',
                statusCounts: viewdata.statusCounts(records),
                pending: records.filter(function (a) {
                    return a.status === 'pending';
                }),
                upcoming: records.filter(function (a) {
                    return a.status === 'confirmed' && a.isCurrent;
                }),
                autoDeclinedMessage: presentation.AUTO_DECLINED_MESSAGE
            });
        } catch (err) {
            console.error('Error loading faculty overview:', err);
            return http.sendError(res, 500, 'Unable to load your overview.');
        }
    },

    // GET /faculty/consultations?status= - views/faculty/consultations.hbs
    getConsultations: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var records = viewdata.facultyRecords(world, req.user.id);

            var status = presentation.STATUSES.indexOf(http.str(req.query.status)) !== -1
                ? http.str(req.query.status)
                : '';

            return res.render('faculty/consultations', {
                title: 'Consultations',
                status: status,
                statusOptions: presentation.STATUSES.map(function (value) {
                    return { value: value, label: format.cap(value), selected: value === status };
                }),
                list: records.filter(function (a) {
                    return !status || a.status === status;
                }),
                backQuery: encodeURIComponent(req.originalUrl)
            });
        } catch (err) {
            console.error('Error retrieving faculty consultations:', err);
            return http.sendError(res, 500, 'Unable to load consultations.');
        }
    },

    // GET /faculty/consultations/:id?back= - views/faculty/consultation-details.hbs
    getConsultationDetails: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var appointment = ownConsultation(world, req.params.id, req.user.id);
            if (appointment == null) {
                return http.sendError(res, 404, 'Consultation not found.');
            }

            return res.render('faculty/consultation-details', {
                title: appointment.status === 'pending' ? 'Consultation request' : 'Consultation details',
                appointment: appointment,
                showActions: appointment.isActive || appointment.autoDeclined,
                backTo: http.safeBack(req.query.back, '/faculty/consultations'),
                autoDeclinedMessage: presentation.AUTO_DECLINED_MESSAGE
            });
        } catch (err) {
            console.error('Error loading consultation details:', err);
            return http.sendError(res, 500, 'Unable to load consultation details.');
        }
    },

    // POST /faculty/consultations/:id/status - form field: status (confirmed | declined | completed | cancelled)
    postUpdateConsultationStatus: async function (req, res) {
        var id = http.str(req.params.id);
        var detailsPath = '/faculty/consultations/' + encodeURIComponent(id);

        try {

            var world = await queries.loadWorld(new Date());
            var appointment = ownConsultation(world, id, req.user.id);
            if (appointment == null) {
                return http.sendError(res, 404, 'Consultation not found.');
            }

            var status = http.str(req.body.status);
            var slot = appointment.slot;
            var now = world.now;

            // Transitions are checked against the stored record, not the auto-declined view of it.
            var stored = world.rawAppointments.filter(function (a) {
                return a.id === id;
            })[0];
            var allowed = presentation.facultyTransitions(stored, slot, now);

            if (allowed.indexOf(status) === -1) {
                var message = 'Status change unavailable. Only confirmed consultations that have ended can be completed.';
                if (appointment.autoDeclined || (stored.status === 'pending' && !presentation.isRequestOpen(slot, now))) {
                    message = presentation.AUTO_DECLINED_MESSAGE;
                }
                http.setFlash(res, { error: message });
                return res.redirect(detailsPath);
            }

            await db.updateOne(Appointment, { id: id }, { $set: { status: status } });

            return res.redirect(detailsPath + '/updated');
        } catch (err) {
            console.error('Error updating consultation status:', err);
            return http.sendError(res, 500, 'Unable to update consultation status.');
        }
    },

    // GET /faculty/consultations/:id/updated - views/faculty/consultation-updated.hbs
    getConsultationUpdated: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var appointment = ownConsultation(world, req.params.id, req.user.id);
            if (appointment == null) {
                return http.sendError(res, 404, 'Consultation not found.');
            }

            return res.render('faculty/consultation-updated', {
                title: 'Consultation updated',
                appointment: appointment
            });
        } catch (err) {
            console.error('Error loading consultation result:', err);
            return http.sendError(res, 500, 'Unable to load this page.');
        }
    },

    // GET /faculty/availability?add=1 - views/faculty/availability.hbs
    getAvailability: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var stored = await db.findOne(Schedule, { facultyId: req.user.id });
            var schedule = normalizeSchedule(stored, req.user);

            return res.render('faculty/availability', availabilityContext(world, req.user, schedule, {
                showAdd: Boolean(http.str(req.query.add))
            }));
        } catch (err) {
            console.error('Error loading faculty availability:', err);
            return http.sendError(res, 500, 'Unable to load your availability.');
        }
    },

    // GET /faculty/availability/new - opens the add-slot form on the availability page
    getNewSlot: function (req, res) {
        return res.redirect('/faculty/availability?add=1');
    },

    // POST /faculty/availability - saves the weekly hours / exceptions and republishes the slots
    // form fields: location, weeks, weekly[i][enabled], weekly[i][intervals][j][start|end],
    //              exceptions[i][start|end|remove], newException[start|end]
    postSaveSchedule: async function (req, res) {
        try {

            var facultyId = req.user.id;
            var world = await queries.loadWorld(new Date());
            var now = world.now;
            var today = format.toIso(now);

            var submitted = {
                weekly: parseWeekly(req.body),
                exceptions: parseExceptions(req.body),
                location: http.str(req.body.location),
                weeks: Math.max(1, Math.min(16, Number(req.body.weeks) || 4))
            };

            function fail(message) {
                return res.status(400).render('faculty/availability', availabilityContext(world, req.user, submitted, {
                    error: message
                }));
            }

            var extra = req.body.newException;
            if (extra && typeof extra === 'object' && (http.str(extra.start) || http.str(extra.end))) {
                var added = submitted.exceptions[submitted.exceptions.length - 1];
                var lastDate = format.addDays(today, submitted.weeks * 7 - 1);
                if (!presentation.isValidException(added) || added.start < today || added.end > lastDate) {
                    return fail('Choose an exception range within the next '
                        + (submitted.weeks === 1 ? '1 week' : submitted.weeks + ' weeks') + '.');
                }
            }

            var result = presentation.publishSchedule({
                slots: world.slots,
                appointments: world.rawAppointments,
                facultyId: facultyId,
                weekly: submitted.weekly,
                exceptions: submitted.exceptions,
                location: submitted.location,
                today: today,
                now: now,
                nextId: presentation.createSlotIdGenerator(world.slots),
                weeks: submitted.weeks
            });

            if (!result.ok) {
                return fail(result.error);
            }

            var scheduleDoc = {
                facultyId: facultyId,
                weekly: submitted.weekly,
                exceptions: submitted.exceptions,
                location: submitted.location,
                weeks: submitted.weeks
            };

            var existingSchedule = await db.findOne(Schedule, { facultyId: facultyId });
            if (existingSchedule != null) {
                await db.updateOne(Schedule, { facultyId: facultyId }, { $set: scheduleDoc });
            } else {
                await db.insertOne(Schedule, scheduleDoc);
            }

            // Only touch what changed: delete slots that are no longer published, insert the new ones.
            var keptIds = {};
            var toInsert = [];
            result.slots.forEach(function (s) {
                if (s.facultyId !== facultyId) {
                    return;
                }
                keptIds[s.id] = true;
                if (world.slotsById[s.id] == null) {
                    toInsert.push({
                        id: s.id,
                        facultyId: s.facultyId,
                        date: s.date,
                        start: s.start,
                        end: s.end,
                        mode: s.mode,
                        location: s.location,
                        source: s.source || 'weekly'
                    });
                }
            });

            var toDelete = world.slots
                .filter(function (s) {
                    return s.facultyId === facultyId && !keptIds[s.id];
                })
                .map(function (s) {
                    return s.id;
                });

            if (toDelete.length > 0) {
                await db.deleteMany(Slot, { id: { $in: toDelete } });
            }
            if (toInsert.length > 0) {
                await db.insertMany(Slot, toInsert);
            }

            http.setFlash(res, {
                message: 'Availability published for the next ' + (submitted.weeks === 1 ? '1 week' : submitted.weeks + ' weeks') + '.'
            });
            return res.redirect('/faculty/availability');
        } catch (err) {
            console.error('Error publishing weekly schedule:', err);
            return http.sendError(res, 500, 'Unable to publish weekly schedule.');
        }
    },

    // GET /faculty/availability/slots?date=&status=&week= - views/faculty/published-slots.hbs
    getPublishedSlots: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var now = world.now;

            var dateFilter = http.str(req.query.date);
            var statusFilter = http.str(req.query.status);

            var entries = world.slots
                .filter(function (slot) {
                    return slot.facultyId === req.user.id && !clock.hasEnded(slot, now);
                })
                .map(function (slot) {
                    var holder = viewdata.holderOf(world, slot.id);
                    var history = hasHistory(world, slot.id);
                    return {
                        slot: slot,
                        holder: holder,
                        status: holder ? holder.status : 'available',
                        modeLabel: presentation.modeLabel(slot),
                        canEdit: !holder && !history,
                        canRemove: !holder && !history
                    };
                })
                .filter(function (entry) {
                    return (entry.holder || clock.isFutureSlot(entry.slot, now))
                        && (!dateFilter || entry.slot.date === dateFilter)
                        && (!statusFilter || entry.status === statusFilter);
                })
                .sort(function (a, b) {
                    return viewdata.sortKey(a.slot).localeCompare(viewdata.sortKey(b.slot));
                });

            var weeks = [];
            entries.forEach(function (entry) {
                var start = format.weekStartOf(entry.slot.date);
                if (weeks.indexOf(start) === -1) {
                    weeks.push(start);
                }
            });

            var requestedWeek = http.str(req.query.week);
            var activeWeek = weeks.indexOf(requestedWeek) !== -1 ? requestedWeek : weeks[0];
            var weekIndex = weeks.indexOf(activeWeek);

            var days = [];
            entries
                .filter(function (entry) {
                    return format.weekStartOf(entry.slot.date) === activeWeek;
                })
                .forEach(function (entry) {
                    var day = days.length > 0 ? days[days.length - 1] : null;
                    if (day == null || day.date !== entry.slot.date) {
                        day = { date: entry.slot.date, entries: [] };
                        days.push(day);
                    }
                    day.entries.push(entry);
                });

            return res.render('faculty/published-slots', {
                title: 'My consultation availability',
                filters: { date: dateFilter, status: statusFilter },
                hasFilters: Boolean(dateFilter || statusFilter),
                statusOptions: ['available', 'pending', 'confirmed'].map(function (value) {
                    return { value: value, selected: value === statusFilter };
                }),
                totalSlots: entries.length,
                weekOptions: weeks.map(function (start) {
                    return { value: start, label: weekLabel(start), selected: start === activeWeek };
                }),
                weekNumber: weekIndex + 1,
                weekCount: weeks.length,
                prevWeek: weekIndex > 0 ? weeks[weekIndex - 1] : null,
                nextWeek: weekIndex !== -1 && weekIndex < weeks.length - 1 ? weeks[weekIndex + 1] : null,
                days: days
            });
        } catch (err) {
            console.error('Error loading published slots:', err);
            return http.sendError(res, 500, 'Unable to load your slots.');
        }
    },

    // POST /faculty/availability/slots - add one slot. Fields: date, start, end, mode, location
    postCreateSlot: function (req, res) {
        return saveSlot(req, res, null);
    },

    // GET /faculty/availability/:id/edit - views/faculty/slot-form.hbs
    getEditSlot: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var slot = world.slotsById[http.str(req.params.id)];
            if (slot == null || slot.facultyId !== req.user.id) {
                return http.sendError(res, 404, 'Slot not found.');
            }

            var holder = viewdata.holderOf(world, slot.id);
            var history = hasHistory(world, slot.id);

            return res.render('faculty/slot-form', {
                title: 'Edit availability',
                slot: slot,
                values: slot,
                editable: !holder && !history,
                occupied: Boolean(holder),
                hasHistory: history
            });
        } catch (err) {
            console.error('Error loading slot form:', err);
            return http.sendError(res, 500, 'Unable to load this page.');
        }
    },

    // POST /faculty/availability/:id/edit - same fields as creating a slot
    postUpdateSlot: function (req, res) {
        return saveSlot(req, res, http.str(req.params.id));
    },

    // GET /faculty/availability/:id/remove - views/faculty/remove-slot.hbs (confirmation page)
    getRemoveSlot: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var slot = world.slotsById[http.str(req.params.id)];
            if (slot == null || slot.facultyId !== req.user.id) {
                return http.sendError(res, 404, 'Slot not found.');
            }

            var holder = viewdata.holderOf(world, slot.id);
            var history = hasHistory(world, slot.id);

            return res.render('faculty/remove-slot', {
                title: 'Remove availability',
                slot: slot,
                modeLabel: presentation.modeLabel(slot),
                removable: !holder && !history,
                occupied: Boolean(holder),
                hasHistory: history
            });
        } catch (err) {
            console.error('Error loading remove-slot page:', err);
            return http.sendError(res, 500, 'Unable to load this page.');
        }
    },

    // POST /faculty/availability/:id/remove
    postRemoveSlot: async function (req, res) {
        try {

            var id = http.str(req.params.id);
            var world = await queries.loadWorld(new Date());
            var slot = world.slotsById[id];

            if (slot == null || slot.facultyId !== req.user.id) {
                return http.sendError(res, 404, 'Slot not found.');
            }

            if (viewdata.holderOf(world, id) != null) {
                http.setFlash(res, { error: 'Reserved slots cannot be removed.' });
                return res.redirect('/faculty/availability/' + encodeURIComponent(id) + '/remove');
            }
            if (hasHistory(world, id)) {
                http.setFlash(res, { error: 'This slot has appointment history and must be retained.' });
                return res.redirect('/faculty/availability/' + encodeURIComponent(id) + '/remove');
            }

            await db.deleteOne(Slot, { id: id });

            var removed = new URLSearchParams({ date: slot.date, start: slot.start, end: slot.end });
            return res.redirect('/faculty/availability/removed?' + removed.toString());
        } catch (err) {
            console.error('Error removing consultation slot:', err);
            return http.sendError(res, 500, 'Unable to remove consultation slot.');
        }
    },

    // GET /faculty/availability/saved?slot= - views/faculty/availability-outcome.hbs
    getAvailabilitySaved: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var slot = world.slotsById[http.str(req.query.slot)] || null;
            if (slot != null && slot.facultyId !== req.user.id) {
                slot = null;
            }

            return res.render('faculty/availability-outcome', {
                title: 'Availability published',
                removed: false,
                slot: slot,
                modeLabel: presentation.modeLabel(slot)
            });
        } catch (err) {
            console.error('Error loading availability result:', err);
            return http.sendError(res, 500, 'Unable to load this page.');
        }
    },

    // GET /faculty/availability/removed?date=&start=&end= - views/faculty/availability-outcome.hbs
    getAvailabilityRemoved: function (req, res) {
        var date = http.str(req.query.date);
        var start = http.str(req.query.start);
        var end = http.str(req.query.end);
        var valid = /^\d{4}-\d{2}-\d{2}$/.test(date)
            && /^\d{2}:\d{2}$/.test(start)
            && /^\d{2}:\d{2}$/.test(end);

        return res.render('faculty/availability-outcome', {
            title: 'Availability removed',
            removed: true,
            slot: valid ? { date: date, start: start, end: end } : null
        });
    }

};

// Shared by creating a slot (id = null) and editing one.
async function saveSlot(req, res, id) {
    try {

        var world = await queries.loadWorld(new Date());
        var now = world.now;
        var candidate = slotFields(req, req.user);
        var existing = null;

        function fail(message) {
            if (id) {
                return res.status(400).render('faculty/slot-form', {
                    title: 'Edit availability',
                    slot: existing,
                    values: candidate,
                    editable: true,
                    error: message
                });
            }
            return db.findOne(Schedule, { facultyId: req.user.id }).then(function (stored) {
                return res.status(400).render('faculty/availability', availabilityContext(
                    world,
                    req.user,
                    normalizeSchedule(stored, req.user),
                    { showAdd: true, slotForm: candidate, slotError: message }
                ));
            });
        }

        if (id) {
            existing = world.slotsById[id] || null;
            if (existing == null || existing.facultyId !== req.user.id) {
                return http.sendError(res, 404, 'Slot not found.');
            }
            if (viewdata.holderOf(world, id) != null) {
                return fail('Reserved slots cannot be edited.');
            }
            if (hasHistory(world, id)) {
                return fail('This slot has appointment history. Create a new slot instead.');
            }
            candidate.source = existing.source || 'manual';
        } else {
            candidate.source = 'manual';
        }

        if (!candidate.date || !candidate.start || !candidate.end || !candidate.location) {
            return fail('Enter a date, start time, end time, and location.');
        }

        var error = presentation.validateSlot(candidate, world.slots, id)
            || (!clock.isFutureSlot(candidate, now) ? 'Choose a future date and start time.' : '');
        if (error) {
            return fail(error);
        }

        var slotId = id;
        if (id) {
            await db.updateOne(Slot, { id: id }, { $set: candidate });
        } else {
            slotId = presentation.createSlotIdGenerator(world.slots)();
            await db.insertOne(Slot, Object.assign({ id: slotId }, candidate));
        }

        return res.redirect('/faculty/availability/saved?slot=' + encodeURIComponent(slotId));
    } catch (err) {
        console.error('Error saving consultation slot:', err);
        return http.sendError(res, 500, 'Unable to save consultation slot.');
    }
}

module.exports = facultyController;