const Conversation = require('../models/chat/conversation');
const Message = require('../models/chat/messages');
const mongoose = require('mongoose');
const createError = require('http-errors');
const {sendNotification} = require('../firebase');
const User = require('../models/users');
const notification = require('../models/notifications');
const io = require('../server');

// Create a new conversation
const createConversation = async (req, res) => {
    try {
        const { participants, name, isGroupChat } = req.body;

        // Validate participants
        if (!participants || participants.length < 2) {
            return res.status(400).json({ message: "A conversation requires at least two participants." });
        }

        // Check if a conversation with the same participants already exists
        const existConversation = await Conversation.findOne({
            'participants.user': { $all: participants.map(p => p.user) },
            isGroupChat
        });

        if (existConversation) {
            return res.status(200).json({
                message: "Conversation already exists.",
                conversation: existConversation.toJSON()
            });
        }

        // Extract user IDs for the `users` array
        const users = participants.map(p => p.user);

        // Create the conversation
        const conversation = new Conversation({
            participants,
            users, // Add users extracted from participants
            name,
            isGroupChat,
            conversationId: new mongoose.Types.ObjectId() // Explicitly assign a new ObjectId if needed
        });

        // Assign _id to conversationId
        conversation.conversationId = conversation._id;

        // Save the conversation
        await conversation.save();

        res.status(201).json({
            message: "Conversation created successfully.",
            conversation: conversation.toJSON() // conversationId will be part of the JSON
        });
    } catch (error) {
        res.status(500).json({ message: "Error creating conversation.", error: error.message });
    }
};

const getConversationsByUserId = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Fetch conversations with the given userId and not deleted
        const conversations = await Conversation.find({
            'participants.user': userId,
            deleted: false
        })
        .populate('participants.user', 'username email')
        .populate('messages')
        .sort({ 'messages.createdAt': -1 }); // Sort by the latest message timestamp

        // If there are no conversations, return an empty array
        if (!conversations || conversations.length === 0) {
            return res.status(200).json({ conversations: [] });
        }

        // Process conversations to get the most recent message for each
        const conversationsWithLastMessage = await Promise.all(
            conversations.map(async (conversation) => {
                const lastMessage = await Message.findOne({
                    conversationId: conversation._id,
                    $or: [{ senderId: userId }, { receiverId: userId }]
                })
                .sort({ createdAt: -1 }) // Sort messages to get the latest
                .lean();

                return {
                    conversationId: conversation.conversationId,
                    participants: conversation.participants,
                    lastMessage: lastMessage || null
                };
            })
        );

        // Sort conversations by the most recent message timestamp
        const sortedConversations = conversationsWithLastMessage.sort((a, b) => {
            const lastMessageA = a.lastMessage ? new Date(a.lastMessage.createdAt) : 0;
            const lastMessageB = b.lastMessage ? new Date(b.lastMessage.createdAt) : 0;
            return lastMessageB - lastMessageA; // Sort by most recent first
        });

        res.status(200).json({ conversations: sortedConversations });
    } catch (error) {
        next(error);
    }
};


// Update conversation
const updateConversation = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const updates = req.body;

        const conversation = await Conversation.findByIdAndUpdate(
            conversationId,
            { ...updates, updatedAt: Date.now() },
            { new: true }
        );

        if (!conversation) {
            throw createError(404, "Conversation not found.");
        }

        res.json({
            message: "Conversation updated successfully.",
            conversation
        });
    } catch (error) {
        next(error);
    }
};

// Soft delete conversation
const deleteConversation = async (req, res, next) => {
    try {
        const { conversationId } = req.params;

        const conversation = await Conversation.findOneAndUpdate(
            { _id: conversationId, deleted: false },
            { deleted: true },
            { new: true }
        );

        if (!conversation) {
            throw createError(404, "Conversation not found or already deleted.");
        }

        res.json({
            message: "Conversation deleted successfully.",
            conversation
        });
    } catch (error) {
        next(error);
    }
};

// Get conversation by ID
const getConversationById = async (req, res, next) => {
    try {
        const id = req.params.id;

        const conversation = await Conversation.findById(id)
            .populate('participants.user', 'username email')
            .populate('messages');

        if (!conversation) {
            throw createError(404, "Conversation not found.");
        }

        const messages = await Message.find({ conversationId: id });

        res.json({ conversation, messages });
    } catch (error) {
        next(error);
    }
};
const sendMessage = async (req, res, next) => {
    try {
        const { id: conversationId } = req.params;
        const { sender: senderId, text, receiverId, title } = req.body;

        if (!conversationId || !senderId || !text || !receiverId) {
            throw createError(400, "Missing required fields.");
        }

        const message = new Message({
            conversationId,
            senderId,
            title: title || false,
            receiverId,
            text
        });

        await message.save();

        // Emit socket event if socket.io is initialized
        if (global.io) {
            global.io.emit(`newMessage/${receiverId}`, message);
            global.io.emit(`internalMessages/${conversationId}`, message);
        }
        const newNotifaction = new notification({
            userId: receiverId,
            postId: "",
            title: 'New Message',
            body: 'New Message Check Your Box',
            type: 'Message',
        });
        await newNotifaction.save(); 
        const userData = await User.findOne({_id: senderId});       
        res.json({
            message: "Message sent successfully",
            messageData: message,
            userData
        });
    } catch (error) {
        next(error);
    }
};


// Get all messages for a conversation
const getAllMessages = async (req, res, next) => {
    try {
        const { id: conversationId } = req.params;

        const messages = await Message.find({ conversationId })
            .populate('senderId', 'username email')
            .populate('receiverId', 'username email');

        res.json({
            message: "Messages retrieved successfully.",
            messages
        });
    } catch (error) {
        next(error);
    }
};

// Get all conversations with last message
const getAllConversations = async (req, res, next) => {
    try {
        const { id: userId } = req.params;

        const conversations = await Conversation.find({
            'participants.user': userId,
            deleted: false
        })
        .populate('participants.user', 'username email')
        .populate('messages');

        const conversationsWithLastMessage = await Promise.all(
            conversations.map(async (conversation) => {
                const lastMessage = await Message.findOne({
                    conversationId: conversation._id,
                    $or: [{ senderId: userId }, { receiverId: userId }]
                })
                .sort({ createdAt: -1 })
                .lean();

                return {
                    conversationId: conversation.conversationId,
                    participants: conversation.participants,
                    lastMessage: lastMessage || null
                };
            })
        );
        res.json({ conversations: conversationsWithLastMessage });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createConversation,
    getConversationsByUserId,
    updateConversation,
    deleteConversation,
    getConversationById,
    sendMessage,
    getAllConversations,
    getAllMessages
};