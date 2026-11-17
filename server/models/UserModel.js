var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    pw: {
        type: String,
        required: true,
        default: 'password123'
    },
    pronouns: {
        type: String
    },
    avatar: {
        type: String
    },
    motto: {
        type: String
    }
}, { discriminatorKey: 'role' });

module.exports = mongoose.model('User', UserSchema);
