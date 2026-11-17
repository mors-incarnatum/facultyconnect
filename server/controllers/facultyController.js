const db = require('../models/db.js');

const Slot = require('../models/SlotModel.js');

const Appointment = require('../models/AppointmentModel.js');

const Schedule = require('../models/ScheduleModel.js');

const format = require('../utils/format.js');

const clock = require('../utils/clock.js');

const presentation = require('../utils/presentation.js');

const facultyController = {

    getFacultyConsultations: async function (req, res) {
        try {

            var facultyId = req.query.facultyId;
            var status = req.query.status;

            var slots = await db.findMany(Slot, facultyId ? { facultyId: facultyId } : {});
            var slotIds = slots.map(function (s) {
                return s.id;
            });

            var query = { slotId: { $in: slotIds } };
            if (status) {
                query.status = status;
            }

            var appointments = await db.findMany(Appointment, query);
            return res.send(appointments);
        } catch (err) {
            console.error('Error retrieving faculty consultations:', err);
            return res.status(500).send([]);
        }
    },

    getConsultationDetails: async function (req, res) {
        try {

            var query = { id: req.params.id };

            var result = await db.findOne(Appointment, query);
            if (result != null) {
                return res.send({ ok: true, appointment: result });
            } else {
                return res.status(404).send({
                    ok: false,
                    error: 'Consultation not found.'
                });
            }
        } catch (err) {
            console.error('Error loading consultation details:', err);
            return res.status(500).send({
                ok: false,
                error: 'Unable to load consultation details.'
            });
        }
    },

    postUpdateConsultationStatus: async function (req, res) {
        try {

            var id = req.params.id;
            var query = { id: id };
            var status = req.body.status;

            var appointment = await db.findOne(Appointment, query);

            if (appointment == null) {
                return res.send({ ok: false, error: 'Consultation not found.' });
            }

            var slot = await db.findOne(Slot, { id: appointment.slotId });
            var now = new Date();
            var allowed = presentation.facultyTransitions(appointment, slot, now);

            if (allowed.indexOf(status) === -1) {
                if (appointment.autoDeclined || (appointment.status === 'pending' && slot != null && !presentation.isRequestOpen(slot, now))) {
                    return res.send({
                        ok: false,
                        error: 'This request was automatically declined because it was not accepted 24 hours before the consultation.'
                    });
                }
                return res.send({
                    ok: false,
                    error: 'Status change unavailable. Only confirmed consultations that have ended can be completed.'
                });
            }

            await db.updateOne(Appointment, query, {
                $set: { status: status }
            });

            var updated = await db.findOne(Appointment, query);
            return res.send({ ok: true, appointment: updated });
        } catch (err) {
            console.error('Error updating consultation status:', err);
            return res.status(500).send({
                ok: false,
                error: 'Unable to update consultation status.'
            });
        }
    },

    getFacultyAvailability: async function (req, res) {
        try {

            var facultyId = req.query.facultyId;

            var schedule = await db.findOne(Schedule, { facultyId: facultyId });
            var slots = await db.findMany(Slot, { facultyId: facultyId });
            return res.send({
                ok: true,
                schedule: schedule,
                slots: slots
            });
        } catch (err) {
            console.error('Error loading faculty availability:', err);
            return res.status(500).send({
                ok: false,
                schedule: null,
                slots: []
            });
        }
    },

    postSaveSlot: async function (req, res) {
        try {
            var id = req.params.id;
            var facultyId = req.body.facultyId;

            if (!facultyId) {
                return res.send({ ok: false, error: 'Sign in as faculty.' });
            }

            var allSlots = await db.findMany(Slot, {});
            var allAppointments = await db.findMany(Appointment, {});
            var now = new Date();
            var existing = null;

            if (id) {
                for (var i = 0; i < allSlots.length; i++) {
                    if (allSlots[i].id === id) {
                        existing = allSlots[i];
                        break;
                    }
                }

                if (existing == null || existing.facultyId !== facultyId || presentation.hasActiveHolder(allAppointments, existing, now)) {
                    return res.send({ ok: false, error: 'Reserved slots cannot be edited.' });
                }

                var hasHistory = false;
                for (var j = 0; j < allAppointments.length; j++) {
                    if (allAppointments[j].slotId === id) {
                        hasHistory = true;
                        break;
                    }
                }
                if (hasHistory) {
                    return res.send({ ok: false, error: 'This slot has appointment history. Create a new slot instead.' });
                }
            }

            var candidate = {
                facultyId: facultyId,
                date: req.body.date,
                start: req.body.start,
                end: req.body.end,
                mode: req.body.mode || 'in-person',
                location: (req.body.location || '').trim(),
                source: req.body.source || (existing != null && existing.source) || 'manual'
            };

            var error = presentation.validateSlot(candidate, allSlots, id)
                || (!clock.isFutureSlot(candidate, now) ? 'Choose a future date and start time.' : '');
            if (error) {
                return res.send({ ok: false, error: error });
            }

            if (id) {

                await db.updateOne(Slot, { id: id }, { $set: candidate });
                var updatedSlot = await db.findOne(Slot, { id: id });
                return res.send({ ok: true, id: id, slot: updatedSlot });
            }

            var nextSlotId = presentation.createSlotIdGenerator(allSlots);
            var slotId = nextSlotId();

            var createdSlot = await db.insertOne(Slot, Object.assign({ id: slotId }, candidate));
            return res.send({ ok: true, id: slotId, slot: createdSlot });
        } catch (err) {
            console.error('Error saving consultation slot:', err);
            return res.status(500).send({
                ok: false,
                error: 'Unable to save consultation slot.'
            });
        }
    },

    postRemoveSlot: async function (req, res) {
        try {

            var id = req.params.id;
            var query = { id: id };

            var slot = await db.findOne(Slot, query);
            var facultyId = req.body != null ? req.body.facultyId : null;

            if (slot == null || (facultyId && slot.facultyId !== facultyId)) {
                return res.send({ ok: false, error: 'Reserved slots cannot be removed.' });
            }

            var appointments = await db.findMany(Appointment, { slotId: id });
            var now = new Date();
            if (presentation.hasActiveHolder(appointments, slot, now)) {
                return res.send({ ok: false, error: 'Reserved slots cannot be removed.' });
            }
            if (appointments.length > 0) {
                return res.send({ ok: false, error: 'This slot has appointment history and must be retained.' });
            }

            await db.deleteOne(Slot, query);
            return res.send({ ok: true, slot: slot });
        } catch (err) {
            console.error('Error removing consultation slot:', err);
            return res.status(500).send({
                ok: false,
                error: 'Unable to remove consultation slot.'
            });
        }
    },

    postSaveSchedule: async function (req, res) {
        try {

            var facultyId = req.body.facultyId;
            var schedule = req.body.schedule;

            if (!facultyId || !schedule) {
                return res.send({ ok: false, error: 'Sign in as faculty.' });
            }

            var allSlots = await db.findMany(Slot, {});
            var allAppointments = await db.findMany(Appointment, {});
            var now = new Date();
            var nextSlotId = presentation.createSlotIdGenerator(allSlots);

            var result = presentation.publishSchedule({
                slots: allSlots,
                appointments: allAppointments,
                facultyId: facultyId,
                weekly: schedule.weekly,
                exceptions: schedule.exceptions || [],
                location: schedule.location || '',
                today: format.toIso(now),
                now: now,
                nextId: nextSlotId,
                weeks: schedule.weeks || 4
            });

            if (!result.ok) {
                return res.send(result);
            }

            var scheduleDoc = {
                facultyId: facultyId,
                weekly: schedule.weekly,
                exceptions: schedule.exceptions || [],
                location: schedule.location.trim(),
                weeks: Number(schedule.weeks) || 4
            };

            var existingSchedule = await db.findOne(Schedule, { facultyId: facultyId });
            if (existingSchedule != null) {
                await db.updateOne(Schedule, { facultyId: facultyId }, { $set: scheduleDoc });
            } else {
                await db.insertOne(Schedule, scheduleDoc);
            }

            var facultySlots = result.slots
                .filter(function (s) {
                    return s.facultyId === facultyId;
                })
                .map(function (s) {
                    return {
                        id: s.id,
                        facultyId: s.facultyId,
                        date: s.date,
                        start: s.start,
                        end: s.end,
                        mode: s.mode,
                        location: s.location,
                        source: s.source || 'weekly'
                    };
                });

            await db.deleteMany(Slot, { facultyId: facultyId });
            if (facultySlots.length > 0) {
                await db.insertMany(Slot, facultySlots);
            }

            var updatedSlots = await db.findMany(Slot, {});
            return res.send({
                ok: true,
                schedule: {
                    weekly: scheduleDoc.weekly,
                    exceptions: scheduleDoc.exceptions,
                    location: scheduleDoc.location,
                    weeks: scheduleDoc.weeks
                },
                slots: updatedSlots
            });
        } catch (err) {
            console.error('Error publishing weekly schedule:', err);
            return res.status(500).send({
                ok: false,
                error: 'Unable to publish weekly schedule.'
            });
        }
    }

};

module.exports = facultyController;
