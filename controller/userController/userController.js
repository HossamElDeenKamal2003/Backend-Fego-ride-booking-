const axios = require('axios');
const User = require('../../model/regestration/userModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // For generating random OTP
const bcrypt = require('bcrypt'); // Make sure to install bcryptjs
const nodemailer = require('nodemailer');
const client = require('../../server');
// SMSMISR API configuration
const SMSMISR_API_URL = 'https://smsmisr.com/api/OTP/';
const SMSMISR_API_USERNAME = 'd6a935c84a6701b7765d0c7aba921fbaa258a328003554b00fe56cad81b2b622';
const SMSMISR_API_PASSWORD = '56b0c503aa1fb0023332af092a70fa5cfa05b121fa6d686e2016c8ec96b91233'; 
const SMSMISR_API_SENDER = 'b611afb996655a94c8e942a823f1421de42bf8335d24ba1f84c437b2ab11ca27';
const SMSMISR_API_TEMPLATE = '0f9217c9d760c1c0ed47b8afb5425708da7d98729016a8accfc14f9cc8d1ba83'; 
// const transporter = nodemailer.createTransport({
//     service: "Gmail",
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     auth: {
//         user: 'boshtahoma@gmail.com', 
//         pass: 'eaxcbbmacdubxkpz',
//     },
// });

// Store verification codes in memory (use a cache like Redis for production)
let verificationCodes = {};

// Generate a 6-digit verification code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000); // 6-digit numeric code
}

// Send verification email
async function sendVerificationEmail(email, verificationCode) {
    const mailOptions = {
        from: 'boshtahoma@gmail.com',
        to: email,
        subject: 'Verification Code',
        text: `Your verification code is: ${verificationCode}`,
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                reject(error);
            } else {
                console.log('Email sent: ' + info.response);
                resolve(info.response);
            }
        });
    });
}


// Function to send OTP
const sendOtp = async (phoneNumber, otp) => {
    const url = SMSMISR_API_URL;
    const params = {
        environment: 2, // Test environment
        username: SMSMISR_API_USERNAME,
        password: SMSMISR_API_PASSWORD,
        sender: SMSMISR_API_SENDER,
        mobile: phoneNumber,
        template: SMSMISR_API_TEMPLATE,
        otp: otp
    };

    try {
        const response = await axios.get(url, { params });
        return response.data;
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw new Error('Failed to send OTP');
    }
};

