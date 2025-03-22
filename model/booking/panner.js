const mongoose = require('mongoose');

const pannerSchema = new mongoose.Schema({
    images: {
        type: [String], 
    },
});

const pannerModel = mongoose.model('panners', pannerSchema);
module.exports = pannerModel;