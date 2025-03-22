const admin = require('../models/messagesAdmin');
const User = require('../models/users');
// Send a message
const sendMessage = async (req, res) => {
    const { userId, messageTitle, content } = req.body;

    if (!userId || !messageTitle || !content) {
        return res.status(400).json({ error: 'User ID and message are required.' });
    }

    try {
        const newMessage = await admin.create({ userId, messageTitle, content });
        res.status(201).json({ message: 'Message sent successfully!', data: newMessage });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send the message.', details: error.message });
    }
};

// Get all messages (Admin view)
const getMessages = async (req, res) => {
    try {
        const messages = await admin.find()
            .populate('userId', 'username email phoneNumber') // Correct the populate path to 'userId'
            .sort({ createdAt: -1 });

        res.status(200).json({ data: messages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages.', details: error.message });
    }
};

const getUserMessages = async (req, res) => {
    const userId = req.params.id; // Getting the userId from URL parameters

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    try {
        const messages = await admin.find({ userId }) // Fetch messages by userId
            .populate('userId', 'username email phoneNumber') // Populate user details
            .sort({ createdAt: -1 }); // Sort messages by created date (latest first)

        if (messages.length === 0) {
            return res.status(404).json({ message: 'No messages found for this user.' });
        }

        res.status(200).json({ data: messages });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user messages.', details: error.message });
    }
};



module.exports = {
    sendMessage,
    getMessages,
    getUserMessages
};
