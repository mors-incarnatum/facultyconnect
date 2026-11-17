var mongoose = require('mongoose');

var AppointmentSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    studentId: {
        type: String,
        required: true
    },
    slotId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'confirmed', 'completed', 'declined', 'cancelled'],
        default: 'pending'
    },
    subject: {
        type: String,
        required: true
    },
    topic: {
        type: String,
        default: null
    },
    description: {
        type: String,
        default: null
    },
    autoDeclined: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Appointment', AppointmentSchema);
