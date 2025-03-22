const { Conversation, Message } = require('../../../model/booking/chating/chatModel');

const chatHandler = (io) => {
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a conversation room
    socket.on('joinConversation', async ({ conversationId }) => {
    try {
        socket.join(conversationId);
        console.log(`User  joined conversation: ${conversationId}`);
    } catch (err) { 
        console.error('Error joining conversation:', err);
    }
    });

    // Handle sending a message
    socket.on('sendMessage', async ({ conversationId, senderId, content, media, mediaType }) => {
    try {
        // Create and save the message
        const newMessage = new Message({
        conversationId,
        senderId,
        content,
        media,
        mediaType,
        status: 'sent',
        timestamp: Date.now(),
        });
        await newMessage.save();

        // Update lastMessage in the conversation
        await Conversation.findByIdAndUpdate(conversationId, { lastMessage: newMessage._id });

        // Emit the new message to the conversation's room
        io.to(conversationId).emit('receiveMessage', newMessage);
    } catch (err) {
        console.error('Error sending message:', err);
    }
    });

    // Handle message delivery confirmation
    socket.on('messageDelivered', async ({ messageId }) => {
    try {
        const updatedMessage = await Message.findByIdAndUpdate(messageId, { status: 'delivered' }, { new: true });
        io.emit('messageStatusUpdate', updatedMessage);
    } catch (err) {
        console.error('Error updating message status:', err);
    }
    });

    // Handle message read confirmation
    socket.on('messageRead', async ({ messageId }) => {
    try {
        const updatedMessage = await Message.findByIdAndUpdate(messageId, { status: 'read' }, { new: true });
        io.emit('messageStatusUpdate', updatedMessage);
    } catch (err) {
        console.error('Error updating message status:', err);
    }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    });
});
};

module.exports = chatHandler;
