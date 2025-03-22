const { Server } = require("socket.io");
const mongoose = require('mongoose');
const bookModel = require('../../model/booking/userBooking.js');
const DestDriver = require('../../model/booking/driversDestination.js');

const tripsHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('Client connected');

        // Monitor new trips added to the database
        bookModel.watch([{ $match: { operationType: 'insert' } }]).on('change', async (data) => {
            try {
                // Get all trips with status 'pending'
                const trips = await bookModel.find({ status: 'pending' });

                // Get all drivers with location details
                const drivers = await DestDriver.find({});

                // Loop through each driver to find nearby trips
                for (const driver of drivers) {
                    if (!driver || !driver.location || !driver.location.coordinates) {
                        console.log(`Driver with ID ${driver.driverId} not found or location data is missing`);
                        continue;
                    }

                    const [driverLongitude, driverLatitude] = driver.location.coordinates;

                    // Filter trips based on proximity to the driver's location
                    const nearbyTrips = trips.filter((trip) => {
                        if (!trip.pickupLocation || !trip.pickupLocation.coordinates) {
                            return false;
                        }

                        const [tripLongitude, tripLatitude] = trip.pickupLocation.coordinates;

                        // Calculate distance between driver and trip pickup location
                        const distance = calculateDistance(driverLatitude, driverLongitude, tripLatitude, tripLongitude);

                        // Get the maximum allowable distance from the settings
                        const maxDistance = 5000; // Default to 5km if no specific setting

                        return distance <= maxDistance;
                    });

                    // If there are nearby trips, send them to the driver
                    if (nearbyTrips.length > 0) {
                        const tripsSocket = nearbyTrips.map((trip) => trip.toObject());
                        console.log('Trips: ', tripsSocket);
                        socket.emit(`get-trips-socket/${driver.driverId}`, { trips: tripsSocket });
                    }
                }
            } catch (error) {
                console.log('Error:', error);
            }
        });
    });
};

// Helper function to calculate distance between two coordinates using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRadians = (degree) => (degree * Math.PI) / 180;
    const earthRadiusKm = 6371;

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c * 1000; // Return distance in meters
}

module.exports = tripsHandler;
