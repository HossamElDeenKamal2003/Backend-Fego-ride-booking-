const mongoose = require('mongoose');

const distanceSchema = new mongoose.Schema({
    maxDistance: {
        type: Number,
        required: true,
        default: 5000 
    }
});

// Corrected: mongoose.model instead of new mongoose.model
const Distance = mongoose.model('Distance', distanceSchema);

module.exports = Distance;
