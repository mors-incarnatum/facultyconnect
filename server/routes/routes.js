const express = require('express');

const controller = require('../controllers/controller.js');

const signupController = require('../controllers/signupController.js');

const profileController = require('../controllers/profileController.js');

const studentController = require('../controllers/studentController.js');

const facultyController = require('../controllers/facultyController.js');

const auth = require('../utils/auth.js');

const app = express.Router();

/* Public pages */

app.get('/favicon.ico', controller.getFavicon);

app.get('/', controller.getHome);

app.get('/login', controller.getLogin);

app.post('/login', controller.postLogin);

app.get('/logout', controller.logout);

app.post('/logout', controller.logout);

app.get('/register', signupController.getRegister);

app.post('/register', signupController.postRegister);

app.get('/register/success', signupController.getRegisterSuccess);

app.get('/getCheckEmail', signupController.getCheckEmail);

/* Student pages (signed-in students only) */

app.get('/student', auth.requireStudent, studentController.getOverview);

app.get('/student/faculty', auth.requireStudent, profileController.getFacultyList);

app.get('/student/faculty/calendar', auth.requireStudent, profileController.getFacultyCalendar);

app.get('/student/faculty/:id', auth.requireStudent, profileController.getFacultyProfile);

app.get('/student/request', auth.requireStudent, studentController.getRequest);

app.post('/student/request', auth.requireStudent, studentController.postCreateAppointment);

app.get('/student/request/submitted/:id', auth.requireStudent, studentController.getRequestSubmitted);

app.get('/student/booking-conflict', auth.requireStudent, studentController.getBookingConflict);

app.get('/student/appointments', auth.requireStudent, studentController.getAppointments);

app.get('/student/appointments/:id/edit-topic', auth.requireStudent, studentController.getEditTopic);

app.post('/student/appointments/:id/edit-topic', auth.requireStudent, studentController.postUpdateTopic);

app.get('/student/appointments/:id/topic-updated', auth.requireStudent, studentController.getTopicUpdated);

app.get('/student/appointments/:id/delete-topic', auth.requireStudent, studentController.getDeleteTopic);

app.post('/student/appointments/:id/delete-topic', auth.requireStudent, studentController.postDeleteTopic);

app.get('/student/appointments/:id/topic-deleted', auth.requireStudent, studentController.getTopicDeleted);

app.get('/student/appointments/:id/cancel', auth.requireStudent, studentController.getCancelAppointment);

app.post('/student/appointments/:id/cancel', auth.requireStudent, studentController.postCancelAppointment);

app.get('/student/appointments/:id/cancelled', auth.requireStudent, studentController.getAppointmentCancelled);

app.get('/student/help', auth.requireStudent, controller.getStudentHelp);

app.get('/getCheckSlot', auth.requireStudent, studentController.getCheckSlot);

/* Faculty pages (signed-in faculty only) */

app.get('/faculty', auth.requireFaculty, facultyController.getOverview);

app.get('/faculty/consultations', auth.requireFaculty, facultyController.getConsultations);

app.get('/faculty/consultations/:id', auth.requireFaculty, facultyController.getConsultationDetails);

app.post('/faculty/consultations/:id/status', auth.requireFaculty, facultyController.postUpdateConsultationStatus);

app.get('/faculty/consultations/:id/updated', auth.requireFaculty, facultyController.getConsultationUpdated);

app.get('/faculty/availability', auth.requireFaculty, facultyController.getAvailability);

app.post('/faculty/availability', auth.requireFaculty, facultyController.postSaveSchedule);

app.get('/faculty/availability/new', auth.requireFaculty, facultyController.getNewSlot);

app.get('/faculty/availability/slots', auth.requireFaculty, facultyController.getPublishedSlots);

app.post('/faculty/availability/slots', auth.requireFaculty, facultyController.postCreateSlot);

app.get('/faculty/availability/saved', auth.requireFaculty, facultyController.getAvailabilitySaved);

app.get('/faculty/availability/removed', auth.requireFaculty, facultyController.getAvailabilityRemoved);

app.get('/faculty/availability/:id/edit', auth.requireFaculty, facultyController.getEditSlot);

app.post('/faculty/availability/:id/edit', auth.requireFaculty, facultyController.postUpdateSlot);

app.get('/faculty/availability/:id/remove', auth.requireFaculty, facultyController.getRemoveSlot);

app.post('/faculty/availability/:id/remove', auth.requireFaculty, facultyController.postRemoveSlot);

app.get('/faculty/help', auth.requireFaculty, controller.getFacultyHelp);

module.exports = app;