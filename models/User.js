const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    matric: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    level: {
        type: String,
        enum: ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level'],
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'rep', 'admin'],
        default: 'student'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
