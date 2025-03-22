const mongoose = require('mongoose');

function handleDate(){
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = date.getDay();
    return `${year} - ${month} - ${days}`;
}

const paytabs = new mongoose.Schema({
    driverName: {
        type: String,
    },
    phoneNumber:{
        type: String
    },
    email:{
        type: String
    },
    transactionAmmount:{
        type: Number
    },
    cardId: {
        type: String
    },
    transactionTime:{
        type: String,
        default: handleDate
    }
})

const payModel = mongoose.model('paymodel', paytabs);
module.exports = payModel;