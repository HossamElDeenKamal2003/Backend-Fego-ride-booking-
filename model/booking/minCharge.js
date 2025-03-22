const mongoose = require('mongoose');

const minValue = new mongoose.Schema({
    value: {
        type: Number
    }
});

const valueModel = new mongoose.model('minValue', minValue);
module.exports = valueModel;