const bookModel = require('../../../model/booking/userBooking');
const driverDestination = require('../../../model/booking/driversDestination');
const detailTrip = require('../../../model/regestration/driverModel');
const pendingModel = require('../../../model/booking/pendingTrips');
const mongoose = require('mongoose');  // Ensure mongoose is imported

// const tripStatusHandler = (io) => {
//     io.on('connection', (socket) => {
//         console.log('A user connected for trip status updates');

//         // Handle acceptTrip event  
//         socket.on('acceptTrip', async (data) => {
//             const tripId = data.tripId ? new mongoose.Types.ObjectId(data.tripId) : null;
//             const driverId = data.driverId ? new mongoose.Types.ObjectId(data.driverId) : null;

//             try {
//                 const tripBooking = await bookModel.findById(tripId);

//                 if (!tripBooking) {
//                     socket.emit('acceptTripResponse', { error: 'Trip not found' });
//                     return;
//                 }

//                 // Update the status to 'accepted'
//                 tripBooking.status = 'accepted';

//                 // Delete the trip from pending model using _id
//                 const deletingPendingTrip = await pendingModel.findByIdAndDelete(tripId); 
//                 if (!deletingPendingTrip) {
//                     console.warn(`Pending trip with _id ${tripId} not found in pendingModel`);
//                 }

//                 const findDriver = await detailTrip.findOne({ _id: driverId });
//                 const driverLocation = await driverDestination.findOne({ driverId });

//                 if (!findDriver || !driverLocation) {
//                     socket.emit('acceptTripResponse', { error: 'Driver or Driver location not found' });
//                     return;
//                 }

//                 // Save the updated booking
//                 const updatedBooking = await tripBooking.save();

//                 // Notify the client who made the request
//                 socket.emit('acceptTripResponse', { updatedBooking, findDriver, driverLocation });

//                 // Notify all clients about the trip update
//                 io.emit('tripUpdated', { updatedBooking, findDriver, driverLocation });

//             } catch (error) {
//                 console.error('Error in acceptTrip handler:', error.message);
//                 socket.emit('acceptTripResponse', { error: 'An error occurred while processing the trip' });
//             }
//         });

//         socket.on('disconnect', () => {
//             console.log('User disconnected');
//         });
//     });
// };

//const mongoose = require('mongoose');  // Ensure mongoose is imported
// socket-io-instance.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Create an Express application
const app = express();

// Create an HTTP server
const server = http.createServer(app);

const io = socketIo(server, { transports: ['websocket'] });

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

});

module.exports = io;

const driverDataHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('Connection to get driver data');
        
        socket.on('getDriverData', async (data) => {
            // Extract and convert driverId to ObjectId
            const driverId = data.driverId ? new mongoose.Types.ObjectId(data.driverId) : null;

            if (!driverId) {
                socket.emit('driverDataResponse', { error: 'Valid Driver ID is required' });
                return;
            }

            try {
                // Fetch the driver and driver location by their ObjectId
                const findDriver = await detailTrip.findOne({ _id: driverId });
                const driverLocation = await driverDestination.findOne({ driverId: driverId });

                if (!findDriver) {
                    socket.emit('driverDataResponse', { error: 'Driver not found' });
                    return;
                }
                
                if (!driverLocation) {
                    socket.emit('driverDataResponse', { error: 'Driver location not found' });
                    return;
                }

                // Send the driver data back to the client
                socket.emit('driverDataResponse', { findDriver, driverLocation });

            } catch (error) {
                console.error('Error in getDriverData handler:', error.message); 
                socket.emit('driverDataResponse', { error: 'An error occurred while fetching the driver data' });
            }
        });
    });
};


module.exports = {
    //tripStatusHandler,
    driverDataHandler,
    io
};
