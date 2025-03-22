const mongoose = require('mongoose');

function dateHandle(){
    const date = new Date(new Date().toLocaleString("en-US", { timeZone: 'Africa/Cairo' }));

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    const finalDate = `${day}-${month}-${year}  ${hour}:${minute}:${second}`;
    return finalDate;
}

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    uniqueId: {
        type: String,
        unique: true
    },
    country:{
        type: String
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver'
    },
    locationName: {
        type: String,
        required: true
    },
    distance: {
        type: String,
    },
    username: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    pickupLocationName: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true,
    },
    pickupLocation: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    destinationLocation: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
    },
    carModel: {
        type: String
    },
    vehicleType: {
        type: String
    },
    status: {
        type: String, 
        default: 'Pending' 
    },
    phoneNumber: {
        type: String
    },
    cost: {
        type: Number,
    },
    abirdPrice: {
        type: Number,
        default: 0
    },
    date: {
        type: String,
        default: dateHandle()
    },
    comment: {
        type: String,
        default: ""
    },
    totalRatings: {
        type: Number,
        default: 0,
    },
    rate:{
        type: Number,
        default: 0,
    },
    arrivingTime: {
        type: String,
        default: null
    },
    comfort: {
        type: Boolean,
        default: false
    },
    duration: {
        type: String
    },
    encodedPolyline: {
        type: String
    },
    paymentType: {
        type: String,
    },
    commision: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now // Automatically sets the creation date
    },
   
}, { timestamps: true });

// Create a 2dsphere index on the pickupLocation field
bookingSchema.index({ pickupLocation: '2dsphere' });
bookingSchema.index({ destinationLocation: '2dsphere' });

// Pre-save hook to generate uniqueId
bookingSchema.pre('save', async function(next) {
    if (!this.isNew) {
        return next();
    }

    const lastBooking = await this.constructor.findOne().sort({ _id: -1 }).select('uniqueId').lean();

    let nextUniqueId = 'A1';

    if (lastBooking && lastBooking.uniqueId) {
        const lastUniqueId = lastBooking.uniqueId;
        const letter = lastUniqueId.charAt(0);
        const number = parseInt(lastUniqueId.slice(1), 10);

        // Check if number can be incremented
        if (number < 9) {
            nextUniqueId = `${letter}${number + 1}`;
        } else {
            // Increment the letter and reset the number
            const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
            nextUniqueId = `${nextLetter}1`;
        }
    }

    this.uniqueId = nextUniqueId;
    next();
});

const bookModel = mongoose.model('Booking', bookingSchema);

module.exports = bookModel;
