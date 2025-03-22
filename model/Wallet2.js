const mongoose = require('mongoose');
const walletSchema = new mongoose.Schema({
    subScription: {
        type: Number,
    },
    profit: {
        type: Number,
    }
});

const walletSystem = mongoose.model('Wallet', walletSchema);

module.exports = walletSystem;