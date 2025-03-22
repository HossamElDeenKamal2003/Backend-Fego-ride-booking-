const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const requestSchema = new Schema({
    amount: {
        type: Number,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    driverId: {
        type: Schema.Types.ObjectId,
        ref: 'Driver',
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('reqmodels', requestSchema);
