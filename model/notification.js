const mongoose = require('mongoose');
const moment = require('moment-timezone');

const notification = new mongoose.Schema({
    title: {
        type: String
    },
    body: {
        type: String
    },
    sender: {
        type: String
    },
    route: {
        type: String,
        default: "/supportScreen"
    }
}, { 
    timestamps: {
        currentTime: () => moment.tz(Date.now(), "Africa/Cairo").toDate()
    }
});

const notifications = mongoose.model('notifications', notification);
module.exports = notifications;
