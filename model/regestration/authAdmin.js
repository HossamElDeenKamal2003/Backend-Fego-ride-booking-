const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "admin",
    },
    adminFCMToken: { // Add this field
        type: String,
        default: ""
    },
});

const AuthAdmin = new mongoose.model('AuthAdmin', adminSchema);
module.exports = AuthAdmin;
