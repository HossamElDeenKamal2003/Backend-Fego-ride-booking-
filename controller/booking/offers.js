const offerModel = require('../../model/booking/offers');
const driverData = require('../../model/regestration/driverModel');
const TripModel = require('../../model/booking/userBooking');
let io;

const setSocketInstance = (socketIoInstance) => {
    io = socketIoInstance;
};
 
const addOffer = async function(req, res) {
    const { tripId, driverId, offer } = req.body;

    try { 
        // Check if all required fields are provided
        if (!tripId || !driverId || !offer) {
            return res.status(400).json({ message: 'tripId, driverId, and offer are required' });
        }

        // Find trip and driver
        const trip = await TripModel.findById(tripId); 
        const driver = await driverData.findById(driverId);

        // Check if trip and driver exist
        if (!trip || !driver) {
            return res.status(400).json({ message: 'Trip or Driver not found' });
        }

        // Check if the vehicle type matches
        if (trip.vehicleType !== driver.vehicleType) {
            return res.status(400).json({ message: 'Driver vehicle type does not match trip vehicle type' });
        }

        // Upsert the offer if the vehicle types match
        const upsertedOffer = await offerModel.findOneAndUpdate(
            { tripId, driverId },
            { offer },
            { new: true, upsert: true }
        );

        // Emit offerAdded event via WebSocket
        if(io){
            io.emit(`offerAdded/${tripId}`, upsertedOffer);
        }

        res.status(200).json({ message: 'Offer upserted successfully', offer: upsertedOffer });

    } catch (error) {
        console.error('Error in addOffer:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getOffer = async function(req, res) {
    const { tripId } = req.body;
    try {
        if (!tripId) {
            return res.status(400).json({ message: 'tripId is required' });
        }
        const offers = await offerModel.find({ tripId });
        res.status(200).json({ offers });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addOffer,
    getOffer,
    setSocketInstance
};
