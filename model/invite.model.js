const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const invitationSchema = new Schema({
    text: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['driver', 'user'], // Adjust types as needed
        required: true
    },
    receivers: [{
        type: Schema.Types.ObjectId,
        ref: 'User' // Change 'User' to your actual model name if different
    }]
}, { timestamps: true });

module.exports = mongoose.model('invitations', invitationSchema);
