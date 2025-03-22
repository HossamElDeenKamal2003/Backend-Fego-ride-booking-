const mongoose = require('mongoose');

const acceptedSchema = new mongoose.Schema({
    tripId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId
    }
});

const acceptedModel = new mongoose.model("acceptedmodel", acceptedSchema);

module.exports = acceptedModel;