const express = require('express');
const router = express.Router();
const { Conversation, Message } = require('../../model/booking/chating/chatModel');


// Create a new conversation
router.post('/chat', async (req, res) => {
    const { participants } = req.body;

    if (!participants || participants.length < 2) {
        return res.status(400).json({ error: 'At least two participants are required' });
    }

    try {
        // Create a new conversation
        const conversation = new Conversation({ participants });
        await conversation.save();

        // Respond with the conversation ID
        res.status(200).json({ conversationId: conversation._id });
    } catch (error) {
        console.error('Error creating conversation:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
