const express = require('express');

const auth = require('../utils/auth.js');

const controller = require('../controllers/controller.js');

const signupController = require('../controllers/signupController.js');

const profileController = require('../controllers/profileController.js');

const studentController = require('../controllers/studentController.js');

const facultyController = require('../controllers/facultyController.js');

const router = express.Router();

// Pages are server-rendered .hbs views. Forms use POST for anything that changes data
// and GET for search and filters, so the URL carries the filter state.
// Fixed paths are listed before paths with :id so that e.g. /faculty/availability/new is not read as an id.

// ---------- Public ----------

router.get('/favicon.ico', controller.getFavicon);

router.get('/', controller.getHome);

router.get('/login', controller.getLogin);

router.post('/login', controller.postLogin);

router.get('/logout', controller.logout);

router.post('/logout', controller.logout);

router.get('/register', signupController.getRegister);

router.post('/register', signupController.postRegister);

router.get('/register/success', signupController.getRegisterSuccess);

router.get('/getCheckEmail', signupController.getCheckEmail);

// ---------- Student (signed-in students only) ----------

router.use('/student', auth.requireStudent);

router.get('/student', studentController.getOverview);

router.get('/student/help', controller.getStudentHelp);

// Faculty search and profiles
router.get('/student/faculty', profileController.getFacultyList);

router.get('/student/faculty/calendar', profileController.getFacultyCalendar);

router.get('/student/faculty/:id', profileController.getFacultyProfile);

// Booking a consultation
router.get('/student/request', studentController.getRequest);

router.post('/student/request', studentController.postCreateAppointment);

router.get('/student/request/submitted/:id', studentController.getRequestSubmitted);

router.get('/student/booking-conflict', studentController.getBookingConflict);

// My appointments
router.get('/student/appointments', studentController.getAppointments);

router.get('/student/appointments/:id/edit-topic', studentController.getEditTopic);

router.post('/student/appointments/:id/edit-topic', studentController.postUpdateTopic);

router.get('/student/appointments/:id/topic-updated', studentController.getTopicUpdated);

router.get('/student/appointments/:id/delete-topic', studentController.getDeleteTopic);

router.post('/student/appointments/:id/delete-topic', studentController.postDeleteTopic);

router.get('/student/appointments/:id/topic-deleted', studentController.getTopicDeleted);

router.get('/student/appointments/:id/cancel', studentController.getCancelAppointment);

router.post('/student/appointments/:id/cancel', studentController.postCancelAppointment);

router.get('/student/appointments/:id/cancelled', studentController.getAppointmentCancelled);

// JSON used by the booking form to re-check that a slot is still free
router.get('/getCheckSlot', auth.requireStudent, studentController.getCheckSlot);

// ---------- Faculty (signed-in faculty only) ----------

router.use('/faculty', auth.requireFaculty);

router.get('/faculty', facultyController.getOverview);

router.get('/faculty/help', controller.getFacultyHelp);

// Consultation requests
router.get('/faculty/consultations', facultyController.getConsultations);

router.get('/faculty/consultations/:id', facultyController.getConsultationDetails);

router.post('/faculty/consultations/:id/status', facultyController.postUpdateConsultationStatus);

router.get('/faculty/consultations/:id/updated', facultyController.getConsultationUpdated);

// Availability: weekly hours and individual slots
router.get('/faculty/availability', facultyController.getAvailability);

router.post('/faculty/availability', facultyController.postSaveSchedule);

router.get('/faculty/availability/new', facultyController.getNewSlot);

router.get('/faculty/availability/slots', facultyController.getPublishedSlots);

router.post('/faculty/availability/slots', facultyController.postCreateSlot);

router.get('/faculty/availability/saved', facultyController.getAvailabilitySaved);

router.get('/faculty/availability/removed', facultyController.getAvailabilityRemoved);

router.get('/faculty/availability/:id/edit', facultyController.getEditSlot);

router.post('/faculty/availability/:id/edit', facultyController.postUpdateSlot);

router.get('/faculty/availability/:id/remove', facultyController.getRemoveSlot);

router.post('/faculty/availability/:id/remove', facultyController.postRemoveSlot);

module.exports = router;