const Driver = require('../../model/regestration/driverModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const crypto = require('crypto');
const driverFind = require('../../model/booking/driversDestination');
const subModel = require('../../model/subscription');
const cron = require('node-cron');
let verificationCodes = {};
const client = require('../../server');
const moment = require('moment');
const Trip = require('../../model/booking/userBooking');
//import upload from '../../middlewares/fiels'; // Import the upload middleware
require('dotenv').config(); // Load environment variables
// Sign-up function
const handleFileUpload = (files, fieldName) => {
    return files?.[fieldName] ? files[fieldName][0].path : null;
};

const checkRequiredFields = (data) => {
    const { profile_image, username, email, carModel, licence_expire_date, password, id, national_front, national_back, national_selfie } = data;
    return !profile_image || !username || !email || !carModel || !licence_expire_date || !password || !id || !national_front || !national_back || !national_selfie;
};

const checkImageFields = (licenseImage, driver_licence_image) => {
    return !licenseImage || !driver_licence_image;
};

const checkExistingUser = async (email, phoneNumber, id) => {
    return await Driver.findOne({ $or: [{ email }, { phoneNumber }, { id }] });
};
// Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
}
const sendOTP = async function(phoneNumber, otp) {
    const formattedNumber = phoneNumber.replace(/\s+/g, '').replace(/[^0-9+]/g, '') + '@c.us';
    console.log(`Sending OTP to: ${formattedNumber}`);

    try {
        await client.sendMessage(formattedNumber, `Your login OTP code is: ${otp}`);
        console.log('✅ OTP sent successfully via WhatsApp');
        return true;
    } catch (error) {
        console.error('❌ Failed to send OTP:', error);
        return false;
    }
}

