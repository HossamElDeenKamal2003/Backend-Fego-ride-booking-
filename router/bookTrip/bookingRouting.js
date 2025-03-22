const express = require('express');
const {
    findDrivers,
    bookTrip,
    updateStatus,
    acceptTrip,
    startTrip,
    canceledTrip,
    endTrip,
    calculateCost,
    cancelledTripbeforestart,
    allTrips,
    arriving,
    history,
    driverRate,
    updateCost,
    driverHistory,
    addPrice,
    updatePrice,
    getPrice,
    deletePrice,
    updateDistance,
    getDistance,
    retrieveTrip,
    userWallet,
    getUserWallet,
    newApi,
    getAcceptModel,
    seeTrip,
    addAcceptedTrip,
    getAccepted,
    driverCancel,
    addVal,
    update_min_val,
    get_min_value,
    getDriverhistory,
    getTripbyId,
    addComment,
    userRate,
    handleArrivingTime,
    driverWallet,
    getdriverWallet,
    getTripDriver,
    offer,
    chating,
    addCommentDriver,
    commision,
    findPrices,
    getDescription,
    getAccepteduser
} = require('../../controller/booking/userBooking');
const {
    addOffer,
    getOffer
} = require('../../controller/booking/offers');

const { paytabs } = require('../../controller/booking/paytabs/paytabs');
//const { updateLocation } = require('../../controller/booking/driverDest');
const router = express.Router();

router.post('/findDrivers', findDrivers);
router.post('/bookTrip', bookTrip);
router.patch('/cost', calculateCost);
router.get('/history/:id', history);
router.patch('/update-rate', driverRate);
router.patch('/update-cost', updateCost);
//router.patch('/updatelocation', updateLocation);
router.patch('/updatestatus', updateStatus);
router.patch('/accept-trip', acceptTrip);
router.patch('/start-trip', startTrip);
router.patch('/arriving', arriving);
router.post('/end-trip', endTrip);
router.patch('/cancelled-trip', canceledTrip); 
router.patch('/cancelled_before_start', cancelledTripbeforestart);
router.put('/add-offer', addOffer);
router.put('/get-offer', getOffer);
//router.get('/get-trips', allTrips);
router.get('/driver-history/:id', driverHistory);
router.post('/add-price', addPrice)
router.patch('/updatePrice', updatePrice);
router.get('/get-prices', getPrice);
router.post('/delete-price', deletePrice);
router.patch('/max-distance', updateDistance);
router.get('/get-distance-find-drivers', getDistance);
router.post('/retreive-data', retrieveTrip);
router.patch('/update-wallet/:id', userWallet);
router.get('/get-user-wallet/:id', getUserWallet);
router.get('/new-api/:id', newApi);
router.post('/get-accepted', getAcceptModel);
router.post('/see-trip', seeTrip);
//router.post('/pay-tabs', paytabs);
router.post('/add-accepted', addAcceptedTrip);
router.get('/get-accepted-driver/:id', getAccepted);
router.patch('/driver-cancelled', driverCancel);
router.post('/add-val', addVal);
router.patch('/update_min_val', update_min_val);
router.get('/get_min_value', get_min_value);
router.get('/get-driver-history/:id', getDriverhistory);
router.get('/getTripbyId/:id', getTripbyId);
router.patch('/addComment/:id', addComment);
router.patch('/user-rate', userRate);
router.patch('/update-arriving-time', handleArrivingTime);
router.patch('/update-driver-wallet/:id', driverWallet);
router.get('/get-driver-wallet/:id', getdriverWallet);
router.get('/get-trips/:type', getTripDriver);
router.post('/add-offer', offer);
router.post('/chating', chating);
router.post('/user-comment', addCommentDriver);
router.patch('/commision', commision);
router.get('/find-prices/:distance/:country', findPrices);
router.get('/getDescription', getDescription);
router.get('/get-accepted-user/:id', getAccepteduser);
module.exports = router;
