const usersModel = require('../../model/regestration/userModel');
const driversModel = require('../../model/regestration/driverModel');
const driverDest = require('../../model/booking/driversDestination');
const tripsModel = require('../../model/booking/userBooking');
const distance = require('../../model/booking/maxDistance');
const properities = require('../../model/booking/tripProperity');
const bookModel = require('../../model/booking/userBooking');
const pannerModel = require('../../model/booking/panner');
const walletSystem = require('../../model/Wallet2');
const addWalletsystem = async(req, res)=>{
    const { subScription, profit } = req.body;
    try{
        const newSystem = new walletSystem({
            subScription,
            profit
        });
        await newSystem.save();
        return res.status(200).json({newSystem: newSystem})
    } 
    catch(error){
        console.log(error);
        return res.status(500).json({message: error.message});
    }
};

const updateSystemwallet = async (req, res) => {
    const { subScription, profit } = req.body;
    try {
        const updateSystemwallet = await walletSystem.findOneAndUpdate(
            { _id: "678cc8adf1d3a9b7b6f7174e" }, // Query
            { subScription, profit },           // Update fields
            { new: true }                       // Options
        );

        if (!updateSystemwallet) {
            return res.status(400).json({ message: "Error While Updating System Wallet" });
        }

        return res.status(200).json({ data: updateSystemwallet });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

const updateProperity = async function(req, res) {
    const { time, distance } = req.body;
    try {
        const properity = await properities.findOne(); // Get the first document
        
        if (!properity) {
            return res.status(404).json({ message: "Properities not found" });
        }

        properity.time = time;
        properity.distance = distance;

        await properity.save();

        res.status(200).json({ message: "Updated Properities Successfully", properity });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const getProperity = async function(req, res){
    try{
        const properity = await properities.findOne();
        if(!properity){
            res.status(404).json({ message: "No Properity for Trip"});
        }
        res.status(200).json(properity);
    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: error.message});
    }
}

const addProperites = async function(req, res) {
    try {
        const newProp = new properities({
            time: 10, // You can use values from req.body if needed
            distance: 50
        });
        
        await newProp.save();

        // Send a success response
        res.status(201).json({ message: "Properities added successfully", newProp });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// get all users
const getAllUsers = async function(req,res){
    try{
        const users = await usersModel.find();
        res.json(users);
    }
    catch(error){
        console,log(error);
        res.status(500).json({message: error.message});
    }
}
// get all drivers
const getAllDrivers = async function(req,res){
    try{
        const drivers = await driversModel.find();
        res.status(200).json(drivers);
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: error.message}); // internal server error
    }
}
// delete user by _id in mongodb, get id by params
const deleteUser = async function(req, res){
    const userId = req.params.id;
    try {
        const deletedUser = await usersModel.findOneAndDelete({_id: userId});
        if (!deletedUser) {
            return res.status(404).json({message: "User not found"});
        }
        res.status(200).json({message: "User Deleted Successfully"});
    } catch(error) {
        console.log(error);
        res.status(500).json({message: error.message}); // internal server error
    }
}
// delete driver by _id in mongodb, get id by params
const deleteDriver = async function(req, res){
    const userId = req.params.id;
    try {
        const deletedDriver = await driversModel.findOneAndDelete({_id: userId});
        const driverDataLocation = await driverDest.findOneAndDelete({driverId: userId});
        if (!deletedDriver || !driverDataLocation) {
            return res.status(400).json({message: "Driver not found"});
        }
        res.status(200).json({message: "User Deleted Successfully"});
    } catch(error) {
        console.log(error);
        res.status(500).json({message: error.message}); // internal server error
    }
}

const getDriverlocation = async function(req, res){
    const driverId = req.params.id;
    try{
        const result = await driverDest.findOne({_id: driverId});
        if(!result){
            res.status(400).json({message: 'Driver not found'});
        }
        res.status(200).json(result);
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: error.message});
    }
}

