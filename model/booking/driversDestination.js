const mongoose = require('mongoose');

const destDriverSchema = new mongoose.Schema({
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver', 
        required: true,
    },
    driverFCMToken:{
        type: String,
        default: null
    },
    username:{
        type: String,
    },
    carNumber:{
        type: String,
    },
    carColor:{
        type: String,
    },
    carModel:{
        type: String,
    },
    vehicleType:{
        type: String,
    },
    location: {
        type: { type: String, enum: ['Point']},
        coordinates: { type: [Number]},
    },
    username:{type: String},
    id: {type: String},
    licenceImage: {type: String},
    driver_licence_image: {type: String}
});

// Create a 2dsphere index on the location field
destDriverSchema.index({ location: '2dsphere' });

const DestDriver = mongoose.model('destDriver', destDriverSchema);

module.exports = DestDriver;
