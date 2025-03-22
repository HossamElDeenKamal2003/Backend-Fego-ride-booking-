const authAdmin = require('../../model/regestration/authAdmin');
const supportModel = require('../../model/regestration/support');
const bcrypt = require('bcrypt');

const signup = async function(req, res) {
    try {
        const { username, password, secretKey, adminFCMToken } = req.body;

        // Check if all required fields are provided
        if (!username || !password || !secretKey) {
            return res.status(400).json({ message: "Please enter all required fields" });
        }

        // Check if the secret key is correct
        if (secretKey === "flieger") {
            const hashedPassword = bcrypt.hashSync(password, 10);
            const newAdmin = new authAdmin({
                username: username,
                role: "admin",
                password: hashedPassword,
                adminFCMToken
            });
            await newAdmin.save();
            return res.status(200).json({ message: "Admin saved successfully" });
        }

        // If secret key is incorrect
        return res.status(401).json({ message: "You are not authorized" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
}

const signin = async function(req, res) {
    try {
        const { username, password } = req.body;

        // Check if all required fields are provided
        if (!username || !password) {
            return res.status(400).json({ message: "Please enter username and password" });
        }

        // First, check in the authAdmin model
        let user = await authAdmin.findOne({ username: username });

        // If user not found, check in the support model
        if (!user) {
            user = await supportModel.findOne({ username: username }); // Use findOne instead of find for a single document
        }

        // If user still not found after both queries
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if password is correct
        const valid = bcrypt.compareSync(password, user.password);
        if (!valid) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        return res.status(200).json({ message: "Login successful", user });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
}

module.exports = {
    signup,
    signin
}
