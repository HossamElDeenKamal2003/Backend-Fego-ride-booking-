const mongoose = require('mongoose');

const contactschema = new mongoose.Schema({
    username: {
        type: String
    },
    phoneNumber: {
        type: String
    },
    whatsApp: {
        type: String,
    },
    question: {
        type: String
    },
      file: { type: String }, // Store file path or URL
  createdAt: { type: Date, default: Date.now },
});


const contactModel = new mongoose.model('contact', contactschema);
module.exports = contactModel;