const alert = async function(req, res) {
    const driverId = req.params.id;
    try {
        // Increment the alert count
        const result = await driversModel.updateOne(
            { _id: driverId },
            { $inc: { alerts: 1 } }
        );

        // Check if the update was successful
        if (result.nModified === 0) {
            return res.status(404).json({ message: 'Driver not found or alert not incremented' });
        }

        // Return a success message
        res.status(200).json({ message: 'Alert incremented' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}


const distacne = async function(req,res){
    const {maxDistance} = req.body;
    try{
        const settings = await distance.findOneAndUpdate({}, { maxDistance }, { new: true, upsert: true });
        res.status(200).json({ message: 'Distance updated successfully', settings });
    }
    catch(error){
        onsole.log(error);
        res.status(500).json('Error : ', error.message);
    }
}

const trips = async function(req, res) {
    try {
        const result = await tripsModel.find();  // Add `await` here
        if (result.length === 0) {  // Check if the result is an empty array
            return res.status(404).json({ message: "No Data" });
        }
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}
const subModel = require('../../model/subscription');
const getDriver = async function(req, res){
    const driverId = req.params.id;
    try{
        const driver = await driversModel.findOne({ _id: driverId });
        const DriverData = await subModel.findOne({ driverId: driverId });
        const location = await driverDest.findOne({ driverId: driverId });
        
        if (!driver) {
            return res.status(404).json({ message: "Driver Not Found" });
        }
        res.status(200).json({ driver, DriverData, location });     
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: error.message});
    }
}
const getUser = async function(req, res){
    const userId = req.params.id;
    try{
        const user = await usersModel.findOne({_id: userId});
        if(!user){
            res.status(404).json({message: "Driver Not Found"});
        }
        res.status(200).json({user})
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: error.message});
    }
}

const getTrips = async function(req, res) {
    try {
        // Fetch all trips
        const trips = await bookModel.find();

        if (!trips || trips.length === 0) {
            return res.status(404).json({ message: "No Trips Found" });
        }

        // Extract unique userIds from trips
        const driverIds = trips.map(trip => trip.driverId);
        const uniqueDriverIds = Array.from(new Set(driverIds));

        // Fetch user data for these driverIds
        const driverData = await driversModel.find({ _id: { $in: uniqueDriverIds } });

        // Create a map of user data for quick lookup
        const userMap = driverData.reduce((map, user) => {
            map[user._id] = user;
            return map;
        }, {});

        // Attach user data to each trip
        const tripsWithUserData = trips.map(trip => ({
            ...trip.toObject(),
            driverData: userMap[trip.driverId] || null
        }));

        // Respond with trips including user data
        res.status(200).json(tripsWithUserData);
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ message: "An error occurred while fetching trips.", error: error.message });
    }
};

// Function to add a new panner
const addPanner = async (req, res) => {
try {
    // Extract text from the request body
    //const { text } = req.body;

    // Extract image URLs from the uploaded files
    const images = req.files.map(file => file.path);

    // Create a new panner entry with images and text
    const newPanner = new pannerModel({ images });
    await newPanner.save();

    res.status(201).json({ message: 'Panner added successfully', panner: newPanner });
} catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add panner' });
}
};
// Function to delete a panner by ID
// Function to delete a specific image from an existing panner by ID
const deletePanner = async (req, res) => {
const { id } = req.params; // Panner ID
const { imageUrl } = req.body; // Image URL to delete

try {
    // Find the panner by ID and remove the specified image URL from the images array
    const updatedPanner = await pannerModel.findByIdAndUpdate(
        id,
        { $pull: { images: imageUrl } },
        { new: true }
    );

    if (!updatedPanner) {
        return res.status(404).json({ message: 'Panner not found' });
    }

    res.status(200).json({ message: 'Image deleted successfully', panner: updatedPanner });
} catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete image' });
}
};

const patchPanner = async (req, res) => {
const { id } = req.body;

try {
    const newImages = req.files.map(file => file.path);

    const updatedPanner = await pannerModel.findByIdAndUpdate(
        id,
        { $push: { images: { $each: newImages } } },
        { new: true }
    );

    if (!updatedPanner) {
        return res.status(404).json({ message: 'Panner not found' });
    }

    res.status(200).json({ message: 'Images added successfully', panner: updatedPanner });
} catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add images' });
}
};

