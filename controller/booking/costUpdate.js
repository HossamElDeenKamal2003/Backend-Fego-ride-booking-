const mongoose = require('mongoose');
const bookModel = require('../../model/booking/userBooking');
const offers = require('../../model/booking/offers.js')

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

module.exports = costHandler;