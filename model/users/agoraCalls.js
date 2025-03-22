const mongoose = require('mongoose');

const callsSchema = new mongoose.Schema({
    channelName: {
        type: String,
        required: true, // Add validation to ensure it's not empty
    },
    token: {
        type: String,
        required: true, // Add validation to ensure it's not empty
    },
    doctorId: {
        type: mongoose.Types.ObjectId, // Correct usage for ObjectId
        required: true, // Add validation to ensure it's present
        ref: 'organizationModel', // Reference to the `Doctor` model if you have one
    }
});

const agoraCalls = mongoose.model('agoraCalls', callsSchema);

module.exports = agoraCalls;