const generateOTPwhats = async (req, res) => {
    const { phoneNumber, otp } = req.body;

    try {
        if (!otp) {
            const generatedOTP = generateOTP(); // Assuming generateOTP generates a random OTP
            const isSent = await sendOTP(phoneNumber, generatedOTP); // Send OTP via WhatsApp

            if (!isSent) {
                return res.status(500).json({ message: 'Failed to send OTP via WhatsApp' });
            }

            // Store OTP temporarily for verification (expires in 1 hour)
            verificationCodes[phoneNumber] = { code: generatedOTP, expiresAt: Date.now() + 3600000 };

            return res.status(200).json({ message: 'OTP sent successfully via WhatsApp' });
        }

        const storedOTP = verificationCodes[phoneNumber];

        if (!storedOTP) {
            return res.status(400).json({ message: 'OTP not requested or expired' });
        }

        // // Delete OTP first if expired
        if (Date.now() > storedOTP.expiresAt) {
            delete verificationCodes[phoneNumber];
            return res.status(400).json({ message: 'OTP expired' });
        }
        console.log(storedOTP.code, otp);
        console.log("verification code : ", verificationCodes);
        if (String(storedOTP.code) !== String(otp)) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // OTP is correct, delete it from storage
        delete verificationCodes[phoneNumber];
        // Find the driver
        const driver = await Driver.findOne({ phoneNumber });
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        // Mark driver as verified and save
        driver.verify = true;
        await driver.save();

        return res.status(200).json({ message: 'OTP verified successfully, driver verified' });

    } catch (error) {
        console.error('Error in generateOTPwhats:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


const signup = async function(req, res) {
    try {
        const {
            username,
            phoneNumber,
            email,
            id,
            carModel,
            licence_expire_date,
            carNumber,
            carColor,
            vehicleType,
            password,
            latitude,
            longitude,
            driverFCMToken,
            wallet,
            comments,
            walletType,
            status,
            verify,
            ctr,
        } = req.body;

        // File handling
        const licenseImage = handleFileUpload(req.files, 'licenseImage');
        const driver_licence_image = handleFileUpload(req.files, 'driver_licence_image');
        const profile_image = handleFileUpload(req.files, 'profile_image');
        const national_front = handleFileUpload(req.files, 'national_front');
        const national_back = handleFileUpload(req.files, 'national_back');
        const national_selfie = handleFileUpload(req.files, 'national_selfie');

        // Check if required fields are missing
        if (checkRequiredFields({ profile_image, username, email, carModel, licence_expire_date, password, id, national_front, national_back, national_selfie })) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if images are missing
        if (checkImageFields(licenseImage, driver_licence_image)) {
            return res.status(400).json({ message: 'All images are required' });
        }

        // Check if user already exists
        const existingUser = await checkExistingUser(email, phoneNumber, id);
        if (existingUser) {
            let existingField = '';
            if (existingUser.email === email) {
                existingField = 'Email already exists';
            } else if (existingUser.phoneNumber === phoneNumber) {
                existingField = 'Phone number already exists';
            } else if (existingUser.id === id) {
                existingField = 'ID already exists';
            }
            return res.status(400).json({ message: existingField });
        }

        // Hash password
        const hashedPassword = bcrypt.hashSync(password, 10);

        // Create new driver
        const newDriver = new Driver({
            profile_image,
            username,
            phoneNumber,
            driverFCMToken,
            email,
            id,
            carNumber,
            carColor,
            carModel,
            licenseImage,
            driver_licence_image,
            licence_expire_date,
            vehicleType,
            walletType: walletType || "1",
            password: hashedPassword,
            wallet,
            national_front,
            national_back,
            national_selfie,
            comments: comments || [],
            dailyTrip: 0,
            weeklyTrips: 0,
            dailayEarned: 0,
            weeklyEarned: 0,
            status: status || "offline",
            verify: verify || false,
            ctr: ctr || 0
        });

        await newDriver.save();

        // Create driver location
        const driverLocation = new driverFind({
            driverId: newDriver._id,
            profile_image: newDriver.profile_image,
            driverFCMToken: "",
            username: newDriver.username,
            carModel: newDriver.carModel,
            carNumber: newDriver.carNumber,
            carColor: newDriver.carColor,
            vehicleType: newDriver.vehicleType,
            wallet: 0,
            comments: comments || [],
            location: {
                type: "Point",
                coordinates: [longitude, latitude]
            },
            weeklyStartDate: null,
            dailyTrip: 0,
            weeklyTrips: 0,
            weeklyEarned: 0,
            dailayEarned: 0,
            verify
        });

        await driverLocation.save();

        // Generate JWT token
        const token = jwt.sign({ id: newDriver._id, username: newDriver.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(201).json({
            message: 'User created successfully',
            token,
            driver: {
                id: newDriver._id,
                profile_image: newDriver.profile_image,
                username: newDriver.username,
                email: newDriver.email,
                phoneNumber: newDriver.phoneNumber,
                carModel: newDriver.carModel,
                licenseImage: newDriver.licenseImage,
                driver_licence_image: newDriver.driver_licence_image,
                licence_expire_date: newDriver.licence_expire_date,
                vehicleType: newDriver.vehicleType,
                location: driverLocation.location,
                driverId: driverLocation.driverId,
                carNumber: carNumber,
                carColor: carColor,
                driverFCMToken,
                wallet,
                national_front,
                national_back,
                national_selfie,
                comments,
                verify
            }
        });
    } catch (error) {
        console.error('Signup error:', error); // Log the full error
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Login function
const login = async function(req, res) {
    const { email, phoneNumber, password } = req.body;

    if ((!email && !phoneNumber) || !password ) {
        return res.status(400).json({ message: 'Email or phone number and password are required' });
    }

    try {
        const user = await Driver.findOne({ $or: [{ email }, { phoneNumber }] });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const verified = user.verify;
        console.log("verified : ", verified);
        if(verified === false){
            return res.status(400).json({message: "User not verified"});
        }
        const valid = bcrypt.compareSync(password, user.password);
        if (!valid) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        if(user.block === true){
            return res.status(200).json({
                message: 'Login successful',
                driver: {
                    id: user._id,
                    profile_image: user.profile_image,
                    username: user.username,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    carModel: user.carModel,
                    licenseImage: user.licenseImage,
                    driver_licence_image: user.driver_licence_image,
                    licence_expire_date: user.licence_expire_date,
                    vehicleType: user.vehicleType
                }
            });
        }
        else{
            return res.status(400).json({message: "You Are Blocked"});
        }
    //res.status(401).json({message: "Not Authorized to login"});
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};


// Update password function
const updatePassword = async function(req, res) {
    const { email, phoneNumber, currentPassword, newPassword } = req.body;

    if ((!email && !phoneNumber) || !currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Email or phone number, current password, and new password are required' });
    }

    try {
        const user = await Driver.findOne({ $or: [{ email }, { phoneNumber }] });
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Update password error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const patchBlock = async function(req, res) {
    const userId = req.params.id;
    try {
        const user = await Driver.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const newBlockValue = !user.block;
        const updatedUser = await Driver.findOneAndUpdate(
            { _id: userId },           
            { block: newBlockValue },   
            { new: true }               
        );
        res.status(200).json(updatedUser); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

const patchAlerts = async function(req, res) {
    const userId = req.params.id;
    try {
        const user = await Driver.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Increment the alerts count
        const updatedUser = await Driver.findOneAndUpdate(
            { _id: userId },
            { $inc: { alerts: 1 } },  
            { new: true }
        );

        res.status(200).json(updatedUser); 
    } catch (error) {
        console.error("Error updating alerts:", error);
        res.status(500).json({ message: error.message });
    }
}

const DeleteUser = async function(req, res) {
    const userId = req.params.id;
    try {
        const user = await Driver.findByIdAndDelete(userId);
        const driverLocation = await driverFind.findOneAndDelete({ driverId: userId });
        if (!user || !driverLocation) {
            return res.status(404).json({ message: "User Not Found" });
        }
        res.status(200).json({ message: "User Deleted Successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const driverLocation = async (req, res) => {
    try {
        // Assuming `driverFind` is a model for the driver's location.
        const location = await driverFind.findOne();
        
        if (!location) {
            return res.status(404).json({ message: 'Driver location not found' });
        }
        
        res.status(200).json(location);
    } catch (error) {
        console.error('Error fetching driver location:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const handleToken = async function (req, res) {
    const id = req.params.id;
    const { driverFCMToken, check } = req.body;

    try {
        // Ensure 'check' is passed and it's the correct type
        if (check === "true" || check === true) {

            // Validate that driverFCMToken is provided
            if (!driverFCMToken) {
                return res.status(400).json({ message: "driverFCMToken is required" });
            }

            // Update the driver in the 'Driver' collection
            const found = await Driver.findOneAndUpdate(
                { _id: id },
                { driverFCMToken: driverFCMToken },
                { new: true }
            );

            // If the driver isn't found in the 'Driver' collection
            if (!found) {
                return res.status(404).json({ message: "Driver not found in 'Driver' collection" });
            }

            // Update the driver in the 'driverFind' collection
            const found2 = await driverFind.findOneAndUpdate(
                { driverId: id },
                { driverFCMToken: driverFCMToken },
                { new: true }
            );

            // If the driver isn't found in the 'driverFind' collection
            if (!found2) {
                return res.status(404).json({ message: "Driver not found in 'driverFind' collection" });
            }

            console.log(`id : ${id}, driverFCMToken: ${driverFCMToken}, check: ${check}`);
            // Successfully updated both collections
            return res.status(200).json({ message: "Token updated successfully", driverFCMToken });
        }

        // Send response if 'check' is not true
        return res.status(200).json({ message: "check not true" });

    } catch (error) {
        // Log the error and send a 500 response if an unexpected error occurs
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};


const nodemailer = require('nodemailer');
const { constrainedMemory } = require('process');
const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: 'boshtahoma@gmail.com', 
        pass: 'mbehwbyoeinofdvz',
    },
});

function generateNumericOTP() {
    return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number
}

const sendVerification = async function(req, res) {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    
    const verificationCode = generateNumericOTP(); // Generate numeric OTP
    verificationCodes[email] = verificationCode; // Store it
    
    const mailOptions = {
        from: 'boshtahoma@gmail.com',
        to: email,
        subject: 'Password Reset Verification Code',
        text: `Your verification code is: ${verificationCode}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ message: error.message });
        }
        console.log('Email sent: ' + info.response);
        res.status(200).json({ message: 'Verification code sent to your email' });
    });
}

const sendVerificationForgetPass = async function(req, res) {
    const { email } = req.body;
    const emailFound = await Driver.findOne({ email: email });
    if (!emailFound) {
        return res.status(400).json({ message: 'Email not found' });
    }

    const verificationCode = generateNumericOTP(); // Generate numeric OTP
    verificationCodes[email] = verificationCode; // Store it

    const mailOptions = {
        from: 'boshtahoma@gmail.com',
        to: email,
        subject: 'Password Reset Verification Code',
        text: `Your verification code is: ${verificationCode}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ message: error.message });
        }
        console.log('Email sent: ' + info.response);
        res.status(200).json({ message: 'Verification code sent to your email' });
    });
}

const verifyCode = (req, res) => {
    const { email, code } = req.body;
    const storedCode = verificationCodes[email];
    if (!storedCode) {
        return res.status(400).json({ message: "Verification code expired or not found" });
    }
    if (parseInt(code) === storedCode) {
        delete verificationCodes[email]; // Remove used code
        return res.status(200).json({ message: "Verification successful" });
    } else {
        return res.status(400).json({ message: "Invalid verification code" });
    }
};
const forgetPassword = async function(req, res){
    const { email, newPass } = req.body;
    try{
        const password = await Driver.findOne({ email: email});
        if(!password){
            return res.status(404).json({ message: "Email Not Found" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPass, salt);
        const updatePassword = await Driver.findOne(
            { email: email },
            { password: newPass},
            { new: true },
        );
        if(!updatePassword){
            return res.status(400).json({ message: "Failed to set password" });
        }
        res.status(200).json({ message: "Password Set Successfully" });
    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const checkEmail = async function(req, res){
    const { email } = req.body;
    try{
        const found = await Driver.findOne({ email: email });
        if(!found){
            return res.status(404).json({ message: "Email Not Found" });
        }
        res.status(200).json({ message: "Ok" });
    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const updatewalletType = async function (req, res) {
    const { id, type } = req.body;
    try {
        // Fetch the current driver to check walletType
        const driver = await Driver.findById(id);
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        // Update the walletType
        const updateType = await Driver.findByIdAndUpdate(
            id,
            { walletType: type },
            { new: true }
        );

        if (!updateType) {
            return res.status(400).json({ message: "Failed to update Wallet Type" });
        }

        return res.status(200).json({ driver: updateType });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

const updateLocation = async (req, res) => {
    const { id, longitude, latitude } = req.body;
  
    // Validate required fields
    if (!id || !longitude || !latitude) {
      return res.status(400).json({ message: "Missing required fields: id, longitude, or latitude" });
    }
  
    try {
      // Update driver location
      const updatedDriver = await driverFind.findOneAndUpdate(
        { driverId: id },
        { location: { type: "Point", coordinates: [longitude, latitude] } },
        { new: true }
      );
  
      // Check if the driver was found and updated
      if (!updatedDriver) {
        return res.status(404).json({ message: "Driver not found" });
      }
  
      // Return success response
      return res.status(200).json({ message: "Location updated successfully", data: updatedDriver });
    } catch (error) {
      console.error("Error updating location:", error.message);
      return res.status(500).json({ message: "Internal server error" });
    }
  };


const renewSub = async (req, res) => {
    const { driverId } = req.body; // Extract driverId directly from req.body

    try {
        // Fetch the driver record and populate wallet and walletType
        const driver = await subModel.findOne({ driverId: driverId }).lean().populate("driverId", "wallet walletType");

        // Fetch wallet system data (assuming it has a unique identifier)
        const walletSystem = await walletSystem.findOne({ _id: "678b9b06621442d0e65a1384" });

        if (!walletSystem) {
            return res.status(404).json({ message: "Wallet system data not found" });
        }

        if (!driver) {
            // Create a new subscription if driver doesn't exist in subModel
            const newSub = new subModel({
                driverId: driverId,
                days: walletSystem.days, // Initialize with walletSystem.days
            });
            await newSub.save();
            return res.status(200).json({ message: "Renew Subscription Successfully" });
        }

        const walletType = driver.driverId.walletType; // Get walletType
        const wallet = driver.driverId.wallet; // Get wallet balance

        // Check if wallet type is 2 and wallet balance is sufficient
        if (walletType === '2' && wallet >= walletSystem.subScription) {
            // Update subscription days and deduct subscription cost from wallet
            const driverRenew = await subModel.findOneAndUpdate(
                { driverId: driverId },
                { 
                    $inc: { days: walletSystem.days } // Increment days by walletSystem.days
                },
                { new: true } // Return the updated document
            );

            // Deduct subscription cost from driver's wallet
            const updatedWallet = await Driver.findOneAndUpdate(
                { _id: driverId }, 
                { $inc: { wallet: -walletSystem.subScription } }, // Deduct subscription cost
                { new: true } // Return the updated document
            );

            return res.status(200).json({ 
                message: "Renew Subscription Successfully", 
                walletType: walletType, 
                wallet: updatedWallet.wallet, // Return updated wallet balance
                days: driverRenew.days 
            });
        } else {
            return res.status(400).json({ 
                message: "Recharge Your Wallet Or Your Wallet Type Does Not Match" 
            });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};

const calculateDriverStats = async (req, res) => {
    try {
        const driverId = req.params.driverId;

        const today = moment().startOf('day');
        const oneWeekAgo = moment().subtract(7, 'days').startOf('day');

        // Fetch trips for the driver within the last week
        const trips = await Trip.find({
            driverId: driverId,
            date: { $gte: oneWeekAgo.toDate() } // Filter trips by date
        });

        let dailyTrips = 0, dailyEarned = 0, dailyCommission = 0;
        let weeklyTrips = 0, weeklyEarned = 0, weeklyCommission = 0;

        trips.forEach((trip) => {
            const tripDate = moment(trip.date); // Parse trip date
            if (tripDate.isSame(today, 'day')) {
                // Today's trips
                dailyTrips++;
                dailyEarned += trip.cost - trip.commission;
                dailyCommission += trip.commission;
            }
            // Weekly trips
            weeklyTrips++;
            weeklyEarned += trip.cost - trip.commission;
            weeklyCommission += trip.commission;
        });

        // Update driver's stats
        const driver = await Driver.findById(driverId).select('-carColor');
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }

        // Add daily data to weekly before reset
        driver.weeklyTrips = weeklyTrips;
        driver.weeklyEarned = weeklyEarned;

        // Update daily stats
        driver.dailyTrips = dailyTrips;
        driver.dailyEarned = dailyEarned;

        await driver.save();

        res.status(200).json({ message: 'Driver stats updated successfully', driver });
    } catch (error) {
        console.error('Error calculating driver stats:', error);
        res.status(500).json({ error: 'Failed to calculate driver stats' });
    }
};

const Subtractration = require('../../model/subscription');

// Function to update stats for all drivers (called daily)
// const updateDailyStats = async () => {
//     try {
//         const drivers = await Driver.find({}).select('-carColor');;
//         const today = moment().startOf('day');

//         for (const driver of drivers) {
//             // Reset weekly stats at the start of the new week
//             if (moment().isoWeekday() === 1 && driver.lastWeekReset !== today.toDate()) {
//                 driver.weeklyTrips = 0;
//                 driver.weeklyEarned = 0;
//                 driver.lastWeekReset = today.toDate();
//             }

//             await calculateDriverStats({ params: { driverId: driver._id } }, { status: () => ({ json: () => {} }) });
//             await driver.save();
//         }

//         console.log('All driver stats updated successfully');
//     } catch (error) {
//         console.error('Error updating daily stats:', error);
//     }
// };

// Run the function immediately when the server starts
// updateDailyStats();

// // Run updateDailyStats every 24 hours (86400000 ms)
// setInterval(updateDailyStats, 1);

const decrementAllDriversDays = async () => {
  try {
    // Find all drivers in the subtractration model
    const drivers = await Subtractration.find({});

    // Loop through each driver and decrement their days
    for (const driver of drivers) {
      if (driver.days > 0) {
        // Atomically decrement days by 1 using $inc
        const updatedDriver = await Subtractration.findByIdAndUpdate(
          driver._id, // Use the driver's _id
          { $inc: { days: -1 } }, // Atomically decrement days by 1
          { new: true } // Return the updated document
        );

        console.log(`Days decremented for driver ${driver._id}. Remaining days: ${updatedDriver.days}`);
      } else {
        console.log(`Driver ${driver._id} has no days left to decrement.`);
      }
    }
  } catch (error) {
    console.error('Error decrementing days for drivers:', error);
  }
};

// // Function to update stats for all drivers (called daily)
// const updateDailyStats = async () => {
//   try {
//     const drivers = await Subtractration.find({});
//     const today = moment().startOf('day');

//     for (const driver of drivers) {
//       // Reset weekly stats at the start of the new week
//       if (moment().isoWeekday() === 1 && driver.lastWeekReset !== today.toDate()) {
//         driver.weeklyTrips = 0;
//         driver.weeklyEarned = 0;
//         driver.lastWeekReset = today.toDate();
//       }

//       await calculateDriverStats({ params: { driverId: driver._id } }, { status: () => ({ json: () => {} }) });
//       await driver.save();
//     }

//     console.log('All driver stats updated successfully');
//   } catch (error) {
//     console.error('Error updating daily stats:', error);
//   }
// };
// // Function to decrement days for a specific subtractration document
// const decrementSubtractrationDays = async (subtractrationId) => {
//   try {
//     const subtractration = await Subtractration.findById(subtractrationId);

//     if (!subtractration) {
//       console.error('Subtractration document not found');
//       return;
//     }

//     if (subtractration.days > 0) {
//       // Atomically decrement days by 1 using $inc
//       const updatedSubtractration = await Subtractration.findByIdAndUpdate(
//         subtractrationId,
//         { $inc: { days: -1 } }, // Atomically decrement days by 1
//         { new: true } // Return the updated document
//       );

//       console.log(`Days decremented for subtractration ${subtractrationId}. Remaining days: ${updatedSubtractration.days}`);
//     } else {
//       console.log(`Subtractration ${subtractrationId} has no days left to decrement.`);
//     }
//   } catch (error) {
//     console.error('Error decrementing subtractration days:', error);
//   }
// };
// // Run the function immediately when the server starts
// updateDailyStats();

// // Run updateDailyStats every 24 hours (86400000 ms)
// setInterval(updateDailyStats, 86400000);

// // Decrement days for all drivers every 1 second (1000 ms)
// setInterval(decrementAllDriversDays, 1000);

// // Decrement days for a specific subtractration document every 1 second (1000 ms)
// const subtractrationId = 'your-subtractration-id-here'; // Replace with the actual subtractration ID
// setInterval(() => decrementSubtractrationDays(subtractrationId), 1000);

module.exports = {
    signup,
    login,
    updatePassword,
    patchBlock,
    DeleteUser,
    patchAlerts,
    driverLocation,
    handleToken,
    sendVerification,
    verifyCode,
    sendVerificationForgetPass,
    forgetPassword,
    checkEmail,
    updatewalletType,
    updateLocation,
    renewSub,
    calculateDriverStats,
    // updateDailyStats,
    generateOTPwhats
};
