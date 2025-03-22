const express = require('express');
const { createUserOptions, req, getOffers, getReq,deleteReq, increase, updateOption, generateCoupon,getInvite, applyInvite, updateBooleanvalueUser, getDriverCounterUser, updateBooleanvalueDriver, getDriverCounter, updateMessageUser, updateMessageDriver} = require('../controller/discountController');

const router = express.Router();
// , calculateTripsUser, calculateTripsDrivers 
router.post('/create', createUserOptions);
router.put('/update', updateOption);
// router.get('/calculate-trips/:id', calculateTripsUser);
// router.get('/calculateTripsdrivers/:id', calculateTripsDrivers);
router.put('/discount/:discountId', updateMessageUser);
router.put('/discount/:discountId', updateMessageDriver);
router.get('/getDriverCounter/:id', getDriverCounter);
router.get('/getDriverCounterUser/:id', getDriverCounterUser);
router.patch('/update-bool-user', updateBooleanvalueUser);
router.patch('/update-bool-driver', updateBooleanvalueDriver);
router.post('/generate-coupon', generateCoupon);
router.get('/invite/:userId', getInvite);
router.post('/apply-invite', applyInvite);
router.post('/addCoupon', increase);
router.post('/req', req);
router.get('/getReq', getReq);
router.delete('/delete-req', deleteReq);
router.get('/getOffers', getOffers);
module.exports = router;