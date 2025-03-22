const mongoose = require('mongoose');

const pending = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
    },
    distance:{
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    pickupLocationName:{
        type: String,
        require: true
    },
    time: {
        type: String,
        require: true,
    },
    pickupLocation: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    destinationLocation:{
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        //required: true
    },
    carModel: { 
        type: String 
    },
    vehicleType: {
        type: String 
    },
    status: {
        type: String, default: 'Pending' 
    },
    phoneNumber: {
        type: String
    },

    cost:{
        type: Number,
    }
})
pending.index({ pickupLocation: '2dsphere' });
pending.index({ destinationLocation: '2dsphere' });

const pendingModel = new mongoose.model('pendingTrips', pending);

module.exports = pendingModel;