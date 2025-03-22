const mongoose = require('mongoose');


const distance = new mongoose.Schema({
    distance: {
        type: Number
    }
});

const distanceModel = mongoose.model('distnceIntrip', distance);

module.exports = distanceModel;