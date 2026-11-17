var mongoose = require('mongoose');

var ScheduleSchema = new mongoose.Schema({
    facultyId: {
        type: String,
        required: true,
        unique: true
    },
    weekly: {
        type: Array,
        required: true
    },
    exceptions: {
        type: Array,
        default: []
    },
    location: {
        type: String,
        required: true
    },
    weeks: {
        type: Number,
        default: 4
    }
});

module.exports = mongoose.model('Schedule', ScheduleSchema);
