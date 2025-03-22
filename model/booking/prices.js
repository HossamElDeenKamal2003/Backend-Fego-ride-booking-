const mongoose = require('mongoose');

// Level 1 Schema
const level1Schema = new mongoose.Schema({
    country: {
        type: String,
        required: true,
        default: 'egypt'
    },
    priceCar: {
        type: Number,
        required: true
    },
    motorocycle: {
        type: Number,
        required: true
    },
    priceVan: {
        type: Number,
        required: true
    },
    penfits: {
        type: Number,
    },
    compfort:{
        type: Number
    }
});

// Level 2 Schema
const level2Schema = new mongoose.Schema({
    country: {
        type: String,
        required: true,
        default: 'egypt'
    },
    priceCar: {
        type: Number,
        required: true
    },
    motorocycle: {
        type: Number,
        required: true
    },
    priceVan: {
        type: Number,
        required: true
    },
    penfits: {
        type: Number,
    },
    compfort:{
        type: Number
    }
});

// Level 3 Schema
const level3Schema = new mongoose.Schema({
    country: {
        type: String,
        required: true,
        default: 'egypt'
    },
    priceCar: {
        type: Number,
        required: true
    },
    motorocycle: {
        type: Number,
        required: true
    },
    priceVan: {
        type: Number,
        required: true
    },
    penfits: {
        type: Number,
    },
    compfort:{
        type: Number
    }
});

// Level 4 Schema
const level4Schema = new mongoose.Schema({
    country: {
        type: String,
        required: true,
        default: 'egypt'
    },
    priceCar: {
        type: Number,
        required: true
    },
    motorocycle: {
        type: Number,
        required: true
    },
    priceVan: {
        type: Number,
        required: true
    },
    penfits: {
        type: Number,
    },
    compfort:{
        type: Number
    }
});

// Creating models
const Level1 = mongoose.model('Level1', level1Schema);
const Level2 = mongoose.model('Level2', level2Schema);
const Level3 = mongoose.model('Level3', level3Schema);
const Level4 = mongoose.model('Level4', level4Schema);

// Exporting models
module.exports = {
    Level1,
    Level2,
    Level3,
    Level4
};
