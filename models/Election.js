const mongoose = require('mongoose');

const electionSchema = new mongoose.Schema({
    post: {
        type: String,
        required: true,
        trim: true
    },
    candidates: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        votes: {
            type: Number,
            default: 0
        }
    }],
    votedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Election', electionSchema);
