const express = require('express');

const controller = require('../controllers/controller.js');

const signupController = require('../controllers/signupController.js');

const profileController = require('../controllers/profileController.js');

const studentController = require('../controllers/studentController.js');

const facultyController = require('../controllers/facultyController.js');

const app = express();

app.get('/favicon.ico', controller.getFavicon);

app.get('/bootstrap', controller.getBootstrap);

app.post('/login', controller.postLogin);

app.post('/register', signupController.postRegister);

app.get('/getCheckEmail', signupController.getCheckEmail);

app.get('/faculty', profileController.getFacultySearch);

app.get('/faculty/consultations', facultyController.getFacultyConsultations);

app.get('/faculty/consultations/:id', facultyController.getConsultationDetails);

app.post('/faculty/consultations/:id/status', facultyController.postUpdateConsultationStatus);

app.get('/faculty/availability', facultyController.getFacultyAvailability);

app.post('/faculty/slots', facultyController.postSaveSlot);

app.post('/faculty/slots/:id', facultyController.postSaveSlot);

app.post('/faculty/slots/:id/remove', facultyController.postRemoveSlot);

app.post('/faculty/schedule', facultyController.postSaveSchedule);

app.get('/faculty/:id', profileController.getFacultyProfile);

app.get('/student/appointments', studentController.getStudentAppointments);

app.get('/getCheckSlot', studentController.getCheckSlot);

app.post('/appointments', studentController.postCreateAppointment);

app.post('/appointments/:id/topic', studentController.postUpdateTopic);

app.post('/appointments/:id/delete-topic', studentController.postDeleteTopic);

app.post('/appointments/:id/cancel', studentController.postCancelAppointment);

module.exports = app;
