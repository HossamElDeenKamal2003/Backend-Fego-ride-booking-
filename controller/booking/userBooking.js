const mongoose = require('mongoose');
const driverDestination = require('../../model/booking/driversDestination');
const detailTrip = require('../../model/regestration/driverModel.js');
const pendingModel = require('../../model/booking/pendingTrips.js');
const booking = require('../../model/booking/userBooking.js');
const bookModel = require('../../model/booking/userBooking.js');
const DestDriver = require('../../model/booking/driversDestination.js');
const user = require('../../model/regestration/userModel.js');
const http = require('http');
const server = http.createServer();
const { Server } = require("socket.io");
const io = new Server(server);
const Distance = require('../../model/booking/maxDistance.js');
const offers = require('../../model/booking/offers.js');
const PricesModel = require('../../model/booking/prices.js');
const sendNotification = require('../../firebase.js');
const User = require('../../model/regestration/userModel.js');
const Driver = require('../../model/regestration/driverModel.js');
const acceptedModel = require('../../model/booking/acceptedModel');
const minValue = require('../../model/booking/minCharge.js');
const offerModel = require('../../model/booking/offers.js');
const Conversation =require('../../model/booking/chating/conversation.js');
const Message = require ('../../model/booking/chating/newChatModel.js');
const distance = require('../../model/booking/maxDistance.js');
const geolib = require('geolib');
const distnceintrips = require('../../model/intripdistance.js');

let connectedClients = {};

const findPrices = async(req, res)=>{
    const distance = req.params.distance;
    const country = req.params.country;
    try{
        if (distance < 20) {
            const levelOnePrice = await Level1.findOne({ country });
            const carPrice = levelOnePrice.priceCar*distance;
            const motorocycle = levelOnePrice.motorocycle*distance;
            const priceVan = levelOnePrice.priceVan*distance;
            const comfort = levelOnePrice.compfort*distance;
            return res.status(200).json({ 
                carPrice: carPrice,
                motorocycle: motorocycle,
                priceVan: priceVan,
                comfort: comfort
             });
        } else if (distance < 40) {
            const levelTwoPrice = await Level2.findOne({ country });
            const carPrice = levelTwoPrice.priceCar*distance;
            const motorocycle = levelTwoPrice.motorocycle*distance;
            const priceVan = levelTwoPrice.priceVan*distance;
            const comfort = levelTwoPrice.compfort*distance;
            return res.status(200).json({ 
                carPrice: carPrice,
                motorocycle: motorocycle,
                priceVan: priceVan,
                comfort: comfort
             });
        } else if (distance < 60) {
            const levelThreePrice = await Level3.findOne({ country });
            const carPrice = levelThreePrice.priceCar*distance;
            const motorocycle = levelThreePrice.motorocycle*distance;
            const priceVan = levelThreePrice.priceVan*distance;
            const comfort = levelThreePrice.compfort*distance;
            return res.status(200).json({ 
                carPrice: carPrice,
                motorocycle: motorocycle,
                priceVan: priceVan,
                comfort: comfort
             });
        } else {
            const levelFourPrice = await Level4.findOne({ country });
            const carPrice = levelFourPrice.priceCar*distance;
            const motorocycle = levelFourPrice.motorocycle*distance;
            const priceVan = levelFourPrice.priceVan*distance;
            const comfort = levelFourPrice.compfort*distance;
            return res.status(200).json({ 
                carPrice: carPrice,
                motorocycle: motorocycle,
                priceVan: priceVan,
                comfort: comfort
             });
        }
    }
    catch(error){
        console.log(error.message);
        return res.status(500).json({message: error.message});
    }
}

const { Level1,
    Level2,
    Level3,
    Level4} = require('../../model/booking/prices.js');

async function deleteFromAcceptedModel(tripId) {
    const trip = await acceptedModel.findOneAndDelete({ tripId: tripId });
    return { message: 'Document Deleted Successfully' };
}

const findDrivers = async (vehicleType, latitude, longitude) => {
    if (!vehicleType || latitude === undefined || longitude === undefined) {
        throw new Error('Vehicle type, latitude, and longitude are required');
    }

    try {
        const settings = await Distance.findOne({});
        const maxDistance = settings ? settings.maxDistance : 5000; // Default to 5km if not set

        // Use the MongoDB aggregation pipeline to calculate distance between client and drivers
        const drivers = await driverDestination.aggregate([
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    distanceField: "distance", // This will return the calculated distance in meters
                    spherical: true,
                    maxDistance: maxDistance,
                    query: { vehicleType } // Filter by vehicle type
                }
            }
        ]);

        if (!drivers || drivers.length === 0) {
            return []; // Always return an array, even if no drivers are found
        }

        // Find detailed information for each nearby driver and include the distance
        const driverDetails = await Promise.all(
            drivers.map(async (driver) => {
                const detail = await detailTrip.findOne({ _id: driver.driverId });
                return {
                    ...driver,
                    ...(detail ? detail.toObject() : {}), // Include additional driver details if found
                    distance: driver.distance // Include calculated distance
                };
            })
        );

        return driverDetails; 

    } catch (error) {
        console.error('Error finding drivers:', error);
        throw error;
    }
};

