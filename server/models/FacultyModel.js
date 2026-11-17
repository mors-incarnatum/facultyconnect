var mongoose = require('mongoose');

var User = require('./UserModel.js');

var FacultySchema = new mongoose.Schema({
    department: {
        type: String,
        required: true
    },
    rank: {
        type: String,
        default: 'Faculty'
    },
    office: {
        type: String,
        default: 'To be announced'
    },
    bio: {
        type: String
    },
    subjects: {
        type: [String],
        default: []
    },
    courses: {
        type: [String],
        default: []
    },
    specialties: {
        type: [String],
        default: []
    },
    education: {
        type: String
    },
    consultationStyle: {
        type: String
    },
    consultationTip: {
        type: String
    },
    color: {
        type: String,
        default: '#2d5a48'
    }
});

module.exports = User.discriminator('Faculty', FacultySchema, 'faculty');
