const Discount = require('../model/offersDiscount');
const Trips = require('../model/booking/userBooking');
const Users = require('../model/regestration/userModel');
const Drivers = require('../model/regestration/driverModel');
const createUserOptions = async (req, res) => {
    try {
        const { numberOftrip, days, amount, bool, messageUser, messageDriver } = req.body;

        if (!numberOftrip || !days || !amount) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const newDiscount = new Discount({
            numberOftrip,
            days,
            amount,
            bool,
            messageUser,
            messageDriver,
        });

        await newDiscount.save();

        return res.status(201).json({
            message: "User options created successfully",
            newDiscount
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateMessageUser = async (req, res) => {
    try {
        const { discountId } = req.params; 
        const { text, sender } = req.body; 

        if (!text) {
            return res.status(400).json({ message: "Message text is required" });
        }

        const updatedDiscount = await Discount.findByIdAndUpdate(
            discountId,
            { messageUser: { text, sender } },
            { new: true, runValidators: true }
        );

        if (!updatedDiscount) {
            return res.status(404).json({ message: "Discount not found" });
        }

        return res.status(200).json({
            message: "User message updated successfully",
            updatedMessage: updatedDiscount.messageUser,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const updateMessageDriver = async (req, res) => {
    try {
        const { discountId } = req.params;
        const { text, sender } = req.body;

        if (!text) {
            return res.status(400).json({ message: "Message text is required" });
        }

        const updatedDiscount = await Discount.findByIdAndUpdate(
            discountId,
            { messageDriver: { text, sender } },
            { new: true, runValidators: true }
        );

        if (!updatedDiscount) {
            return res.status(404).json({ message: "Discount not found" });
        }

        return res.status(200).json({
            message: "Driver message updated successfully",
            updatedMessage: updatedDiscount.messageDriver,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getOffers = async(req, res)=>{
    try{
        const discount = await Discount.find();
        return res.status(200).json({discount});
    }
    catch(error){
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
}

const updateOption = async (req, res) => {
    try {
        const { id, numberOftrip, days, amount, bool } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Option ID is required" });
        }

        const updatedOption = await Discount.findByIdAndUpdate(
            id,
            { numberOftrip, days, amount, bool },
            { new: true, runValidators: true }
        );

        if (!updatedOption) {
            return res.status(404).json({ message: "Option not found" });
        }

        return res.status(200).json({ message: "Options updated successfully", updatedOption });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

const increaseWallet = async (type) => {
    try {
        let Model, discountId;
        console.log(`Updating wallets for: ${type}`);

        if (type === "user") {
            Model = Users;
            discountId = "67b0ab0de5b7c6a23dbc461a";
        } else if (type === "driver") {
            Model = Drivers;
            discountId = "67b0ab10e5b7c6a23dbc461d";
        } else {
            console.error("Invalid type. Use 'user' or 'driver'.");
            return;
        }

        // Fetch discount document
        const disc = await Discount.findById(discountId);
        if (!disc) {
            console.error("Discount not found");
            return;
        }

        const amount = disc.amount;
        const requiredTrips = disc.numberOftrip;
        const days = disc.days;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Fetch all users or drivers, excluding problematic fields
        const allUsersOrDrivers = await Model.find().select("-carColor");

        await Promise.all(
            allUsersOrDrivers.map(async (user) => {
                try {
                    // Count trips for this specific user/driver
                    const driverTrips = await Trips.countDocuments({
                        driverId: user._id, // Ensure correct field matches
                        createdAt: { $gte: startDate },
                    });

                    if (driverTrips >= requiredTrips) {
                        if (!user.wallet) user.wallet = 0; // Ensure wallet field exists
                        user.wallet += amount;
                        await user.save();
                        console.log(`Wallet updated for ${user._id} (Trips: ${driverTrips})`);
                    }
                } catch (err) {
                    console.error(`Error updating wallet for ${user._id}:`, err.message);
                }
            })
        );

        console.log(`${type} wallets updated successfully`);
    } catch (error) {
        console.error("Error updating wallets:", error);
    }
};

const updateBooleanvalueUser = async(req, res)=>{
    try{
        const { bool, type } = req.body;
        const updateBool = await Discount.findOneAndUpdate(
            { _id: "67b0ab0de5b7c6a23dbc461a" },
            { bool: bool },
            { new: true }
        );
        if(!updateBool){
            return res.status(400).json({message: "Failed to update Boolean user"});
        }
        if(bool === true){
            await increaseWallet(type);
        }
        return res.status(200).json({message: "Update user bollean successfully", bool: updateBool});
    }
    catch(err){
        console.log(err);
        return res.status(500).json({message: err.message});
    }
}

const updateBooleanvalueDriver = async(req, res)=>{
    try{
        const { bool, type } = req.body;
        const updateBool = await Discount.findOneAndUpdate(
            { _id: "67b0ab10e5b7c6a23dbc461d" },
            { bool: bool },
            { new: true }
        );
        if(!updateBool){
            return res.status(400).json({message: "Failed to update Boolean user"});
        }

        if(bool === true){
            await increaseWallet(type);
        }

        return res.status(200).json({message: "Update user bollean successfully", bool: updateBool});
    }
    catch(err){
        console.log(err);
        return res.status(500).json({message: err.message});
    }
}

const getDriverCounterUser = async (req, res) => {
    const userId = req.params.id;
    
    try {
        // Fetch all trips of the driver
        const driverTrips = await Trips.find({ userId, status: 'end'});
        // console.log(driverTrips.length)
        // Get the discount document
        const disc = await Discount.findOne({ _id: "67b0ab0de5b7c6a23dbc461a" });
        if(disc.bool === false){
            return res.status(400).json({ message: "No Offers Found" });
        }
        // Extract the last message update time
        const messageUpdateTime = new Date(disc.messageUser.updatedAt);
        
        // Get the number of days from the discount
        const daysLimit = disc.days;

        // Count trips that were created within the allowed days
        const tripCount = driverTrips.filter(trip => {
            const tripCreatedAt = new Date(trip.createdAt);
            const diffInDays = (tripCreatedAt - messageUpdateTime) / (1000 * 60 * 60 * 24);
            return diffInDays <= daysLimit && diffInDays >= 0; // Ensure only future trips are counted
        }).length;

        return res.json({ tripCount, disc:disc });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};

const getDriverCounter = async (req, res) => {
    const driverId = req.params.id;
    
    try {

        // Fetch all trips of the driver
        const driverTrips = await Trips.find({ driverId, status: 'end'});
        
        // Get the discount document
        const disc = await Discount.findOne({ _id: "67b0ab10e5b7c6a23dbc461d" });
        console.log(disc);
        if(disc.bool === false){
            return res.status(400).json({ message: "No Offers Found" });
        }
        // Extract the last message update time
        const messageUpdateTime = new Date(disc.messageUser.updatedAt);
        
        // Get the number of days from the discount
        const daysLimit = disc.days;

        // Count trips that were created within the allowed days
        const tripCount = driverTrips.filter(trip => {
            const tripCreatedAt = new Date(trip.createdAt);
            const diffInDays = (tripCreatedAt - messageUpdateTime) / (1000 * 60 * 60 * 24);
            return diffInDays <= daysLimit && diffInDays >= 0; // Ensure only future trips are counted
        }).length;

        return res.json({ tripCount, disc:disc });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: err.message });
    }
};


const invitationModel = require('../model/invite.model.js');

const generateCoupon = async (req, res) => {
    const { userId, type } = req.body;

    try {
        const randomCoupon = Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit random coupon
        const newInvite = new invitationModel({
            sender: userId,
            type: type,
            receivers: [], // Fixed typo: "receviers" -> "receivers"
            text: randomCoupon
        });

        await newInvite.save();
        return res.status(200).json({
            message: "Invite created successfully",
            invite: newInvite
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};



// Get invite by user ID
const getInvite = async (req, res) => {
    const { userId } = req.params; // Fixed: Use req.params.userId instead of req.params.id

    try {
        const invitations = await invitationModel.findOne({ sender: userId });
        if (!invitations) {
            return res.status(404).json({ message: "No invitations found" }); // Changed status code to 404 (Not Found)
        }

        return res.status(200).json({ invitations });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

// Apply an invite
const applyInvite = async (req, res) => {
    const { id, text, type } = req.body;

    try {
        const model = type === 'user' ? "userId" : "driverId";
        
        const trips = await Trips.find({ [model]: id, status: 'end' }); // ✅ Fixed query
        const invite = await invitationModel.findOne({ text: text });

        if (!invite) {
            return res.status(404).json({ message: "Invite not found" });
        }

        console.log(typeof(invite.receivers));
        if (trips.length === 0) {
            invite.receivers.push(id);
            await invite.save();
        } else if (trips.length === 1) {
            const userIndex = invite.receivers.indexOf(id);
            if (userIndex !== -1) {
                invite.receivers.splice(userIndex, 1);

                const user = type === 'user' ? await Users.findById(id) : await Drivers.findById(id);
                if (user) {
                    user.wallet = (user.wallet || 0) + 30;
                    await user.save();
                }

                await invite.save();
            }
        } else {
            return res.status(400).json({ message: "Your Wallet Increased Before" });
        }

        return res.status(200).json({ message: "Your wallet will increase after the first trip" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};


const reqModel = require('../model/reqgetmoney.model.js');
const User = require('../model/regestration/userModel');

const req = async (req, res) => {
    const { id, amount, type } = req.body;

    try {
        if (!['user', 'driver'].includes(type)) {
            return res.status(400).json({ message: "Invalid request type" });
        }

        const requestData = {
            amount,
            ...(type === 'user' ? { userId: id } : { driverId: id })
        };

        const addReq = new reqModel(requestData);
        await addReq.save();

        return res.status(200).json({ message: "Request sent successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};


const getReq = async (req, res) => {
    try {
        // Use .populate() to fetch referenced documents
        const requests = await reqModel.find()
            .populate('userId') // Populate the 'userId' field
            .populate('driverId'); // Populate the 'driverId' field

        return res.status(200).json({ requests: requests });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal Server Error' }); // User-friendly error message
    }
};


const deleteReq = async (req, res) => {
    const { id } = req.body;

    try {
        // Find and delete the document by ID
        const deletedReq = await reqModel.findOneAndDelete({ _id: id });

        // Check if the document was found and deleted
        if (!deletedReq) {
            return res.status(404).json({ message: "Document not found" }); // More specific error message
        }

        // Return success response
        return res.status(200).json({ message: "Document deleted successfully" }); // Fixed typo (tes -> res)
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal Server Error" }); // User-friendly error message
    }
};


const increase = async (req, res) => {
    const { text, id, type } = req.body;
    try {
        const formattedText = text.replace(/\s+/g, '').toLowerCase(); // Remove spaces and convert to lowercase
        
        if (type === 'user') {
            if (formattedText === "minanader") {
                const userUpdate = await Users.findOneAndUpdate(
                    { _id: id },
                    { $inc: { wallet: 30 } }, // Use $inc for incrementing wallet
                    { new: true }
                );
                return res.status(200).json({ message: "Coupon added successfully" });
            }
            return res.status(400).json({message: "coupon not valid"})

        } else {
            if(formattedText === "minanader"){
                const driverUpdate = await Drivers.findOneAndUpdate(
                    { _id: id },
                    { $inc: { wallet: 30 } }, // Use $inc for incrementing wallet
                    { new: true }
                );
                return res.status(200).json({ message: "Coupon added successfully" });
            }
            return res.status(400).json({message: "coupon not valid"})
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }
};


module.exports = {
    createUserOptions,
    updateOption,
    // calculateTripsUser,
    // calculateTripsDrivers,
    updateMessageUser,
    updateMessageDriver,
    updateBooleanvalueUser,
    updateBooleanvalueDriver,
    getDriverCounter,
    getDriverCounterUser,
    updateBooleanvalueDriver,
    generateCoupon,
    getInvite,
    applyInvite,
    req,
    increase,
    getReq,
    deleteReq,
    getOffers
};