const getPanner = async function(req, res){
const { id } = req.params;
try{
    const panners = await pannerModel.findOne({_id:id});
    
    if(!panners){
        return res.status(500).json({ message: error.message });
    }
    res.status(200).json({ panners: panners });
}
catch(error){
    console.log(error);
    res.status(500).json({ message: error.message });
}
}

const patchUpdateSub = async(req, res)=>{
    const { subScription, profit } = req.body;
    try{
        if(subScription && profit){
            const updateSystemwallet = await walletSystem.findOneAndUpdate(
                { _id: "678cc8adf1d3a9b7b6f7174e" }, // Query
                { subScription, profit },           // Update fields
                { new: true }                       // Options
            );
            if (!updateSystemwallet) {
                return res.status(400).json({ message: "Error While Updating System Wallet" });
            }
            return res.status(200).json({ data: updateSystemwallet });
        }
        if(subScription){
            const updateSystemwallet = await walletSystem.findOneAndUpdate(
                { _id: "678cc8adf1d3a9b7b6f7174e" }, // Query
                { subScription },           // Update fields
                { new: true }                       // Options
            );
            if (!updateSystemwallet) {
                return res.status(400).json({ message: "Error While Updating System Wallet" });
            }
            return res.status(200).json({ data: updateSystemwallet });
        }
        if(profit){
            const updateSystemwallet = await walletSystem.findOneAndUpdate(
                { _id: "678cc8adf1d3a9b7b6f7174e" }, // Query
                { profit },           // Update fields
                { new: true }                       // Options
            );
            if (!updateSystemwallet) {
                return res.status(400).json({ message: "Error While Updating System Wallet" });
            }
            return res.status(200).json({ data: updateSystemwallet });
        }
    }
    catch(error){
        console.log(error);
        return res.status(500).json({message: error.messsage});
    }
}

const getSub = async(req, res)=>{
    try{
        const sub = await walletSystem.findOne();
        if(!sub){
            return res.status(404).json({message: "No Subcription"});
        }
        return res.status(200).json({sub});
    }
    catch(error){
        console.log(error);
        return res.status(500).json({message: error.message});
    }
}

const distanceModel = require('../../model/intripdistance');
const { updateDistance } = require('../booking/userBooking');

const pushNewdistance = async (req, res) => {
    const { distance } = req.body;

    try {
        const newDistance = new distanceModel({ distance });
        await newDistance.save();

        return res.status(201).json({ message: 'Created successfully', newDistance });
    } catch (error) {
        console.error('Error when creating distance:', error);
        return res.status(400).json({ message: 'Error when creating distance', error: error.message });
    }
};

const updateDistance2 = async (req, res) => {
    const { distance } = req.body;

    try {
        const updateDistance = await distanceModel.updateMany({}, { distance });

        if (updateDistance.modifiedCount === 0) {
            return res.status(400).json({ message: 'No distances updated' });
        }

        return res.status(200).json({ message: 'Distance updated successfully', update: updateDistance });
    } catch (error) {
        console.error('Error updating distance:', error);
        return res.status(500).json({ message: 'Error updating distance', error: error.message });
    }
};

const getDistance = async (req, res) => {
    try {
        const distances = await distanceModel.find();
        return res.status(200).json({ distances });
    } catch (error) {
        console.error('Error fetching distances:', error);
        return res.status(500).json({ message: 'Error fetching distances', error: error.message });
    }
};

// export functions 
module.exports = {
    getAllUsers,
    getAllDrivers,
    deleteUser,
    deleteDriver,
    getDriverlocation,
    trips,
    distacne,
    alert,
    getProperity,
    updateProperity,
    addProperites,
    getDriver,
    getDriver,
    getUser,
    getTrips,
    addPanner,
    deletePanner,
    patchPanner,
    getPanner,
    addWalletsystem,
    updateSystemwallet,
    patchUpdateSub,
    getSub,
    updateDistance2,
    getDistance,
    pushNewdistance
}