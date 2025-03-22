const mongoose = require('mongoose');

const properitySchema = new mongoose.Schema({
    time: {
        type: Number,
        default: 10
    },
    distance: {
        type: Number,
        default: 50
    }
});

const Properity = mongoose.model('Properity', properitySchema);

// Create a new document using defaults
const createDefaultProperity = async () => {
    const properity = new Properity(); // time and distance will use default values
    await properity.save();
    console.log('Properity created with default values:', properity);
};

module.exports = Properity;
