const express = require('express');
const {
  initiatePayment,
  handlePaymentRedirect,
  handlePaymentCallback,
  filterPayment
} = require('../../controller/payments/payments');

const router = express.Router();

router.post('/pay', initiatePayment);
router.get('/payment-redirect', handlePaymentRedirect);
router.post('/payment-callback', handlePaymentCallback);
router.post('/filterPayment', filterPayment);

module.exports = router;
