const User = require('../../model/regestration/userModel');
const support = require('../../model/regestration/support');
const bcrypt = require('bcrypt');

const siginupSupport = async function(req, res) {
    const { username, role, email, phoneNumber, password, adminFCMToken } = req.body;
    try {
        const newSupport = new support({
            username, 
            role,
            email, 
            phoneNumber,
            adminFCMToken,
            password: bcrypt.hashSync(password, 10)
        });
        await newSupport.save();
        res.status(201).json({ user: newSupport }); // Send back the created user
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

const patchRole = async function(req, res) {
    const { userId, role } = req.body;
    try {
        const userRole = await support.findOneAndUpdate(
            { _id: userId },
            { role: role },
            { new: true }
        );
        if(!userRole){
            return res.status(400).json({message: "User Not Found"});
        }

        res.status(200).json({ message: "Role Updated Successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const deleteUser = async function(req, res) {
    const  id = req.params.id; // Change to access userId from params
    try {
        const deletePermission = await support.findOneAndDelete({ _id: id });
        if (!deletePermission) {
            return res.status(400).json({ message: "Error When Deleting Role for This User" });
        }
        res.status(200).json({ message: "Role Deleted Successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const getSupports = async function(req, res) {
    try {
        const users = await support.find();
        res.status(200).json({ users: users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    patchRole,
    deleteUser,
    getSupports,
    siginupSupport
};