const updateDistance = async function(req, res) {
    const { maxDistance } = req.body;

    try {
        // Ensure maxDistance is provided
        if (!maxDistance) {
            return res.status(400).json({ message: "maxDistance is required" });
        }

        // Update the document by its _id
        const result = await Distance.findOneAndUpdate(
            { _id: "66cc4dd383ebb7ad1147a518" },  // Ensure this ID is correct
            { maxDistance: maxDistance },
            { new: true }  // Return the updated document
        );

        // Check if the update was successful
        if (!result) {
            return res.status(404).json({ message: "Distance data not found" });
        }

        // Send the updated document in the response
        res.status(200).json({ message: "Distance updated successfully", result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getDistance = async function(req, res){
    try{
        const distance = await Distance.findOne({});
        if(!distance){
            res.status(404).json({message: "No Data For Distance"});
        }
        res.status(200).json({message: distance});
    }
    catch(error){
        console.log(error);
    }
}

const addCommentDriver = async function(req, res) {
    const { id, comment } = req.body;
    try {
        const driver = await Driver.findOne({ _id: id });
        if (!driver) {
            return res.status(404).json({ message: "Driver Not Found" });
        }
        // Push the new comment to the array
        driver.comments.push(comment);

        // Save the updated driver document
        await driver.save();

        // Respond with a success message
        res.status(200).json({ message: "Comment added successfully", driver });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}
const checkRemainingDistance = async (driverId, tripId) => {
    try {
        console.log(`Checking remaining distance for DriverID: ${driverId} and TripID: ${tripId}`);

        // Fetch driver's current location
        const driverLocation = await DestDriver.findOne({ driverId });
        if (!driverLocation?.location?.coordinates) {
            throw new Error('Driver location not found or invalid');
        }

        // Fetch trip details
        const trip = await bookModel.findOne({ _id: tripId });
        if (!trip?.destinationLocation?.coordinates) {
            throw new Error('Trip not found or destination location invalid');
        }

        // Extract coordinates
        const [driverLongitude, driverLatitude] = driverLocation.location.coordinates;
        const [destLongitude, destLatitude] = trip.destinationLocation.coordinates;

        // Calculate remaining distance
        const remainingDistance = calculateDistance(driverLatitude, driverLongitude, destLatitude, destLongitude);
        console.log(`${driverId} ,Remaining Distance: ${remainingDistance} meters`);
        return remainingDistance;
    } catch (error) {
        console.error('Error checking remaining distance:', error.message);
        throw error;
    }
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    return geolib.getDistance(
        { latitude: lat1, longitude: lon1 },
        { latitude: lat2, longitude: lon2 }
    );
};

const bookTrip = async (req, res) => {
    try {
        const {
            id, distance, username, driverId, destination, latitude, longitude,
            destlatitude, destlongtitude, cost, pickupLocationName, time, vehicleType,
            locationName, uniqueId, comment, arrivingTime, comfort, duration, encodedPolyline,
            country, paymentType,
        } = req.body;

        if (!id || !distance || !username || !destination || latitude === undefined || longitude === undefined || !locationName) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Fetch user data
        const userData = await User.findById(id);
        if (!userData) return res.status(404).json({ message: 'User not found' });

        const userWallet = userData.wallet || 0;
        
        // Prepare booking data
        const bookingData = {
            userId: id,
            abirdPrice: userWallet < cost ? cost - userWallet : 0,
            distance,
            driverId,
            uniqueId,
            pickupLocationName,
            time,
            locationName,
            username,
            destination,
            vehicleType,
            commision: 0,
            pickupLocation: { type: "Point", coordinates: [longitude, latitude] },
            destinationLocation: { type: "Point", coordinates: [destlongtitude, destlatitude] },
            cost,
            status: 'pending',
            comment: comment || "",
            arrivingTime,
            comfort,
            duration: duration || "",
            encodedPolyline: encodedPolyline || "",
            country: country || "egypt",
            paymentType: paymentType || "",
            userencodedPolyline: "",
        };

        // Save booking data
        const savedBooking = await new bookModel(bookingData).save();
        await new pendingModel(bookingData).save();

        res.status(200).json({ booking: savedBooking, trips: [savedBooking.toObject()] });
        
        const notificationMessage = { title: 'New Trip Available', body: 'Fego: A New Trip Available' };
        const availableDrivers = await findDrivers(vehicleType, latitude, longitude);

        if (availableDrivers?.length) {
            await Promise.all(availableDrivers.map(async (driver) => {
                const { driverFCMToken, _id: driverId } = driver;
        
                if (global.io && driverId) {
                    global.io.emit(`getTrips/${driverId}`, { trips: [savedBooking.toObject()] });
                    // sendNotification(driverFCMToken, notificationMessage);
                }
        
                // Find trips with status "start" for the driver
                const activeTrips = await bookModel.find({ driverId: driverId, status: "start" });
                console.log(activeTrips)
                // if (activeTrips.length > 0) {
                    // Get the latest trip's ID
                    const latestTripId = activeTrips[activeTrips.length - 1]._id;
                    console.log('Trip Id', latestTripId);
                    // Check remaining distance
                    const remainingDistance = await checkRemainingDistance(driverId, latestTripId);
                    const dis = await distnceintrips.findOne({_id: "67a89c712ee28a978d473bed"})
                    if (remainingDistance <= dis.distance) {
                        global.io.emit(`getTripsinTrip/${driverId}`, { trips: [savedBooking.toObject()] });
                        sendNotification(driverFCMToken, notificationMessage);
                    }
                // }
            }));
        }
        
    } catch (error) {
        console.error('Error in bookTrip:', error.message);
        res.status(500).json({ message: error.message });
    }
};

const acceptTrip = async (req, res) => {
    const { tripId, driverId, userId, offerId } = req.body;

    if (!tripId || !driverId || !userId || !offerId) {
        return res.status(400).json({ message: 'Data required' });
    }
    try {
        // Fetch required data in parallel
        const [driverBook, booking, userData, driverLocation, offer, conversation] = await Promise.all([
            detailTrip.findOne({ _id: driverId }).populate('carColor').lean(),
            bookModel.findOne({ _id: tripId }),
            user.findOne({ _id: userId }).lean(),
            driverDestination.findOne({ driverId }).lean(),
            offers.findOne({ _id: offerId }).lean(),
            Conversation.findOne({ participants: { $all: [driverId, userId] } })
        ]);
        console.log(driverBook)

        // Validate fetched data
        if (!booking) return res.status(404).json({ message: 'Trip not found' });
        if (!driverBook) return res.status(404).json({ message: 'Driver not found' });
        if (!userData) return res.status(404).json({ message: 'User not found' });
        if (!offer) return res.status(404).json({ message: 'Offer not found' });

        // Update booking details
        booking.status = 'accepted';
        booking.cost = offer.offer || booking.cost;
        // booking.userencodedPolyline = offer.userencodedPolyline;
        booking.driverId = driverId;
        const updatedBooking = await booking.save();

        // If no conversation exists, create one
        let updatedConversation = conversation;
        if (!conversation) {
            updatedConversation = new Conversation({
                participants: [driverId, userId]
            });
            await updatedConversation.save();
        }

        booking.userencodedPolyline = offer.userencodedPolyline;
        await booking.save();
        updatedBooking.userencodedPolyline = booking.userencodedPolyline;
        // Immediate response
        res.status(200).json({ 
            updatedBooking, 
            driverBook, 
            driverLocation, 
            userData, 
            offer,
            conversation: updatedConversation 
        });

        // Perform non-critical operations asynchronously
        setImmediate(async () => {
            try {
                // Send notifications

                // Remove trip from pendingModel
                await pendingModel.findOneAndDelete({ _id: tripId });
                const trips = await bookModel.find({ status: 'pending' }).lean();
                const isLastTripEnded = await checkStatusTripDriver(driverId);
                if (global.io) {
                    // Emit event that driver accepted a new trip
                    global.io.emit(`tripAccepted2/${driverId}`, {
                        updatedBooking,
                        driverBook,
                        driverLocation,
                        userData,
                        conversation: updatedConversation,
                        allowNavigation: isLastTripEnded 
                    });
                if(global.io){
                    global.io.emit(`waiting/${driverId}`);
                }
                    // Emit to update trip list for everyone
                global.io.emit('get-trips', { trips });
                }
                const notificationMessage = { title: 'Trip Accepted', body: 'Accepted Your Offer' };
                if (driverBook.driverFCMToken) {
                    sendNotification(driverBook.driverFCMToken, notificationMessage);
                }
                if (userData.userFCMToken) {
                    sendNotification(userData.userFCMToken, notificationMessage);
                }
            } catch (asyncError) {
                console.error('Async error:', asyncError.message);
            } 
        });
    } catch (error) { 
        console.error('Error:', error.message);
        res.status(500).json({ message: error.message });
    }
};
const newApi = async function(req, res) {
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({ message: "ID is required" });
    }

    try {
        const booking = await bookModel.findById(id);
        if (!booking) {
            return res.status(404).json({ message: "Trip Not Found" });
        }

        const vehicleType = booking.vehicleType;
        const latitude = booking.pickupLocation.coordinates[1];
        const longitude = booking.pickupLocation.coordinates[0];

        // Log the values to ensure they are being retrieved correctly
        console.log('Booking Details:', { vehicleType, latitude, longitude });

        const availableDrivers = await findDrivers(vehicleType, latitude, longitude);

        if (availableDrivers.length === 0) {
            return res.status(200).json({ message: "No Drivers Here" });
        }

        res.status(200).json({ booking, availableDrivers });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ message: error.message });
    }
};
const calculateCost = async function(req, res) {
    const { tripId, cost } = req.body;
    try {
        const trip = await bookModel.findOne({ _id: tripId });
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        const newCost = await bookModel.findByIdAndUpdate(
            tripId,
            { cost },
            { new: true } // Optionally, return the updated document
        );
        

        return res.status(200).json({ message: 'Cost updated successfully', newCost });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};

const checkStatusTripDriver = async (driverId) => {
    try {
        // Fetch all trips for the driver
        const driverLastTrip = await bookModel.find({ driverId: driverId });
        
        // Check if there are any trips
        if (driverLastTrip.length === 0) {
            return true; // No trips found, driver is free
        }

        // Get the last trip
        const lastTrip = driverLastTrip[driverLastTrip.length - 2];
        console.log("lastTrip", lastTrip);
        // Check the status of the last trip
        if (lastTrip.status === 'end' || lastTrip.status === 'cancelled') {
            return true; // Driver is free to navigate to the trip screen
        }

        return false; // Driver is still in a trip (status: "start")
    } catch (error) {
        console.error("Error in checkStatusTripDriver:", error);
        return false; // Default to false in case of an error
    }
};


const getAcceptModel = async function(req, res){
    const { tripId, driverId, userId, conversationId } = req.body;
    try{
        const updatedBooking = await bookModel.findOne({ _id: tripId });
        const driverBook = await detailTrip.findOne({ _id: driverId }).populate('carColor').lean();
        const driverLocation = await driverDestination.findOne({ driverId: driverId });
        const userData = await User.findOne({ _id: userId });

        if(!updatedBooking){
            res.status(404).json({ message: "Trip Not Found"  });
        }
        res.status(200).json({ updatedBooking, driverBook, driverLocation, userData });
    }
    catch(error){
        console.log(error);
        res.status(500).json(error.message);
    }
}

const cancelledTripbeforestart = async function(req, res) {
    const { tripId, userId } = req.body; // Ensure tripId and userId are passed

    try {
        if (!tripId || !userId) {
            return res.status(400).json({ message: 'Trip ID and User ID are required' });
        }

        // Await deletion and check result
        await deleteFromAcceptedModel(tripId);
        // Find and update the booking
        const booking = await bookModel.findOneAndUpdate({ _id: tripId }, { status: 'cancelled' }, { new: true });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Retrieve the user information
        const userData = await user.findOne({ _id: userId });

        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ booking });
        // Prepare the notification message
        const notificationMessage = {
            title: 'Trip Cancelled',
            body: 'The trip has been cancelled before it started.',
        };

        // Get FCM tokens
        const userFcmToken = userData.userFCMToken;

        // Send notifications
        if (userFcmToken) {
            await sendNotification(userFcmToken, notificationMessage);
        }
        if (global.io) {
            global.io.emit('trip', booking);
        }
        const trips = await bookModel.find({ status: 'cancelled' });
        const tripsSocket = trips.map(trip => trip.toObject());
        if (global.io) {
            global.io.emit('get-trips', { trips: tripsSocket });
        }
        // Respond with the updated booking
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const driverCancel = async function (req, res) {
    const { tripId, driverId } = req.body;
    try {
        const findtrip = await bookModel.findOne({ _id: tripId });
        if (!findtrip) {
            return res.status(404).json({ message: "Trip Not Found" });
        }
        await deleteFromAcceptedModel(tripId);
        const tripData = await bookModel.findOne({ _id: tripId });
        // Check if the driverId matches the trip's driverId
        if (findtrip.driverId.toString() === driverId) {
            // Update the trip status to "pending"
            findtrip.status = "pending";
            await findtrip.save();  
            if(global.io){
                global.io.emit(`trip/${tripId}`, tripData);
            }
            const trips = await bookModel.find({ status: 'pending' });
            const tripsSocket = trips.map(trip => trip.toObject());
            if (global.io) {
                global.io.emit('get-trips', { trips: tripsSocket });
            }
            return res.status(200).json({ message: "Trip Cancelled by Driver" });
        } else {
            return res.status(404).json({ message: "Driver for This Trip Not Found" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Start a trip
const startTrip = async (req, res) => {
    const { tripId, driverId, userId } = req.body;

    try {
        // Validate input
        if (!tripId || !driverId || !userId) {
            return res.status(400).json({ message: 'Trip ID, Driver ID, and User ID are required' });
        }
        await deleteFromAcceptedModel(tripId);
        // Fetch driver and booking details
        const [driverBook, booking, userData] = await Promise.all([
            detailTrip.findOne({ _id: driverId }),
            bookModel.findOne({ _id: tripId }),
            user.findOne({ _id: userId })
        ]);

        if (!booking) {
            return res.status(404).json({ message: 'Trip not found' });
        }
        if (!driverBook) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the trip status to 'start'
        booking.status = 'start';

        // Delete the trip from the pending model
        const deletedPendingTrip = await pendingModel.findOneAndDelete({ _id: tripId });
        if (!deletedPendingTrip) {
            console.warn(`Trip ${tripId} not found in pendingModel`);
        }

        // Save the updated booking
        const updatedBooking = await booking.save();

        // Prepare the notification message
        const notificationMessage = {
            title: 'Trip Started',
            body: `Trip ${booking.uniqueId} has started.`,
        };

        // Get FCM tokens
        const driverFcmToken = driverBook.driverFCMToken;
        const userFcmToken = userData.userFCMToken;

        // Send notifications to the driver and user
        if (driverFcmToken) {
            sendNotification(driverFcmToken, notificationMessage);
        }
        if (userFcmToken) {
            sendNotification(userFcmToken, notificationMessage);
        }

        // Emit real-time event using WebSocket
        if (global.io) {
            global.io.emit(`tripStarted/${tripId}`, { updatedBooking, driverBook, userData });
        }
        const trips = await bookModel.find({ status: 'pending' });
        const tripsSocket = trips.map(trip => trip.toObject());
        if (global.io) {
            global.io.emit('get-trips', { trips: tripsSocket });
        }
        // Respond with the updated booking and driver data
        res.status(200).json({ updatedBooking, driverBook });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message });
    }
};

const arriving = async (req, res) => {
    const { tripId, driverId, userId } = req.body;

    try {
        // Validate input
        if (!tripId || !driverId) {
            return res.status(400).json({ message: 'Trip ID and Driver ID are required' });
        }
        await deleteFromAcceptedModel(tripId);
        // Fetch data in parallel
        const [driverBook, booking, userData] = await Promise.all([
            detailTrip.findOne({ _id: driverId }),
            bookModel.findOne({ _id: tripId }),
            user.findOne({ _id: userId }) // Assuming User is your model
        ]);

        // Validate data
        if (!booking) {
            return res.status(404).json({ message: 'Trip not found' });
        }
        if (!driverBook) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the status to 'Arriving'
        booking.status = 'Arriving';
        const deletedPendingTrip = await pendingModel.findOneAndDelete({ _id: tripId });

        if (!deletedPendingTrip) {
            console.warn(`Trip ${tripId} not found in pendingModel`);
        }

        const updatedBooking = await booking.save();

        // Emit real-time event
        if (global.io) {
            global.io.emit(`tripArriving/${tripId}`, { updatedBooking, driverBook, userId });
        }

        // Get FCM tokens and send notifications
        const userFcmToken = userData.userFCMToken;
        const driverFcmToken = driverBook.driverFCMToken;

        const notificationMessage = { 
            title: 'Trip Arrival', 
            body: 'The driver is arriving.' 
        };
        
        if (driverFcmToken) {
            sendNotification(driverFcmToken, notificationMessage);
        }
        if (userFcmToken) {
            sendNotification(userFcmToken, notificationMessage);
        }
        const trips = await bookModel.find({ status: 'pending' });
        const tripsSocket = trips.map(trip => trip.toObject());
        if (global.io) {
            global.io.emit('get-trips', { trips: tripsSocket });
        }
        res.status(200).json({ updatedBooking, driverBook });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message });
    }
};

// Cancel a trip
const canceledTrip = async (req, res) => {
    const { tripId, driverId, userId } = req.body; 

    try {
        // Validate input
        if (!tripId || !driverId || !userId) {
            return res.status(400).json({ message: 'Trip ID, Driver ID, and User ID are required' });
        }
        await deleteFromAcceptedModel(tripId);

        // Fetch driver, booking, and user details
        const [driverBook, booking, userData] = await Promise.all([
            detailTrip.findOne({ _id: driverId }),
            bookModel.findOne({ _id: tripId }),
            user.findOne({ _id: userId })
        ]);

        if (!booking) {
            return res.status(404).json({ message: 'Trip not found' });
        }
        if (!driverBook) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the status to 'cancelled'
        booking.status = 'cancelled';

        // Delete the trip from the pending model
        const deletedPendingTrip = await pendingModel.findOneAndDelete({ _id: tripId });
        if (!deletedPendingTrip) {
            console.warn(`Trip ${tripId} not found in pendingModel`);
        }

        // Save the updated booking
        const updatedBooking = await booking.save();

        // Prepare the notification message
        const notificationMessage = {
            title: 'Trip Cancelled',
            body: 'The trip has been cancelled.',
        };

        // Get FCM tokens
        const driverFcmToken = driverBook.driverFCMToken;
        const userFcmToken = userData.userFCMToken;

        // Send notifications to both the driver and the user
        if (driverFcmToken) {
            sendNotification(driverFcmToken, notificationMessage);
        }
        if (userFcmToken) {
            sendNotification(userFcmToken, notificationMessage);
        }

        // Emit real-time event using WebSocket
        if (global.io) {
            global.io.emit(`tripCancelled/${tripId}`, { updatedBooking, driverBook, userData });
        }
        const trips = await bookModel.find({ status: 'pending' });
        const tripsSocket = trips.map(trip => trip.toObject());
        if (global.io) {
            global.io.emit('get-trips', { trips: tripsSocket });
        }
        // Respond with the updated booking and driver data
        res.status(200).json({ updatedBooking, driverBook });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message });
    }
};

const endTrip = async (req, res) => {
    const { tripId, paied } = req.body;
    console.log('🔹 Received request to endTrip with:', { tripId, paied });

    try {
        if (!tripId) {
            console.warn('⚠️ Trip ID is missing');
            return res.status(400).json({ message: 'Trip ID is required' });
        }

        let response = {
            updatedBooking: null,
            driverBook: null,
            driverWallet: null,
            userWallet: null,
        };

        const booking = await bookModel.findOne({ _id: tripId });
        if (!booking) {
            console.warn(`⚠️ Trip with ID ${tripId} not found`);
            return res.status(404).json({ message: 'Trip not found' });
        }

        const { 
            driverId: driverBook, 
            userId: userData, 
            distance, 
            country, 
            cost: tripCost, 
            abirdPrice = 0, 
            status 
        } = booking;
        const numericDistance = Number(distance) || 0;

        console.log('🔹 Booking details:', { driverBook, userData, numericDistance, country, tripCost, abirdPrice, status });
        response.driverBook = driverBook;

        const [driver, user] = await Promise.all([
            Driver.findOne({ _id: driverBook }),
            User.findOne({ _id: userData })
        ]);

        if (!driver || !user) {
            console.warn('⚠️ Driver or User not found');
            return res.status(404).json({ message: 'Driver or User not found' });
        }

        let driverWallet = driver.wallet || 0;
        let userWallet = user.wallet || 0;
        
        if(driver.walletType === "1"){
            console.log('🔹 Wallets before update:', { driverWallet, userWallet });
            response.driverWallet = driverWallet;
            response.userWallet = userWallet;
            console.log("################", typeof(driverWallet), "#############");
            // await deleteFromAcceptedModel(tripId);

            if (status === 'end') {
                console.log('✅ Trip already ended, emitting event');
                response.updatedBooking = booking;
                if (global.io) {
                    global.io.emit(`tripEnd/${tripId}`, { updatedBooking: booking, driverBook });
                }
                return res.status(200).json(response);
            }

            booking.status = 'end';
            const updatedBooking = await booking.save();
            console.log('✅ Booking status updated to "end"');
            response.updatedBooking = updatedBooking;

            if (global.io) {
                global.io.emit(`tripEnd/${tripId}`, { updatedBooking, driverBook });
            }

            let commission = 0;
            if (numericDistance < 20) {
                const levelOnePrice = await Level1.findOne({ country });
                commission = levelOnePrice?.penfits || 0;
            } else if (numericDistance < 40) {
                const levelTwoPrice = await Level2.findOne({ country });
                commission = levelTwoPrice?.penfits || 0;
            } else if (numericDistance < 60) {
                const levelThreePrice = await Level3.findOne({ country });
                commission = levelThreePrice?.penfits || 0;
            } else {
                const levelFourPrice = await Level4.findOne({ country });
                commission = levelFourPrice?.penfits || 0;
            }

            console.log('🔹 Commission calculated:', commission);
            if(paied > abirdPrice && driver.wallet > Math.abs((paied - abirdPrice) + commission) ){
                driverWallet -= (Math.abs(paied - abirdPrice) + commission);
                userWallet += (Math.abs(paied - abirdPrice));
                await Promise.all([
                    User.updateOne({ _id: userData }, { wallet: userWallet }),
                    Driver.updateOne({ _id: driverBook }, { wallet: driverWallet })
                ]);
            }
            else if(userWallet >= abirdPrice){
                driverWallet += tripCost;
                userWallet -= tripCost;
                driverWallet -= commission;
                await Promise.all([
                    User.updateOne({ _id: userData }, { wallet: userWallet }),
                    Driver.updateOne({ _id: driverBook }, { wallet: driverWallet })
                ]);
            }
            else if (userWallet === 0 && paied === abirdPrice) {
                try {
                    // Deduct commission from driver's wallet
                    driverWallet -= commission;
                    console.log('✅ User overpaid, wallet adjusted:', { userWallet, driverWallet });
                    console.log("################", typeof(driverWallet), "#############");
            
                    // Update driver's wallet in the database
                    const updatedDriver = await Driver.findOneAndUpdate(
                        { _id: driver._id },
                        { wallet: driverWallet },
                        { new: true }
                    );
                    console.log('Updated driver wallet:', updatedDriver);
            
                    // // Update user's wallet in the database
                    // const updatedUser = await User.findOneAndUpdate(
                    //     { _id: userData },
                    //     { wallet: userWallet },
                    //     { new: true }
                    // );
                    // console.log('Updated user wallet:', updatedUser);
            
                } catch (error) {
                    console.error('❌ Error updating wallets:', error);
                    throw new Error('Failed to update wallets');
                }
            }else if(userWallet <= cost){
                driverWallet += userWallet;
                userWallet = 0;
                await Promise.all([
                    User.updateOne({ _id: userData }, { wallet: userWallet }),
                    Driver.updateOne({ _id: driverBook }, { wallet: driverWallet })
                ]);
            }
            response.userWallet = userWallet;
            response.driverWallet = driverWallet;
            driver.ctr += 1;
            await driver.save();
            return res.status(200).json(response);
            

        } else if(driver.walletType === "2"){
            
            booking.status = 'end';
            const updatedBooking = await booking.save();
            console.log('✅ Booking status updated to "end"');

            if (global.io) {
                global.io.emit(`tripEnd/${tripId}`, { updatedBooking, driverBook });
            }
            
            const com = await walletSystemModel.findOne({_id: "678cc8adf1d3a9b7b6f7174e"});
            const comm = com.profit;
            if(paied > abirdPrice && driverWallet > Math.abs((paied - abirdPrice) + comm) ){
                driverWallet -= (Math.abs(paied - abirdPrice) + comm);
                userWallet += (Math.abs(paied - abirdPrice));
                await Promise.all([
                    User.updateOne({ _id: userData }, { wallet: userWallet }),
                    Driver.updateOne({ _id: driverBook }, { wallet: driverWallet })
                ]);
            }

            else if (userWallet > 0 && userWallet <= tripCost) {
                driverWallet += userWallet;
                driverWallet -= (tripCost * (comm / 100));
                userWallet = 0;
            } else if (userWallet >= tripCost) {
                driverWallet += tripCost;
                userWallet -= tripCost;
                driverWallet -= (tripCost * (comm / 100));
            } else {
                driverWallet -= (tripCost * (comm / 100));
            }

            console.log('🔹 Wallets after calculation:', { driverWallet, userWallet });

            await Promise.all([
                User.updateOne({ _id: userData }, { wallet: userWallet }),
                Driver.updateOne({ _id: driverBook }, { wallet: driverWallet })
            ]);

            response.userWallet = userWallet;
            response.driverWallet = driverWallet;

            console.log('✅ Driver and user wallets updated successfully');
            driver.ctr += 1;
            await driver.save();
            return res.status(200).json(response);
        } 
        else {
            return res.status(403).json({ message: "Driver is not allowed to use wallet" });
        }

    } catch (error) {
        console.error('❌ Error in endTrip:', error);
        return res.status(500).json({ message: 'An error occurred while ending the trip', error: error.message });
    }
};


async function calculateCommission(distance, country) {
    let commission = 0;
    if (distance < 20) {
        const levelOnePrice = await Level1.findOne({ country });
        commission = levelOnePrice?.penfits || 0;
    } else if (distance < 40) {
        const levelTwoPrice = await Level2.findOne({ country });
        commission = levelTwoPrice?.penfits || 0;
    } else if (distance < 60) {
        const levelThreePrice = await Level3.findOne({ country });
        commission = levelThreePrice?.penfits || 0;
    } else {
        const levelFourPrice = await Level4.findOne({ country });
        commission = levelFourPrice?.penfits || 0;
    }
    return commission;
}

async function adjustWalletsBasedOnPayment(userId, driverId, userWallet, driverWallet, tripCost, commission) {
    let updatedUserWallet = userWallet;
    let updatedDriverWallet = driverWallet;

    if (userWallet > 0 && userWallet < tripCost) {
        updatedDriverWallet += userWallet;
        updatedDriverWallet -= (tripCost * (commission / 100));
        updatedUserWallet = 0;
    } else if (userWallet >= tripCost) {
        updatedDriverWallet += tripCost;
        updatedUserWallet -= tripCost;
        updatedDriverWallet -= (tripCost * (commission / 100));
    } else {
        updatedDriverWallet -= (tripCost * (commission / 100));
    }

    await updateWallets(userId, updatedUserWallet, driverId, updatedDriverWallet);
    
    return { userWallet: updatedUserWallet, driverWallet: updatedDriverWallet };
}

async function updateWallets(userId, userWallet, driverId, driverWallet) {
    await Promise.all([
        User.updateOne({ _id: userId }, { wallet: userWallet }),
        Driver.updateOne({ _id: driverId }, { wallet: driverWallet })
    ]);
}


function emitTripEndEvent(tripId, updatedBooking) {
    if (global.io) {
        global.io.emit(`tripEnd/${tripId}`, { updatedBooking });
    }
}

// Update booking status
const updateStatus = async (req, res) => {
    const { tripId, status } = req.body;
    try {
        if (!tripId || !status) {
            return res.status(400).json({ message: 'Trip ID and status are required' });
        }

        // Update booking status
        const updatedBooking = await bookModel.findByIdAndUpdate(
            tripId,
            { status: status }, 
            { new: true } 
        );

        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.status(200).json(updatedBooking);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

const history = async function(req, res){
    const userId = req.params.id;
    try {
        // Find all trips that are not pending and match the given userId
        const trips = await bookModel.find({ status: { $ne: "pending" }, userId: userId });
        
        // Fetch driver details for each trip
        const tripsWithDriverDetails = await Promise.all(trips.map(async trip => {
            const driverDetail = await detailTrip.findOne({ _id: trip.driverId });
            return { ...trip.toObject(), driverDetail }; // Convert Mongoose document to plain object and include driverDetail
        }));

        // Emit trips with driver details to all WebSocket clients
        if (global.io) {
            global.io.emit('tripsUpdate', tripsWithDriverDetails);
        }

        // Send response with trips to the client who made the HTTP request
        res.status(200).json(tripsWithDriverDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'INTERNAL SERVER ERROR' });
    }
}

const driverHistory = async function(req, res) {
    const driverId = req.params.id;
    try {
        // Fetch driver trips
        const driverTrips = await booking.find({ driverId: driverId });

        // Check if trips were found
        if (!driverTrips || driverTrips.length === 0) {
            return res.status(404).json({ message: "No Trips" });
        }

        // Extract user IDs from the driverTrips
        const userIds = driverTrips.map(trip => trip.userId);

        // Fetch user data for all unique user IDs
        const uniqueUserIds = Array.from(new Set(userIds));
        const userData = await user.find({ _id: { $in: uniqueUserIds } });

        // Create a map of user data for quick lookup
        const userMap = userData.reduce((map, user) => {
            map[user._id] = user;
            return map;
        }, {});

        // Attach user data to each trip
        const tripsWithUserData = driverTrips.map(trip => ({
            ...trip.toObject(),
            userData: userMap[trip.userId] || null
        }));

        // Respond with trips and user data
        res.status(200).json({ tripsWithUserData });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const driverRate = async function(req, res) {
    const { driverId, rate } = req.body;

    try {
        // Find the driver
        const driver = await detailTrip.findById(driverId);
        
        if (!driver) {
            return res.status(404).json({ message: "Driver Not Found" });
        }

        // Calculate the new average rating
        const oldRate = driver.rate || 0;
        const totalRatings = driver.totalRatings || 0;
        const newTotalRatings = totalRatings + 1;
        const newRate = ((oldRate * totalRatings) + rate) / newTotalRatings;

        // Update the driver's rating and totalRatings
        const updatedDriver = await detailTrip.findOneAndUpdate(
            { _id: driverId },
            { 
                rate: newRate,
                totalRatings: newTotalRatings
            },
            { new: true, useFindAndModify: false } 
        );

        res.status(200).json({ 
            message: "Rate Updated Successfully", 
            rate: updatedDriver.rate, 
            totalRatings: updatedDriver.totalRatings 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const userRate = async function(req, res) {
    const { userId, rate } = req.body;

    if (!userId || rate === undefined) {
        return res.status(400).json({ message: "userId and rate are required." });
    }

    try {
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }

        // Calculate the new average rating
        const oldRate = user.rate || 0;
        const totalRatings = user.totalRatings || 0;
        const newTotalRatings = totalRatings + 1;
        const newRate = ((oldRate * totalRatings) + rate) / newTotalRatings;

        // Update the user's rating and totalRatings
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { 
                rate: newRate,
                totalRatings: newTotalRatings
            },
            { new: true } // returns the updated document
        );

        res.status(200).json({
            message: "Rate Updated Successfully",
            rate: updatedUser.rate,
            totalRatings: updatedUser.totalRatings
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const addPrice = async function(req, res) {
    const { country, priceCar, motorocycle, priceVan, penfits } = req.body;

    try {
        // Check for missing fields
        if (!country || !priceCar || !motorocycle || !priceVan || !penfits) {
            return res.status(400).json({ message: "All Fields are Required" });
        }

        // Create a new price entry
        const newPrice = new PricesModel({
            country,
            priceCar,
            motorocycle,
            priceVan,
            penfits
        });

        // Save the new price in the database
        await newPrice.save();
        
        // Return success response with the newly created price entry
        res.status(201).json({ message: "Price Added Successfully", newPrice });
    } catch (error) {
        console.error(error); // Use console.error for logging errors
        res.status(500).json({ message: error.message });
    }
};

const getPrice = async function(req, res){
    try{
        const prices = await PricesModel.find();
        res.status(200).json(prices);
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: error.message});
    }
}

const updatePrice = async function(req, res) {
    const { country, priceCar, motorocycle, priceVan, penfits } = req.body;
    
    try {
        if (!country) {
            return res.status(400).json({ message: "Country not found" });
        }

        const updatedPrice = await PricesModel.findOneAndUpdate(
            { country: country },
            { priceCar, motorocycle, priceVan, penfits },
            { new: true }
        );

        if (!updatedPrice) {
            return res.status(404).json({ message: "Pricing data not found" });
        }

        res.status(200).json({ message: "Pricing Updated Successfully", updatedPrice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const deletePrice = async function(req, res) {
    const { country } = req.body;
    try {
        // Ensure the country field is provided
        if (!country) {
            return res.status(400).json({ message: "Country is required" });
        }

        // Attempt to delete the document
        const result = await PricesModel.findOneAndDelete({ country: country });

        // Check if a document was deleted
        if (!result) {
            return res.status(404).json({ message: "Pricing data not found" });
        }

        res.status(200).json({ message: "Price Deleted Successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// Calculate trip cost
const cost = async (req, res) => {
    const { km, country } = req.body;
    try {
        // Define cost rates per kilometer for each country

        const rates = {
            egypt: 15,     
            american: 2.0, 
            russian: 1.2,   
            italia: 2.5     
        };

        // Get the rate for the specified country
        const rate = rates[country.toLowerCase()];
        if (!rate) {
            return res.status(400).json({ message: 'Invalid country' });
        }

        // Calculate the cost
        const cost = km * rate;
        // Return the cost
        res.status(200).json({ cost: cost.toFixed(2) }); // Return cost rounded to 2 decimal places
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

const updateCost = async function(req, res) {
    const { tripId, cost } = req.body;

    try {
        // Validate input
        if (!tripId || !cost) {
            return res.status(400).json({ message: "All Data Required" });
        }

        // Update the trip's cost
        const trip = await bookModel.findOneAndUpdate(
            { _id: tripId },
            { cost: cost },
            { new: true } // To return the updated document
        );

        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }

        // Emit event to update cost in real-time
        if (global.io) {
            global.io.emit('trip-updated', trip);
        }

        // Respond with success message and the updated trip
        res.status(200).json({ message: "Cost Updated Successfully", trip });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const getTripsSocket = (socketIoInstance) => {
    io = getTripsSocket; // Set WebSocket instance
};

const allTrips = async function(req, res, io) {
    try {
        // Fetch all trips with status "pending" from the database
        const trips = await bookModel.find({ status: 'pending' });

        // Emit trips to all WebSocket clients
        if (io) {
            console.log("Emitting trips with status 'pending'");
            io.emit('tripsUpdate', trips);
        }

        // Send response with trips to the client who made the HTTP request
        res.status(200).json(trips);
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ message: 'INTERNAL SERVER ERROR' });
    }
};

const getlocation = async function(req, res){
    try{
        const locations = await DestDriver.find();
        if(!locations){
            res.status(404).json({message: "No Data"});
        }
        res.status(200).json(locations);
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: error.message});
    }
}

const costHandler = (io) => {
    io.on("connection", (socket) => {
        console.log("Connected To Update Cost");

        socket.on("update-price", async (data) => {
            const { tripId, cost } = data; // Extract tripId and cost from the received data

            if (!tripId || typeof cost !== 'number') {
                socket.emit('error', { message: 'tripId and valid cost are required' });
                return;
            }

            try {    
                const trip = await bookModel.findOneAndUpdate(
                    { _id: tripId },
                    { cost: cost },
                    { new: true }
                );

                if (!trip) {
                    socket.emit('error', { message: 'Trip not found' });
                    return;
                }

                // Emit the updated cost to all connected clients
                io.emit(`get-cost/${tripId}`, {
                    cost: trip.cost
                });
            } catch (error) {
                console.log('Error updating cost:', error);
                socket.emit('error', { message: 'Error when updating price' });
            }
        });
    });
};

const retrieveTrip = async function(req, res) {
    const { tripId } = req.body;
    try {
        const trip = await booking.findOne({ _id: tripId });
        if (!trip) {
            return res.status(404).json({ message: "Trip Not Found" });
        }
        const driver = trip.driverId;
        const driverDataLocation = await driverDestination.findOne({ driverId: driver });
        const driverData = await detailTrip.findOne({ _id: driver });
        res.status(200).json({ trip, driverDataLocation, driverData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const addAcceptedTrip = async function(req, res){
    const { tripId, driverId } = req.body;
    try{
        const addAccepted = new acceptedModel({
            tripId: tripId,
            driverId: driverId
        });
        await addAccepted.save();
        res.status(200).json({ addAccepted: addAccepted });
    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}


const getAccepteduser = async (req, res) => {
    const userId = req.params.id;

    try {
        // Define the statuses to check
        const statuses = ['accepted', 'arriving','Arriving', 'start'];

        // Find the driver in the acceptedModel or bookModel
        let driver = await acceptedModel.findOne({ userId: userId }).sort({_id:-1});

        if (!driver) {
            driver = await bookModel.findOne({ userId: userId, status: { $in: statuses } }).sort({_id:-1});
        }

        // If no driver is found, return a 404 error
        if (!driver) {
            return res.status(404).json({ message: "User not found in any status" });
        }

        // Extract tripId from the driver document
        const tripId = driver._id;
        console.log('tripId:', tripId);
        console.log('userId:', driver);
        // Find the updated booking using tripId
        const updatedBooking = await bookModel.findOne({ _id: tripId });
        if (!updatedBooking) {
            return res.status(404).json({ message: "Trip Not Found" });
        }
        console.log(driver)
        const driverId = driver.driverId;
        // Fetch additional data in parallel using Promise.all
        const [driverBook, userData, driverLocation] = await Promise.all([
            Driver.findOne({ _id: driverId }).populate('carColor'),
            User.findOne({ _id: userId }),
            driverDestination.findOne({ driverId: driverId }),
        ]);
        const conversation = await Conversation.findOne({
            participants: { $in: [userId] }
          });

        // Return the response with all the data
        return res.status(200).json({
            message: "Driver Found",
            updatedBooking,
            driverBook,
            driverLocation,
            userData,
            conversation
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getAccepted = async (req, res) => {
    const driverId = req.params.id;
    try {
      // Check for driver in 'accepted' status first
      let driver = await acceptedModel.findOne({ driverId: driverId });
  
      if (!driver) {
        // If not found in 'accepted' status, check in other statuses ('arriving' or 'start')
        driver = await bookModel.findOne({ driverId: driverId, status: { $in: ['arriving', 'start', 'Arriving', 'accepted'] } });
      }
  
      if (!driver) {
        return res.status(404).json({ message: "Driver not found in any status" });
      }
  
      const tripId = driver._id;
      const updatedBooking = await bookModel.findOne({ _id: tripId });
  
      if (!updatedBooking) {
        return res.status(404).json({ message: "Trip Not Found" });
      }
      const userId = updatedBooking.userId;
      const conversation = await Conversation.findOne({
        participants: { $in: [userId] }
      });
      // Use Promise.all to run multiple queries concurrently
      const [driverBook, userData, driverLocation] = await Promise.all([
        Driver.findOne({ _id: driverId }).populate('carColor'),
        user.findOne({ _id: userId }),
        driverDestination.findOne({ driverId: driverId })
      ]);
     const offer = await offers.findOne({ driverId }).sort({ createdAt: -1 });
     const userencodedPolyline = offer.userencodedPolyline;
       // Add userencodedPolyline to the updatedBooking object
        updatedBooking.userencodedPolyline = userencodedPolyline;
      return res.status(200).json({
        message: "Driver Found",
        updatedBooking,
        driverBook,
        driverLocation,
        userData,
        conversation
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
};
  

const userWallet = async function(req, res) {
    const id = req.params.id;
    const { value, driverId } = req.body;

    try {
        // Find the user by their ID
        const userFound = await User.findOne({ _id: id });
        if (!userFound) {
            return res.status(404).json({ message: "User Not Found" });
        }

        // Find the driver by their ID
        const driverFound = await Driver.findOne({ _id: driverId });
        if (!driverFound) {
            return res.status(404).json({ message: "Driver Not Found" });
        }

        // Update the user's wallet by setting it to 'value'
        const updatedUserWallet = await User.findOneAndUpdate(
            { _id: id },
            { wallet: userFound.wallet + value }, // Update with the new value
            { new: true } // Return the updated document
        );

        // Calculate the new driver's wallet by subtracting 'value'
        const updatedDriverWallet = await Driver.findOneAndUpdate(
            { _id: driverId },
            { wallet: driverFound.wallet - value }, // Subtract the 'value' from the driver's wallet
            { new: true } // Return the updated document
        );

        // If for any reason the driver wallet update fails
        if (!updatedDriverWallet) {
            return res.status(500).json({ message: "Failed to update driver wallet" });
        }

        // Respond with the updated user and driver wallet info
        res.status(200).json({
            message: "Wallets updated successfully",
            userWallet: updatedUserWallet.wallet,
            driverWallet: updatedDriverWallet.wallet
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

const getUserWallet = async function(req, res){
    const id = req.params.id;
    try{
        const result = await User.findOne({ _id: id });
        if(!result){
            res.status(404).json({ message: "User Not Found" });
        }
        const wallet = result.wallet;
        res.status(200).json({wallet});
    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const commision = async function(req, res) {
    const { driverId, value } = req.body;
    try {
        // Find the driver by ID
        const driver = await Driver.findOne({ _id: driverId });
        if (!driver) {
            return res.status(404).json({ message: "Driver Not Found" });
        }

        // Ensure the driver has a wallet field
        if (driver.wallet === undefined || driver.wallet === null) {
            return res.status(400).json({ message: "Wallet Not Found or Invalid for this Driver" });
        }

        // Ensure the value being deducted does not cause negative balance
        if (driver.wallet < value) {
            return res.status(400).json({ message: "Insufficient funds in wallet" });
        }

        // Subtract the commission from the driver's wallet
        const updatedDriver = await Driver.findOneAndUpdate(
            { _id: driverId },
            { $inc: { wallet: -value } },  // Use $inc to safely decrement the wallet
            { new: true }  // Return the updated document
        );

        res.status(200).json({ driver: updatedDriver });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const driverWallet = async function(req, res) {
    const id = req.params.id;
    const { value, userId } = req.body;

    try {
        // Find the driver by their ID
        const driverFound = await Driver.findOne({ _id: id });
        if (!driverFound) {
            return res.status(404).json({ message: "Driver Not Found" });
        }

        // Update the driver's wallet by adding the new value to the existing wallet balance
        const updatedDriverWallet = await Driver.findOneAndUpdate(
            { _id: id },
            { wallet: driverFound.wallet + value }, // Access 'wallet' field and add 'value'
            { new: true } // Return the updated document
        );

        // Find the user by their ID to subtract the value from their wallet
        const userFound = await User.findOne({ _id: userId });
        if (!userFound) {
            return res.status(404).json({ message: "User Not Found" });
        }

        // Update the user's wallet by subtracting 'value'
        const updatedUserWallet = await User.findOneAndUpdate(
            { _id: userId },
            { wallet: userFound.wallet - value }, // Subtract the value from user's wallet
            { new: true } // Return the updated document
        );

        // If for any reason the update for user fails
        if (!updatedUserWallet) {
            return res.status(500).json({ message: "Failed to update user wallet" });
        }

        // Respond with the updated driver and user wallet information
        res.status(200).json({
            message: "Wallets updated successfully",
            driverWallet: updatedDriverWallet.wallet,
            userWallet: updatedUserWallet.wallet
        });

    } catch (error) {
        // Log the error and send a response
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

const getdriverWallet = async function(req, res){
    const id = req.params.id;
    try{
        const result = await Driver.findOne({ _id: id });
        if(!result){
            res.status(404).json({ message: "Driver Not Found" });
        }
        const wallet = result.wallet;
        res.status(200).json({wallet});
    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const seeTrip = async function(req, res) {
    const { tripId, driverId } = req.body;
    try {
        const findTrip = await bookModel.findOne({ _id: tripId });
        const findDriverDestination = await driverDestination.findOne({ driverId: driverId });
        const findDriverData = await Driver.findOne({ _id: driverId }); // Corrected here
        
        if (!findTrip || !findDriverDestination || !findDriverData) {
            return res.status(404).json({ message: "trip or driverDest or driver not found" });
        }

        if (global.io) {
            global.io.emit(`see-driver/${tripId}`, {driverData: findDriverData});
        }

        res.status(200).json({ findTrip, findDriverDestination, findDriverData }); // Added a response here to complete the request
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const addVal = async function(req, res) {
    const { value } = req.body;

    // Check if the value is provided
    if (!value) {
        return res.status(400).json({ message: 'Value is required' });
    }
    try {
        // Create and save new value
        const newVal = new minValue({ value });
        await newVal.save();

        // Respond with success message
        res.status(201).json({ message: 'Value added successfully', data: newVal });
    } catch (error) {
        console.error(error);
        // Send error response
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

const update_min_val = async function(req, res){
    const { minval } = req.body;
    try{
        const updateValue = await minValue.findByIdAndUpdate(
            { _id: "66e983c6b0da07598db41460" },
            { value: minval },
            { new: true }
        );
        res.status(200).json({ message: 'Value updated successfully', data: updateValue });
    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const get_min_value = async function(req, res){
    try{
        const value = await minValue.find();
        res.status(200).json({ data: value });
    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const getDriverhistory = async function(req, res){
    const driverId = req.params.id;
    try {
        const history = await bookModel.find({ driverId: driverId });
        if(history.length === 0) {
            return res.status(404).json({ message: "No History For This Driver" });
        }
        res.status(200).json({ history: history });
    } catch(error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const getTripbyId = async function(req, res) {
    const tripId = req.params.id;
    try {
        const tripData = await bookModel.findOne({ _id: tripId });
        if (!tripData) {
            return res.status(404).json({ message: "No Trip Match" });  // Add return here
        }
        res.status(200).json({ trip: tripData });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const addComment = async function(req, res){
    const tripId = req.params.id;
    const { comment } = req.body;
    try{
        const addComment = await bookModel.findByIdAndUpdate(
            { _id: tripId },
            { comment: comment },
            { new: true }
        );
        if(!addComment){
            res.status(400).json({ message: "Error When Adding Comment" });
        }
        res.status(200).json({ trip: addComment });
    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const handleArrivingTime = async function(req, res){
    const { tripId, time } = req.body;
    try{
        const updateArrivingTime = await bookModel.findByIdAndUpdate(
            { _id: tripId },
            { arrivingTime: time },
            { new: true }
        );
        if(!updateArrivingTime){
            res.status(400).json({ message: "Error When Updating Arriving Time" });
        }
        res.status(200).json({ message: "Arriving Trip Upadted Successfully" });

    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const getTripDriver = async function(req, res) {
    try {
        const vehicleType = req.params.type; // Or req.body or req.params based on how you're sending it

        // Ensure vehicleType is provided
        if (!vehicleType) {
            return res.status(400).json({ message: "Vehicle type is required" });
        }

        // Find trips with 'pending' status and matching vehicleType
        const trips = await bookModel.find({ status: 'pending', vehicleType: vehicleType });
        if (!trips || trips.length === 0) {
            return res.status(404).json({ message: "No Trips Available for your vehicle type" });
        }

        // Emit trips to all connected clients with WebSocket
        if (global.io) {
            global.io.emit('get-trips', { trips: trips });
        }

        res.status(200).json({ trips: trips });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'INTERNAL SERVER ERROR' });
    }
};
const subModel = require('../../model/subscription.js');
const walletSystemModel = require('../../model/Wallet2.js');
const { disconnect } = require('process');
const offer = async function (req, res) {
    const { offer, country, driverId, time, distance, tripId, userId , userencodedPolyline} = req.body;

    try {
        // Fetch necessary data
        const [tripDistance, driver, user, subDocument, walletSystem] = await Promise.all([
            bookModel.findOne({ _id: tripId }),
            Driver.findOne({ _id: driverId }),
            User.findOne({ _id: userId }),
            subModel.findOne({ driverId: driverId }),
            walletSystemModel.findOne({ _id: "678cc8adf1d3a9b7b6f7174e" }) // Wallet system data
        ]);

        if (!driver) return res.status(404).json({ message: "Driver not found" });
        if (!user) return res.status(404).json({ message: "User not found" });

        const driverWalletType = driver.walletType;
        const subDays = subDocument?.days || 0;

        // System 1: Commission based on trip distance
        if (driverWalletType === "1") {
            const commission = await getCommission(country, parseFloat(tripDistance?.distance) || 0, tripDistance.cost);

            // Calculate the remaining wallet balance after deducting the commission
            const remainingWalletBalance = driver.wallet - commission;

            // Check if the remaining wallet balance is below -100
            if (remainingWalletBalance < -100) {
                return res.status(400).json({ 
                    message: "Cannot add offer: Commission would cause wallet balance to fall below -100" 
                });
            }

            // Check if the current wallet balance is below -100
            if (driver.wallet < -100) {
                return res.status(400).json({ 
                    message: "Cannot add offer: Wallet balance is already below -100" 
                });
            }

            // Allow drivers with a wallet balance of 0 to add offers
            if (driver.wallet === 0 && remainingWalletBalance >= -100) {
                // Proceed to add the offer
            } else if (driver.wallet < -100) {
                return res.status(400).json({ 
                    message: "You cannot exceed limit -100"
                });
            }
        }

        // System 2: Commission based on cost and profit percentage
        if (driverWalletType === "2") {
            if (subDays === 0) {
                return res.status(400).json({ message: "Renew your subscription to add offers" });
            }

            const cost = tripDistance?.cost || 0;
            let commission = (walletSystem.profit) / 100 * cost;
            if ((driver.wallet - commission) < -100) {
                return res.status(400).json({ message: "Recharge your wallet to add an offer" });
            }
        }
        console.log("userencodedPolyline", userencodedPolyline);
        // Upsert the offer
        const upsertedOffer = await offerModel.findOneAndUpdate(
            { tripId, driverId },
            { offer, driverId, time, distance, tripId, userId, userencodedPolyline: userencodedPolyline|| "" },
            { new: true, upsert: true }
        );

        // Prepare notification
        const notificationMessage = {
            title: 'New Trip Available',
            body: `An offer has been made by the driver.`,
        };

        const options = {
            timeZone: 'Africa/Cairo',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
        };

        const formattedOffer = {
            ...upsertedOffer.toObject(),
            createdAt: new Date(upsertedOffer.createdAt).toLocaleString('en-US', options),
            updatedAt: new Date(upsertedOffer.updatedAt).toLocaleString('en-US', options),
        };

        // Emit event and send notification
        if (global.io) {
            global.io.emit(`newOffer/${tripId}`, { offer: formattedOffer, driver });
            sendNotification(user.userFCMToken, notificationMessage);
        }

        return res.status(200).json({ offer: formattedOffer, driver });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

// Optimized getCommission Function
async function getCommission(country, distance, cost) {
    try {
        const levels = await Promise.all([
            Level1.findOne({ country }),
            Level2.findOne({ country }),
            Level3.findOne({ country }),
            Level4.findOne({ country }),
        ]);
        console.log(Level1);


        let commission = 0;
        console.log(distance);
        if (distance < 20) {
            console.log("Level 1 commission applied");
            commission = ((levels[0]?.penfits || 0) / 100) * cost;
        } else if (distance < 40) {
            console.log("Level 2 commission applied");
            commission = ((levels[1]?.penfits || 0) / 100) * cost;
        } else if (distance < 60) {
            console.log("Level 3 commission applied");
            commission = ((levels[2]?.penfits || 0) / 100) * cost;
        } else {
            console.log("Level 4 commission applied");
            commission = ((levels[3]?.penfits || 0) / 100) * cost;
        }

        console.log(`Commission calculated: ${commission}, Cost: ${cost}, Percentage: ${(levels[0]?.penfits || 0)}%`);
        return commission;
    } catch (error) {
        console.error("Error fetching commission levels:", error);
        throw new Error("Failed to calculate commission");
    }
}

const chating = async function (req, res) {
    const { conversationId, from, to, msg, media, mediaType } = req.body;

    try {
        // Validate required fields
        if (!conversationId || !from || !to || !msg) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Ensure conversation exists
        let conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Create a new message document
        const newMessage = new Message({
            conversationId,
            from,
            to,
            msg,
            media,
            mediaType
        });

        // Save the message
        await newMessage.save();

        // Emit the message to the conversation room via Socket.IO
        if (global.io) {
            global.io.emit(`newMessage/${conversationId}`, { message: 'Message sent', data: newMessage });
        }

        res.status(201).json({ message: 'Message sent', data: newMessage });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: error.message });
    }
};

const getDescription = async(req, res)=>{
    try{
        const desc1 = "commission is 10%";
        const desc2 = "subscription 50EGP and comission 5 %";
        return res.status(200).json({desc1, desc2});
    }
    catch(error){
        console.log(error);
        return res.status(500).json({message: error.message});
    }
}


module.exports = costHandler;
module.exports = allTrips;
module.exports = {
    findDrivers,
    bookTrip,
    acceptTrip,
    updateStatus,
    cost,
    startTrip,
    canceledTrip,
    endTrip,
    calculateCost,
    cancelledTripbeforestart,
    allTrips,
    getTripsSocket,
    arriving,
    history,
    driverRate,
    getlocation,
    costHandler,
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
};