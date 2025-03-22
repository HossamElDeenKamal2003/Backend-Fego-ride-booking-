const driver = require('../../model/regestration/driverModel');
const bcrypt = require('bcrypt');
const { cloudinary } = require('../../middlewares/cloudinaryConfig');
const multer = require('multer');

const updateProfileimage = async function(req, res) {
    const profile_image = req.files['profile_image'] ? req.files['profile_image'][0].path : null;
    const id = req.params.id;

    try {
        const result = await driver.findOneAndUpdate(
            { _id: id },
            { profile_image },
            { new: true } // Return the updated user document
        );

        res.status(200).json({ message: "Profile Image Updated Successfully", result });
    } catch (error) {
        console.log(error); // Corrected console log typo
        res.status(500).json({ message: error.message });
    }
};

const updateUsername = async (req, res) => {
    const driverId = req.params.id;
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    try {
        const updatedDriver = await driver.findByIdAndUpdate(
            driverId,
            { username },
            { new: true }
        );

        if (!updatedDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        res.status(200).json({
            message: 'Username updated successfully',
            driver: updatedDriver
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'INTERNAL SERVER ERROR' });
    }
};
const updatePhoneNumber = async (req, res) => {
    const driverId = req.params.id;
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    try {
        const updatedDriver = await driver.findByIdAndUpdate(
            driverId,
            { phoneNumber },
            { new: true }
        );

        if (!updatedDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        res.status(200).json({
            message: 'Phone number updated successfully',
            driver: updatedDriver
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'INTERNAL SERVER ERROR' });
    }
};
const updateEmail = async (req, res) => {
    const driverId = req.params.id;
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const updatedDriver = await driver.findByIdAndUpdate(
            driverId,
            { email },
            { new: true }
        );

        if (!updatedDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        res.status(200).json({
            message: 'Email updated successfully',
            driver: updatedDriver
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'INTERNAL SERVER ERROR' });
    }
};
const updateLicenseImage = async (req, res) => {
    try {
        const driverId = req.params.id;
        const licenseImage = req.files['licenseImage'] ? req.files['licenseImage'][0].path : null;

        if (!licenseImage) {
            return res.status(400).json({ message: 'License image is required' });
        }

        const updatedDriver = await driver.findByIdAndUpdate(
            driverId,
            { licenseImage: licenseImage },
            { new: true }
        );

        if (!updatedDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        return res.status(200).json({
            message: 'License image updated successfully',
            driver: updatedDriver
        });
    } catch (error) {
        console.error('Update license image error:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const updateDriverLicenseImage = async (req, res) => {
    const driverId = req.params.id;
    const driver_licence_image = req.files['driver_licence_image'] ? req.files['driver_licence_image'][0].path : null;

    if (!driver_licence_image) {
        return res.status(400).json({ message: 'Driver license image is required' });
    }

    try {
        // Update the driver's document with the new image URL
        const updatedDriver = await driver.findByIdAndUpdate(
            driverId,
            { driver_licence_image },
            { new: true }
        );

        if (!updatedDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        res.status(200).json({
            message: 'Driver license image updated successfully',
            driver: updatedDriver
        });
    } catch (error) {
        console.error('Error updating driver license image:', error);
        res.status(500).json({ message: 'INTERNAL SERVER ERROR', error: error.message });
    }
};

const updatePassword = async function(req, res) {
    const { oldPass, newPass } = req.body;
    const id = req.params.id;

    try {
        // Ensure old password and new password are provided
        if (!oldPass || !newPass) {
            return res.status(400).json({ message: 'Old password and new password are required.' });
        }

        // Find the user by ID
        const user = await driver.findOne({ _id: id });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Compare the provided old password with the stored hashed password
        const valid = bcrypt.compareSync(oldPass, user.password);
        if (!valid) {
            return res.status(401).json({ message: 'Invalid old password.' });
        }

        // Ensure new password is different from the old one
        if (oldPass === newPass) {
            return res.status(400).json({ message: 'New password must be different from the old password.' });
        }

        // Hash the new password
        const hashedPassword = bcrypt.hashSync(newPass, 10);

        // Update the user's password
        const updatedUser = await driver.findByIdAndUpdate(id, { password: hashedPassword }, { new: true });

        // Respond with success message
        res.status(200).json({ message: 'Password updated successfully', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};


module.exports = {
    updateUsername,
    updatePhoneNumber,
    updateEmail,
    updateLicenseImage,
    updateDriverLicenseImage,
    updatePassword,
    updateProfileimage
}