'use strict';

let mongoose = require('mongoose');

let NumberSchema = new mongoose.Schema({
    trackingNumber: {
        type: String
    },
    businessNumber: {
        type: String,
        required: true,
        validate: {
            validator: function(value) {
                return /^\+1[0-9]{3}[0-9]{3}[0-9]{4}$/.test(value);
            },

            message: '{VALUE}: invalid phone format'
        }
    },
    trackingDate: Date,
    status: {
        type: String,
        enum: ['activated', 'expired'],
        default: 'activated'
    },
    whisperPrompt: {
        type: String,
        default: ''
    },
    recordCall: {
        type: Boolean,
        default: true
    },
    playDisclaimer: {
        type: Boolean,
        default: true
    }
});

let CDRSchema = new mongoose.Schema({
    callId: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    eventOrderList: {
        type: Array,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: Date,
    duration: Number,
    recordingUri: String,
    cause: String
});

module.exports = {
    Number: mongoose.model('Number', NumberSchema),
    CDR: mongoose.model('CDR', CDRSchema)
};
