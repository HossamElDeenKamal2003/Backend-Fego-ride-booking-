const mongoose = require('mongoose');

const messageUserSchema = new mongoose.Schema({
    text: { type: String },
    sender: { type: String },
}, { timestamps: true });

const discountSchema = new mongoose.Schema({
    numberOftrip: { type: Number },
    days: { type: Number },
    amount: { type: Number },
    bool: { type: Boolean },
    messageUser: messageUserSchema,
}, { timestamps: true });

module.exports = mongoose.model('Discount', discountSchema);
