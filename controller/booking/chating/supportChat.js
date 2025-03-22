const suppotConversation = require('../../../model/booking/chating/')

router.post('/messages', async (req, res) => {
    try {
        const { conversationId, from, to, msg } = req.body;

        // Check if the conversation exists
        let conversation = await supportConversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found.' });
        }

        // Check if the conversation is already assigned to a support agent
        if (conversation.supportAgent && conversation.supportAgent.toString() !== from) {
            return res.status(403).json({ message: 'This conversation is already being handled by another support agent.' });
        }

        // Assign support agent if not already assigned
        if (!conversation.supportAgent) {
            conversation.supportAgent = from; // Assign the current support agent
            await conversation.save();
        }

        // Save the message to the database
        const newMessage = new supportMessage({
            conversationId,
            from,
            to,
            msg
        });
        await newMessage.save();

        // Emit the new message to the recipient
        io.to(to).emit('receiveMessage', newMessage);

        res.status(201).json(newMessage);
    } catch (error) {
        res.status(500).send(error.message);
    }
});
