const bookModel = require('../../model/booking/userBooking');


// Update booking status
const updateBookingStatus = async (req, res) => {
    const { bookingId, status } = req.body;

    try {
        // Find the booking by ID and update its status
        const updatedBooking = await bookModel.findByIdAndUpdate(
            bookingId,
            { status: status },
            { new: true } // Return the updated document
        );

        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.status(200).json({ message: 'Booking status updated successfully', booking: updatedBooking });
    } catch (error) {
        console.error('Error updating booking status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    updateBookingStatus,
};


module.exports = {
    updateStatus,
}