const mongoose = require('mongoose');
const destDriver = require('../../model/booking/driversDestination');
const Trips = require('../../model/booking/userBooking');
const geolib = require('geolib');
const Distance = require('../../model/booking/maxDistance');

// Function to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    return geolib.getDistance(
        { latitude: lat1, longitude: lon1 },
        { latitude: lat2, longitude: lon2 }
    );
};

const locationHandler = (io) => {
    io.on('connection', (socket) => {
        console.log("Driver connected to update location");

        socket.on('updateLocation', async (data) => {
            console.log("UpdateLocation maher 3ml emit");
            try {
                const { driverId, longitude, latitude, tripId } = data;

                if (!driverId || typeof longitude !== 'number' || typeof latitude !== 'number') {
                    socket.emit('error', { message: 'Driver ID, longitude, and latitude are required and must be valid numbers' });
                    return;
                }

                if (!mongoose.isValidObjectId(driverId)) {
                    socket.emit('error', { message: 'Invalid Driver ID' });
                    return;
                }

                // Update driver's location in the database
                const result = await destDriver.findOneAndUpdate(
                    { driverId },
                    { location: { type: "Point", coordinates: [longitude, latitude] } },
                    { new: true }
                );

                if (!result) {
                    socket.emit('error', { message: 'Driver not found or failed to update location' });
                    return;
                }

                // Emit updated location to the driver
                if(global.io){
                    io.emit(`location-updated/${driverId}`, {
                        driverId,
                        location: result.location,
                    });
                    console.log("Youssef 3ml on");
                }
                

                // Retrieve maxDistance from settings
                const distanceSetting = await Distance.findOne({});
                const maxDistance = distanceSetting ? distanceSetting.maxDistance : 5000; // Default to 5km

                // Handle active trip and check proximity to destination
                if (tripId) {
                    if (!mongoose.isValidObjectId(tripId)) {
                        socket.emit('error', { message: 'Invalid Trip ID' });
                        return;
                    }

                    const trip = await Trips.findOne({ _id: tripId, status: 'active' }).select('destinationLocation vehicleType');
                    if (!trip) {
                        socket.emit('error', { message: 'No active trip found for the provided Trip ID' });
                        return;
                    }

                    if (!trip.destinationLocation || !trip.destinationLocation.coordinates) {
                        socket.emit('error', { message: 'Invalid destination coordinates in the trip' });
                        return;
                    }

                    const [destLongitude, destLatitude] = trip.destinationLocation.coordinates;
                    const distanceToDestination = calculateDistance(latitude, longitude, destLatitude, destLongitude);

                    console.log(`Driver ${driverId} is ${distanceToDestination} meters away from destination.`);

                    // If the driver is within maxDistance of the destination
                    if (distanceToDestination <= maxDistance) {
                        console.log(`Driver ${driverId} is within ${maxDistance} meters of the destination.`);

                        // Find new trips near the driver's location
                        const newTrips = await Trips.aggregate([
                            {
                                $geoNear: {
                                    near: {
                                        type: "Point",
                                        coordinates: [longitude, latitude],
                                    },
                                    distanceField: "distance",
                                    spherical: true,
                                    maxDistance: maxDistance,
                                    query: { status: 'pending', vehicleType: trip.vehicleType },
                                },
                            },
                        ]);

                        // Notify driver about new trips
                        socket.emit('newTrips', { trips: newTrips });
                        console.log(`Driver ${driverId} notified about ${newTrips.length} new trip(s).`);
                    }
                }
            } catch (error) {
                console.error('Error updating location:', error);
                socket.emit('error', { message: 'Error updating location' });
            }
        });
    });
};

module.exports = locationHandler;
