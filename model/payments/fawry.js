const mongoose = require('mongoose');
function getCurrentDate() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: 'Africa/Cairo' }));
}

const fawrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  transactionId: {
    type: String,
  },
  transactionStatus: {
    type: String,
  },
  amount: {
    type: Number,
  },
  type: {
    type: String,
  },
  date: {
    type: Date, 
    default: getCurrentDate,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const payment = mongoose.model('payment', fawrySchema);

module.exports = payment;
