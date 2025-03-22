const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    role: {
        type: String,
        default: "",
    },
    email: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    password: {
        type: String,
    },
    adminFCMToken: { // Add this field
        type: String,
        default: ""
    },
    supportFCMToken: {
        type: String,
        default: ""
    }
});

const supportModel = mongoose.model('support', supportSchema);
module.exports = supportModel;
