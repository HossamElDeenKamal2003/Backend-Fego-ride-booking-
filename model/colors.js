const mongoose = require('mongoose');
const colorsSchema = new mongoose.Schema({
    color: {
        type: String
    },
    hexDecimal: {
        type: String
    },
    carImage: {
        type: String
    }
});

const colorsModel = mongoose.model('colors', colorsSchema);

module.exports = colorsModel;