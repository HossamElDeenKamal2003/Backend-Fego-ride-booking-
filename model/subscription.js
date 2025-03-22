const mongoose = require('mongoose');
const subscriptionSchema = new mongoose.Schema({
    driverId: {
        type: mongoose.Types.ObjectId,
        require: true,
        ref: 'Driver'
    },
    days: {
        type: Number,
    },
    lastDecremented: { type: Date, default: Date.now }
});
const subModel = mongoose.model('substraction', subscriptionSchema);

module.exports = subModel;