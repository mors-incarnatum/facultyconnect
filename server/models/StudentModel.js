var mongoose = require('mongoose');

var User = require('./UserModel.js');

var StudentSchema = new mongoose.Schema({
    program: {
        type: String,
        default: 'Undeclared'
    },
    yearLevel: {
        type: String
    },
    interests: {
        type: [String],
        default: []
    }
});

module.exports = User.discriminator('Student', StudentSchema, 'student');
