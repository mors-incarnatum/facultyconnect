var mongoose = require('mongoose');

var SlotSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    facultyId: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    start: {
        type: String,
        required: true
    },
    end: {
        type: String,
        required: true
    },
    mode: {
        type: String,
        required: true,
        enum: ['in-person', 'online'],
        default: 'in-person'
    },
    location: {
        type: String,
        required: true
    },
    source: {
        type: String,
        enum: ['manual', 'weekly'],
        default: 'manual'
    }
});

module.exports = mongoose.model('Slot', SlotSchema);
