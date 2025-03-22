const User = require('../../model/regestration/userModel');
const bcrypt = require('bcrypt');


const updateProfileimage = async function(req, res) {
    const profile_image = req.files['profile_image'] ? req.files['profile_image'][0].path : null;
    const id = req.params.id;

    try {
        const result = await User.findOneAndUpdate(
            { _id: id },
            { profile_image },
            { new: true } 
        );

        res.status(200).json({ message: "Profile Image Updated Successfully", result });
    } catch (error) {
        console.log(error); // Corrected console log typo
        res.status(500).json({ message: error.message });
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
        const user = await User.findOne({ _id: id });
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
        const updatedUser = await User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true });

        // Respond with success message
        res.status(200).json({ message: 'Password updated successfully', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};
const updateEmail = async function(req, res) {
    const id = req.params.id;
    const { email } = req.body; // Extract email from request body

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // Update the user's email by ID
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { email }, 
            { new: true } 
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Email updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: error.message });
    }
}

const updateUsername = async function(req, res) {
    const id = req.params.id;
    const { username } = req.body; 

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { username }, 
            { new: true } 
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Username updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
}

const updatePhoneNumber = async function(req, res) {
    const id = req.params.id;
    const { phoneNumber } = req.body; // Extract phoneNumber from request body

    if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { phoneNumber }, 
            { new: true } 
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Phone number updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
}

const getUser = async function(req, res){
    const id = req.params.id;
    try{
        const userFound = await User.findOne({ _id: id });
        if(!userFound){
            return res.status(404).json({message: 'User not found'});
        }
        return res.status(200).json({user: userFound});
    }
    catch(error){
        console.log(error);
        res.status(500).json({ Error: error.message });
    }
}

module.exports = {
    updateEmail,
    updateUsername,
    updatePhoneNumber,
    updatePassword,
    updateProfileimage,
    getUser
}
