const db = require('../models/db.js');

const Slot = require('../models/SlotModel.js');

const Appointment = require('../models/AppointmentModel.js');

const clock = require('../utils/clock.js');

const format = require('../utils/format.js');

const presentation = require('../utils/presentation.js');

const viewdata = require('../utils/viewdata.js');

const http = require('../utils/http.js');

const queries = require('../models/queries.js');

// The signed-in student's own appointment (with slot, faculty and flags), or null.
function ownAppointment(world, id, studentId) {
    var raw = viewdata.appointmentById(world, http.str(id));
    if (raw == null || raw.studentId !== studentId) {
        return null;
    }
    return viewdata.detail(world, raw);
}

function notFound(res) {
    return http.sendError(res, 404, 'Appointment not found.');
}

function draftFrom(source) {
    return {
        subject: http.str(source.subject),
        topic: http.str(source.topic),
        description: typeof source.description === 'string' ? source.description.trim() : ''
    };
}

// Context for views/student/request.hbs
function requestContext(world, slotId, draft, extra) {
    var slot = world.slotsById[slotId] || null;
    if (slot == null) {
        return Object.assign({ title: 'Request a consultation', noSlot: true }, extra);
    }

    var facultyMember = viewdata.publicUser(world.facultyById[slot.facultyId]);
    var closed = clock.isFutureSlot(slot, world.now) && !presentation.isRequestOpen(slot, world.now);

    return Object.assign({
        title: 'Request a consultation',
        slot: slot,
        modeLabel: presentation.modeLabel(slot),
        faculty: facultyMember,
        draft: draft,
        closed: closed,
        taken: !viewdata.isAvailable(world, slot),
        closedMessage: presentation.REQUEST_CLOSED_MESSAGE,
        changeTimeUrl: '/student/faculty/calendar?faculty=' + encodeURIComponent(slot.facultyId) + '&slot=' + encodeURIComponent(slot.id),
        backTo: '/student/faculty/' + encodeURIComponent(slot.facultyId)
    }, extra);
}

