const mongoose = require('mongoose');

const offersSchema = new mongoose.Schema({
    tripId: {
        type: String,
        required: true,
        ref: ''
    },
    driverId: {
        type: String,
        required: true,
    },
    offer: {
        type: Number,
        required: true,
    },
    time: {
        type: String
    },
    distance: {
        type: String
    }
    }, 
{
    timestamps: true  // Automatically adds createdAt and updatedAt fields
});

const offerModel = mongoose.model('offer', offersSchema);
module.exports = offerModel;