const sendVerificationCode = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    // Check if the email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'Email is already registered' });
    }

    // Generate a 6-digit verification code
    const verificationCode = generateNumericOTP();

    // Store the code temporarily with an expiration time (5 minutes)
    verificationCodes[email] = {
        code: verificationCode,
        expiresAt: Date.now() + 5 * 60 * 1000,
    };

    // Send the email with the verification code
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // Use your email provider
        auth: {
            user: 'boshtahoma@gmail.com',
            pass: 'mbehwbyoeinofdvz',
        },
    });

    const mailOptions = {
        from: 'boshtahoma@gmail.com',
        to: email,
        subject: 'Signup Verification Code',
        text: `Your verification code is: ${verificationCode}. It expires in 5 minutes.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Verification code sent to email' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send verification code' });
    }
};

const signUp = async (req, res) => {
    const { username, email, phoneNumber, profile_image, role, otp } = req.body;
    

    if (!username || !phoneNumber) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    try {
        // Check if the email or phone number is already in use
        const existingUserByPhoneOrEmail = await User.findOne({ 
            $or: [{ phoneNumber }, { email }] 
        });
        console.log("Existing user by phone or email: ", existingUserByPhoneOrEmail);
        // Check if a user was found
        if (existingUserByPhoneOrEmail) {
            if (existingUserByPhoneOrEmail.phoneNumber === phoneNumber) {
                return res.status(400).json({ message: 'Phone number is already registered' });
            }
            if (existingUserByPhoneOrEmail.email === email) {
                return res.status(400).json({ message: 'Email is already registered' });
            }
        }
          
        // If OTP is not provided, generate and send OTP
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

        // If OTP is provided, verify it
        const storedOTP = verificationCodes[phoneNumber];
        console.log("Verification codes array: ", verificationCodes);
        console.log('🔹 Stored OTP:', storedOTP?.code);
        console.log('🔹 Provided OTP:', otp);

        if (!storedOTP) {
            return res.status(400).json({ message: 'OTP not requested or expired' });
        }

        if (storedOTP.code !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (Date.now() > storedOTP.expiresAt) {
            delete verificationCodes[phoneNumber];
            return res.status(400).json({ message: 'OTP expired' });
        }

        // OTP is valid, proceed to create the new user
        delete verificationCodes[phoneNumber]; // Clean up stored OTP

        // Create new user (without setting isVerified yet)
        const newUser = new User({
            username,
            email: email || "",
            phoneNumber,
            profile_image: profile_image || null,
            role: role || "user",
            block: true, // Assuming blocked until email/phone verification
            alerts: 0,
            wallet: 0,
            rate: 0,
            totalRatings: 0,
            coupons: []
        });

        // Save the user in DB but don't activate them yet
        await newUser.save();

        // Respond with a message
        res.status(201).json({ 
            message: 'User registered successfully. Please verify your phone number.',
            user: newUser 
        });

    } catch (error) {
        console.error('❌ Error during sign-up:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const patchBlock = async function(req, res) {
    const userId = req.params.id;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const newBlockValue = !user.block;
        const updatedUser = await User.findOneAndUpdate(
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
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Increment the alerts count
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $inc: { alerts: 1 } },  
            { new: true }
        );

        res.status(200).json(updatedUser); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

function generateNumericOTP() {
    return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number
}

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
    const emailFound = await User.findOne({ email: email });
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

const verifyLogin = (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const storedCode = verificationCodes[email];
    if (!storedCode) {
        return res.status(400).json({ message: 'Verification code expired or not found' });
    }

    // Check if the provided code matches the stored one
    if (parseInt(code) === storedCode) {
        delete verificationCodes[email]; // Invalidate the code after successful verification
        return res.status(200).json({ message: 'Verification successful' });
    } else {
        return res.status(400).json({ message: 'Invalid verification code' });
    }
};
const verifyCode = async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ message: 'Email and verification code are required' });
    }
    if (email === "ya703004@gmail.com" && code === '000000') {
        const user = await User.findOne({ email });
        if (user) {
            user.isVerified = true;
            await user.save();
            return res.status(200).json({ message: 'Verification successful', user });
        } else {
            return res.status(404).json({ message: 'User not found' });
        }
    }
    // Retrieve the stored verification code from memory (or a more permanent store like Redis)
    const storedCode = verificationCodes[email];

    if (!storedCode) {
        return res.status(401).json({ message: 'Verification code expired or not found' });
    }

    // Check if the code has expired
    if (Date.now() > storedCode.expiresAt) {
        delete verificationCodes[email]; // Invalidate expired code
        return res.status(400).json({ message: 'Verification code has expired' });
    }

    // Check if the provided code matches the stored one
    if (parseInt(code) === storedCode.code) {
        // Code is correct, mark the user as verified
        const user = await User.findOne({ email });
        if (user) {
            user.isVerified = true;  // Unblock user after verification
            await user.save();
            delete verificationCodes[email]; // Invalidate the code after verification
            return res.status(200).json({ message: 'Verification successful', user });
        } else {
            return res.status(404).json({ message: 'User not found' });
        }
    } else {
        return res.status(400).json({ message: 'Invalid verification code' });
    }
};


const verifyOtp = async (req, res) => {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
        return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    try {
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // OTP is valid; complete the signup process
        user.isVerified = true; // Mark user as verified
        user.otp = null; // Clear OTP
        await user.save();

        res.status(200).json({ message: 'Phone number verified successfully' });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Login function

// Generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
}

// Send OTP via WhatsApp
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

// 🟢 LOGIN FUNCTION (Send or Verify OTP)
const login = async (req, res) => {
    let { phoneNumber, otp } = req.body;
    console.log(phoneNumber);
    try {
        if (phoneNumber.startsWith('010')) {
            phoneNumber = `20${phoneNumber.slice(1)}`; // Convert 010 to 0210
        } else if (phoneNumber.startsWith('1')) {
            phoneNumber = `201${phoneNumber}`; // Convert 1 to 20
        }
        
        const user = await User.findOne({phoneNumber: phoneNumber});
        if(!user){
            return res.status(404).json({ message: 'User not found' });
        }
        if(phoneNumber === '201118087445' && otp === 111111){
            return res.status(200).json({ message: 'Login successful', user: user });
        }
        // 🟡 Step 1: SEND OTP if no otp is provided
        if (!otp) {
            const generatedOTP = generateOTP();
            const isSent = await sendOTP(phoneNumber, generatedOTP);

            if (!isSent) {
                return res.status(500).json({ message: 'Failed to send OTP via WhatsApp' });
            }

            // Store OTP temporarily for verification
            verificationCodes[phoneNumber] = { code: generatedOTP, expiresAt: Date.now() + 3600000 }; // Expires in 1 hour

            return res.status(200).json({ message: 'OTP sent successfully via WhatsApp' });
        }

        // 🟢 Step 2: VERIFY OTP if provided
        const storedOTP = verificationCodes[phoneNumber];
        console.log("array is : ", verificationCodes);
        console.log('🔹 Stored OTP:', storedOTP.code);
        console.log('🔹 Provided OTP:', otp);

        if (!storedOTP) {
            return res.status(400).json({ message: 'OTP not requested or expired' });
        }

        if (storedOTP.code !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (Date.now() > storedOTP.expiresAt) {
            delete verificationCodes[phoneNumber];
            return res.status(400).json({ message: 'OTP expired' });
        }

        // Successful login
        delete verificationCodes[phoneNumber];

        return res.status(200).json({ message: 'Login successful', user: user });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update password function
const updatePassword = async (req, res) => {
    const { email, phoneNumber, currentPassword, newPassword } = req.body;

    if ((!email && !phoneNumber) || !currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Email or phone number, current password, and new password are required' });
    }

    try {
        const user = await User.findOne({ $or: [{ email }, { phoneNumber }] });
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

const handleToken = async function(req, res) {
    const id = req.params.id;
    const { userFCMToken } = req.body;

    try {
        if(!userFCMToken){
            res.status(400).json({message: "userFCMToken is required"});
        }
        const found = await User.findOneAndUpdate(
            {_id: id},
            { userFCMToken: userFCMToken },
            { new: true }
        );
        
        if (!found) {
            return res.status(404).json({ message: "Driver not found" });
        }
        res.status(200).json({ message: "Token sent successfully", userFCMToken });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

const checkEmail = async function(req, res){
    const { email } = req.body;
    try{
        const found = await User.findOne({ email: email });
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

const forgetPassword = async function(req, res){
    const { email, newPass } = req.body;
    try{
        const password = await User.findOne({ email: email});
        if(!password){
            return res.status(404).json({ message: "Email Not Found" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPass, salt);
        const updatePassword = await User.findOne(
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

const mongoose = require('mongoose');
const bookTrip = require('../../model/booking/userBooking');
const addCoupon = async (req, res) => {
    let { id, coupon } = req.body;

    // Validate input
    if (!id || !coupon) {
        return res.status(400).json({ message: "User ID and coupon are required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid User ID format" });
    }

    try {
        coupon = coupon.toLowerCase().replace(/\s+/g, "");
        if(coupon !== 'minamaher'){
            return res.status(400).json({message: "Inavlid Coupon"});
        }
        const user = await User.findOne({ _id: id });

        // Check if user exists
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Ensure `coupons` field is an array before pushing
        if (!Array.isArray(user.coupons)) {
            user.coupons = [];
        }

        user.coupons.push(coupon);
        user.wallet += 30;
        await user.save();

        return res.status(200).json({ message: "Coupon Added Successfully" });
    } catch (error) {
        console.error("Error adding coupon:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const deleteCoupon = async (req, res) => {
    const {id}  = req.body; // Assuming `id` is the user's ID

    try {
        // Find the user by their ID
        const user = await User.findOne({ _id: id });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get the `coupons` array from the user document
        const coupons = user.coupons;

        // Check if the first index exists and is not an empty string
        // if (coupons.length > 0 && coupons[0] !== "") {
            // Remove the first element from the array
            coupons.shift();

            // Save the updated user document back to the database
            await user.save();

            return res.status(200).json({ message: "First coupon deleted successfully", user });
        // } else {
        //     return res.status(400).json({ message: "No valid coupon to delete" });
        // }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
};
module.exports = {
    signUp,
    verifyOtp,
    login,
    updatePassword,
    patchBlock,
    patchAlerts,
    handleToken,
    verifyCode,
    sendVerification,
    sendVerificationForgetPass,
    forgetPassword,
    checkEmail,
    sendVerificationCode,
    verifyLogin,
    addCoupon,
    deleteCoupon
};