const studentController = {

    // GET /student - views/student/overview.hbs
    getOverview: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var records = viewdata.studentRecords(world, req.user.id);

            var upcoming = records
                .filter(function (a) {
                    return a.isCurrent;
                })
                .sort(function (a, b) {
                    return viewdata.sortKey(a.slot).localeCompare(viewdata.sortKey(b.slot));
                })
                .slice(0, 3);

            var available = world.slots
                .filter(function (slot) {
                    return viewdata.isAvailable(world, slot);
                })
                .map(function (slot) {
                    return viewdata.slotWithFaculty(world, slot);
                });

            var today = format.toIso(world.now);
            var weekParam = http.str(req.query.week);
            var weekStart = /^\d{4}-\d{2}-\d{2}$/.test(weekParam)
                ? format.weekStartOf(weekParam)
                : format.weekStartOf(today);

            return res.render('student/overview', {
                title: 'Overview',
                greeting: viewdata.greeting(world.now),
                counts: viewdata.countByStatus(records),
                statusCounts: viewdata.statusCounts(records),
                upcoming: upcoming,
                week: viewdata.buildWeek({
                    weekStart: weekStart,
                    includeWeekend: false,
                    today: today,
                    available: available,
                    mine: records
                })
            });
        } catch (err) {
            console.error('Error loading student overview:', err);
            return http.sendError(res, 500, 'Unable to load your overview.');
        }
    },

    // GET /student/request?slot=&subject=&topic=&description=&back= - views/student/request.hbs
    getRequest: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var context = requestContext(world, http.str(req.query.slot), draftFrom(req.query), {});
            context.backTo = http.safeBack(req.query.back, context.backTo);
            return res.render('student/request', context);
        } catch (err) {
            console.error('Error loading request form:', err);
            return http.sendError(res, 500, 'Unable to load the request form.');
        }
    },

    // POST /student/request - form fields: slotId, subject, topic, description
    postCreateAppointment: async function (req, res) {
        try {

            var studentId = req.user.id;
            var slotId = http.str(req.body.slotId);
            var draft = draftFrom(req.body);

            var world = await queries.loadWorld(new Date());
            var slot = world.slotsById[slotId] || null;

            if (slot == null) {
                return res.status(404).render('student/request', requestContext(world, slotId, draft, {}));
            }

            var errors = {};
            if (!draft.subject) {
                errors.subject = 'Enter the subject or course for this consultation.';
            }
            if (!draft.topic) {
                errors.topic = 'Enter a topic so your faculty member can prepare.';
            }
            if (Object.keys(errors).length > 0) {
                return res.status(400).render('student/request', requestContext(world, slotId, draft, { errors: errors }));
            }

            if (clock.isFutureSlot(slot, world.now) && !presentation.isRequestOpen(slot, world.now)) {
                return res.status(409).render('student/request', requestContext(world, slotId, draft, {}));
            }

            if (!viewdata.isAvailable(world, slot)) {
                var back = new URLSearchParams({
                    slot: slotId,
                    subject: draft.subject,
                    topic: draft.topic,
                    description: draft.description.slice(0, 1000)
                });
                return res.redirect('/student/booking-conflict?' + back.toString());
            }

            var appointmentId = presentation.nextAppointmentId(world.rawAppointments);

            var created = await db.insertOne(Appointment, {
                id: appointmentId,
                studentId: studentId,
                slotId: slotId,
                status: 'pending',
                subject: draft.subject,
                topic: draft.topic,
                description: draft.description,
                autoDeclined: false
            });

            return res.redirect('/student/request/submitted/' + encodeURIComponent(created.id));
        } catch (err) {
            console.error('Error creating appointment:', err);
            return http.sendError(res, 500, 'Unable to submit consultation request.');
        }
    },

    // GET /student/request/submitted/:id - views/student/request-submitted.hbs
    getRequestSubmitted: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var appointment = ownAppointment(world, req.params.id, req.user.id);
            if (appointment == null) {
                return notFound(res);
            }

            return res.render('student/request-submitted', {
                title: appointment.status === 'pending' ? 'Your request has been sent' : 'Your consultation request',
                appointment: appointment,
                isPending: appointment.status === 'pending'
            });
        } catch (err) {
            console.error('Error loading submitted request:', err);
            return http.sendError(res, 500, 'Unable to load this page.');
        }
    },

    // GET /student/booking-conflict?slot=&subject=&topic=&description= - views/student/booking-conflict.hbs
    getBookingConflict: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var slot = world.slotsById[http.str(req.query.slot)] || null;
            var facultyMember = slot ? viewdata.publicUser(world.facultyById[slot.facultyId]) : null;

            var others = slot
                ? viewdata.availableSlotsFor(world, slot.facultyId)
                    .filter(function (s) {
                        return s.id !== slot.id;
                    })
                    .slice(0, 3)
                : [];

            return res.render('student/booking-conflict', {
                title: 'That time was just taken',
                slot: slot,
                faculty: facultyMember,
                others: others,
                draft: draftFrom(req.query),
                changeTimeUrl: '/student/faculty/calendar' + (facultyMember ? '?faculty=' + encodeURIComponent(facultyMember.id) : '')
            });
        } catch (err) {
            console.error('Error loading booking conflict:', err);
            return http.sendError(res, 500, 'Unable to load this page.');
        }
    },

    // GET /student/appointments?status=&id= - views/student/appointments.hbs
    getAppointments: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var pool = viewdata.orderStudentRecords(viewdata.studentRecords(world, req.user.id));

            var status = presentation.STATUSES.indexOf(http.str(req.query.status)) !== -1
                ? http.str(req.query.status)
                : '';

            var list = pool.filter(function (a) {
                return !status || a.status === status;
            });

            var selectedId = http.str(req.query.id);
            var selected = list[0] || null;
            for (var i = 0; i < list.length; i++) {
                if (list[i].id === selectedId) {
                    selected = list[i];
                }
            }

            var counts = viewdata.countByStatus(pool);
            var filters = [{ value: '', label: 'All statuses', count: pool.length, active: !status }]
                .concat(presentation.STATUSES.map(function (value) {
                    return { value: value, label: format.cap(value), count: counts[value], active: status === value };
                }));

            return res.render('student/appointments', {
                title: 'My appointments',
                status: status,
                filters: filters,
                list: list.map(function (a) {
                    return Object.assign({}, a, { selected: Boolean(selected && selected.id === a.id) });
                }),
                selected: selected,
                autoDeclinedMessage: presentation.AUTO_DECLINED_MESSAGE
            });
        } catch (err) {
            console.error('Error retrieving student appointments:', err);
            return http.sendError(res, 500, 'Unable to load your appointments.');
        }
    },

    // GET /student/appointments/:id/edit-topic - views/student/edit-topic.hbs
    getEditTopic: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var appointment = ownAppointment(world, req.params.id, req.user.id);
            if (appointment == null) {
                return notFound(res);
            }

            return res.render('student/edit-topic', {
                title: 'Edit consultation topic',
                appointment: appointment,
                editable: appointment.canManage,
                values: {
                    subject: appointment.subject,
                    topic: appointment.topic || '',
                    description: appointment.description || ''
                }
            });
        } catch (err) {
            console.error('Error loading topic form:', err);
            return http.sendError(res, 500, 'Unable to load this page.');
        }
    },

    // POST /student/appointments/:id/edit-topic - form fields: subject, topic, description
    postUpdateTopic: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var appointment = ownAppointment(world, req.params.id, req.user.id);
            if (appointment == null) {
                return notFound(res);
            }

            var values = draftFrom(req.body);

            if (!appointment.canManage) {
                return res.status(409).render('student/edit-topic', {
                    title: 'Edit consultation topic',
                    appointment: appointment,
                    editable: false,
                    values: values,
                    error: 'Topics can only be changed before a pending or confirmed consultation starts.'
                });
            }

            if (!values.subject || !values.topic) {
                return res.status(400).render('student/edit-topic', {
                    title: 'Edit consultation topic',
                    appointment: appointment,
                    editable: true,
                    values: values,
                    error: 'Subject and topic are required.'
                });
            }

            await db.updateOne(Appointment, { id: appointment.id }, {
                $set: {
                    subject: values.subject,
                    topic: values.topic,
                    description: values.description
                }
            });

            return res.redirect('/student/appointments/' + encodeURIComponent(appointment.id) + '/topic-updated');
        } catch (err) {
            console.error('Error updating consultation topic:', err);
            return http.sendError(res, 500, 'Unable to update consultation topic.');
        }
    },

    // GET /student/appointments/:id/topic-updated - views/student/topic-updated.hbs
    getTopicUpdated: function (req, res) {
        return renderOutcome(req, res, 'student/topic-updated', 'Topic updated');
    },

    // GET /student/appointments/:id/delete-topic - views/student/delete-topic.hbs (confirmation page)
    getDeleteTopic: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var appointment = ownAppointment(world, req.params.id, req.user.id);
            if (appointment == null) {
                return notFound(res);
            }

            return res.render('student/delete-topic', {
                title: 'Delete consultation topic',
                appointment: appointment,
                editable: appointment.canManage
            });
        } catch (err) {
            console.error('Error loading delete-topic page:', err);
            return http.sendError(res, 500, 'Unable to load this page.');
        }
    },

    // POST /student/appointments/:id/delete-topic
    postDeleteTopic: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var appointment = ownAppointment(world, req.params.id, req.user.id);
            if (appointment == null) {
                return notFound(res);
            }

            if (!appointment.canManage) {
                return res.status(409).render('student/delete-topic', {
                    title: 'Delete consultation topic',
                    appointment: appointment,
                    editable: false,
                    error: 'Topics can only be changed before a pending or confirmed consultation starts.'
                });
            }

            await db.updateOne(Appointment, { id: appointment.id }, {
                $set: { topic: null, description: null }
            });

            return res.redirect('/student/appointments/' + encodeURIComponent(appointment.id) + '/topic-deleted');
        } catch (err) {
            console.error('Error deleting consultation topic:', err);
            return http.sendError(res, 500, 'Unable to delete consultation topic.');
        }
    },

    // GET /student/appointments/:id/topic-deleted - views/student/topic-deleted.hbs
    getTopicDeleted: function (req, res) {
        return renderOutcome(req, res, 'student/topic-deleted', 'Topic deleted');
    },

    // GET /student/appointments/:id/cancel - views/student/cancel-appointment.hbs (confirmation page)
    getCancelAppointment: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var appointment = ownAppointment(world, req.params.id, req.user.id);
            if (appointment == null) {
                return notFound(res);
            }

            return res.render('student/cancel-appointment', {
                title: 'Cancel appointment',
                appointment: appointment,
                editable: appointment.canManage
            });
        } catch (err) {
            console.error('Error loading cancel page:', err);
            return http.sendError(res, 500, 'Unable to load this page.');
        }
    },

    // POST /student/appointments/:id/cancel
    postCancelAppointment: async function (req, res) {
        try {

            var world = await queries.loadWorld(new Date());
            var appointment = ownAppointment(world, req.params.id, req.user.id);
            if (appointment == null) {
                return notFound(res);
            }

            if (!appointment.canManage) {
                return res.status(409).render('student/cancel-appointment', {
                    title: 'Cancel appointment',
                    appointment: appointment,
                    editable: false,
                    error: 'Appointments can only be cancelled before they start.'
                });
            }

            await db.updateOne(Appointment, { id: appointment.id }, {
                $set: { status: 'cancelled' }
            });

            return res.redirect('/student/appointments/' + encodeURIComponent(appointment.id) + '/cancelled');
        } catch (err) {
            console.error('Error cancelling appointment:', err);
            return http.sendError(res, 500, 'Unable to cancel appointment.');
        }
    },

    // GET /student/appointments/:id/cancelled - views/student/appointment-cancelled.hbs
    getAppointmentCancelled: function (req, res) {
        return renderOutcome(req, res, 'student/appointment-cancelled', 'Appointment cancelled');
    },

    // GET /getCheckSlot?slotId= - JSON used to re-check a slot before booking
    getCheckSlot: async function (req, res) {
        try {

            var slotId = http.str(req.query.slotId);

            var slot = await db.findOne(Slot, { id: slotId });
            var activeList = await db.findMany(Appointment, {
                slotId: slotId,
                status: { $in: ['pending', 'confirmed'] }
            });
            var now = new Date();
            var holder = null;

            for (var i = 0; i < activeList.length; i++) {
                if (!presentation.shouldAutoDecline(activeList[i], slot, now)) {
                    holder = activeList[i];
                    break;
                }
            }

            return res.send({
                available: Boolean(slot != null && clock.isFutureSlot(slot, now) && presentation.isRequestOpen(slot, now) && holder == null),
                slot: slot,
                holder: holder
            });
        } catch (err) {
            console.error('Error checking slot availability:', err);
            return res.status(500).send({
                available: false,
                slot: null,
                holder: null
            });
        }
    }

};

// Shared by the "topic updated", "topic deleted" and "cancelled" result pages.
async function renderOutcome(req, res, view, title) {
    try {

        var world = await queries.loadWorld(new Date());
        var appointment = ownAppointment(world, req.params.id, req.user.id);
        if (appointment == null) {
            return notFound(res);
        }

        return res.render(view, { title: title, appointment: appointment });
    } catch (err) {
        console.error('Error loading appointment result page:', err);
        return http.sendError(res, 500, 'Unable to load this page.');
    }
}

module.exports = studentController;