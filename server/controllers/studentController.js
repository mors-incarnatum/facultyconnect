const db = require('../models/db.js');

const Slot = require('../models/SlotModel.js');

const Appointment = require('../models/AppointmentModel.js');

const clock = require('../utils/clock.js');

const presentation = require('../utils/presentation.js');

const studentController = {

    getStudentAppointments: async function (req, res) {
        try {

            var query = {};
            if (req.query.studentId) {
                query.studentId = req.query.studentId;
            }
            if (req.query.status) {
                query.status = req.query.status;
            }

            var appointments = await db.findMany(Appointment, query);
            return res.send(appointments);
        } catch (err) {
            console.error('Error retrieving student appointments:', err);
            return res.status(500).send([]);
        }
    },

    getCheckSlot: async function (req, res) {
        try {

            var slotId = req.query.slotId;

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
    },

    postCreateAppointment: async function (req, res) {
        try {

            var studentId = req.body.studentId;
            var slotId = req.body.slotId;
            var subject = (req.body.subject || '').trim();
            var topic = (req.body.topic || '').trim();
            var description = (req.body.description || '').trim();

            var slot = await db.findOne(Slot, { id: slotId });
            var now = new Date();

            if (slot != null && clock.isFutureSlot(slot, now) && !presentation.isRequestOpen(slot, now)) {
                return res.send({ ok: false, reason: 'closed' });
            }

            var activeList = await db.findMany(Appointment, {
                slotId: slotId,
                status: { $in: ['pending', 'confirmed'] }
            });
            var holder = null;

            for (var i = 0; i < activeList.length; i++) {
                if (!presentation.shouldAutoDecline(activeList[i], slot, now)) {
                    holder = activeList[i];
                    break;
                }
            }

            if (slot == null || !clock.isFutureSlot(slot, now) || holder != null) {
                return res.send({ ok: false, reason: 'conflict' });
            }

            var allAppointments = await db.findMany(Appointment, {});
            var appointmentId = presentation.nextAppointmentId(allAppointments, req.body.id);

            var appointmentDoc = {
                id: appointmentId,
                studentId: studentId,
                slotId: slotId,
                status: 'pending',
                subject: subject,
                topic: topic,
                description: description,
                autoDeclined: false
            };

            var response = await db.insertOne(Appointment, appointmentDoc);

            if (response != null) {
                return res.send({
                    ok: true,
                    id: response.id,
                    appointment: response
                });
            }

            return res.status(500).send({
                ok: false,
                reason: 'conflict',
                error: 'Unable to submit consultation request.'
            });
        } catch (err) {
            console.error('Error creating appointment:', err);
            return res.status(500).send({
                ok: false,
                reason: 'conflict',
                error: 'Unable to submit consultation request.'
            });
        }
    },

    postUpdateTopic: async function (req, res) {
        try {

            var id = req.params.id;
            var query = { id: id };

            var appointment = await db.findOne(Appointment, query);

            if (appointment == null) {
                return res.send({ ok: false, error: 'Appointment not found.' });
            }

            var slot = await db.findOne(Slot, { id: appointment.slotId });
            if (!presentation.canManageAppointment(appointment, slot, new Date())) {
                return res.send({
                    ok: false,
                    error: 'Topics can only be changed before a pending or confirmed consultation starts.'
                });
            }

            var subject = (req.body.subject || '').trim();
            var topic = (req.body.topic || '').trim();
            var description = req.body.description != null ? String(req.body.description).trim() : '';

            await db.updateOne(Appointment, query, {
                $set: {
                    subject: subject,
                    topic: topic,
                    description: description
                }
            });

            var updated = await db.findOne(Appointment, query);
            return res.send({ ok: true, appointment: updated });
        } catch (err) {
            console.error('Error updating consultation topic:', err);
            return res.status(500).send({
                ok: false,
                error: 'Unable to update consultation topic.'
            });
        }
    },

    postDeleteTopic: async function (req, res) {
        try {

            var id = req.params.id;
            var query = { id: id };

            var appointment = await db.findOne(Appointment, query);

            if (appointment == null) {
                return res.send({ ok: false, error: 'Appointment not found.' });
            }

            var slot = await db.findOne(Slot, { id: appointment.slotId });
            if (!presentation.canManageAppointment(appointment, slot, new Date())) {
                return res.send({
                    ok: false,
                    error: 'Topics can only be changed before a pending or confirmed consultation starts.'
                });
            }

            await db.updateOne(Appointment, query, {
                $set: {
                    topic: null,
                    description: null
                }
            });

            var updated = await db.findOne(Appointment, query);
            return res.send({ ok: true, appointment: updated });
        } catch (err) {
            console.error('Error deleting consultation topic:', err);
            return res.status(500).send({
                ok: false,
                error: 'Unable to delete consultation topic.'
            });
        }
    },

    postCancelAppointment: async function (req, res) {
        try {

            var id = req.params.id;
            var query = { id: id };

            var appointment = await db.findOne(Appointment, query);

            if (appointment == null) {
                return res.send({ ok: false, error: 'Appointment not found.' });
            }

            var slot = await db.findOne(Slot, { id: appointment.slotId });
            if (!presentation.canManageAppointment(appointment, slot, new Date())) {
                return res.send({
                    ok: false,
                    error: 'Appointments can only be cancelled before they start.'
                });
            }

            await db.updateOne(Appointment, query, {
                $set: { status: 'cancelled' }
            });

            var updated = await db.findOne(Appointment, query);
            return res.send({ ok: true, appointment: updated });
        } catch (err) {
            console.error('Error cancelling appointment:', err);
            return res.status(500).send({
                ok: false,
                error: 'Unable to cancel appointment.'
            });
        }
    }

};

module.exports = studentController;
