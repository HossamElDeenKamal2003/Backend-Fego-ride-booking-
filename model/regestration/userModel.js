const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    profile_image: {
        type: String,
        // required: true
    },
    role: {
        type: String
    },
    userFCMToken: {
        type: String,
        default: null,
    },
    username: {  // Renaming "username" to "userName"
        type: String,
    },
    email: {
        type: String,
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },
    block: {
        type: Boolean,
        default: true
    },
    alerts: {
        type: Number,
        default: 0
    },
    otp: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    wallet: {
        type: Number,
        default: 0
    },
    rate: {            
        type: Number,
        default: 0
    },
    totalRatings: {     
        type: Number,
        default: 0
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
