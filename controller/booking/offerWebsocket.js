const offerModel = require('../../model/booking/offers');
const Driver = require('../../model/regestration/driverModel.js');
const sendNotification = require('../../firebase.js');
const User = require('../../model/regestration/userModel.js');
const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected');

        // Handle WebSocket offer addition
        socket.on('addOffer', async (data) => {
            const { tripId, driverId, offer, userId } = data;
            if (!tripId || !driverId || !offer) {
                socket.emit('error', { message: 'tripId, driverId, and offer are required' });
                return;
            }
                const user = await User.findOne({ _id: userId });
                const userFCMToken = user.userFCMToken;
            try {
                // Upsert the offer
                const upsertedOffer = await offerModel.findOneAndUpdate(
                    { tripId, driverId },
                    { offer },
                    { new: true, upsert: true } // Return the updated document and insert if it doesn't exist
                );
                const notificationMessage = {
                    title: 'New Trip Available',
                    body: `An Offer For You From Driver.`,
                };
                
                // Send the FCM notification to the driver
                //sendNotification(userFCMToken, notificationMessage);
                const driver = await Driver.findById(driverId);
                if (!driver) {
                    socket.emit('error', { message: 'Driver not found' });
                    return;
                }

                // Convert timestamps to Egypt time zone
                const options = { 
                    timeZone: 'Africa/Cairo', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: 'numeric', 
                    minute: 'numeric', 
                    second: 'numeric' 
                };

                const formattedOffer = {
                    ...upsertedOffer.toObject(),
                    createdAt: new Date(upsertedOffer.createdAt).toLocaleString('en-US', options),
                    updatedAt: new Date(upsertedOffer.updatedAt).toLocaleString('en-US', options)
                };

                // Emit offerAdded event via WebSocket
                if (io) {
                    io.emit(`offerAdded/${tripId}`, { offer: formattedOffer, driver });
                    sendNotification(userFCMToken, notificationMessage);
                }

            } catch (error) {
                console.error('Error adding offer:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    });
};

module.exports = socketHandler;
