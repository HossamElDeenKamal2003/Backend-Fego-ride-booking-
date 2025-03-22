// const mongoose = require('mongoose');

// // Conversation Schema
// const conversationSchema = new mongoose.Schema({
//     participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array of participants (User IDs)
//     lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }, // Reference to the last message in the conversation
// }, {
//     timestamps: true // Adds createdAt and updatedAt timestamps automatically
// });

// // Indexes for performance
// conversationSchema.index({ participants: 1 });

// // Message Schema
// const messageSchema = new mongoose.Schema({
//     conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }, // Reference to the conversation
//     senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The ID of the sender
//     content: String, // Text content of the message
//     media: String,  // URL for media (images, videos, files, etc.)
//     mediaType: { type: String, enum: ['image', 'video', 'audio', 'document'] }, // Type of media, if any
//     status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' }, // Message status
//     timestamp: { type: Date, default: Date.now }, // Timestamp of the message
// }, {
//     timestamps: true // Adds createdAt and updatedAt timestamps automatically
// });

// // Indexes for better querying
// messageSchema.index({ conversationId: 1 });
// messageSchema.index({ senderId: 1 });

// // Exporting the models
// const Conversation = mongoose.model('Conversation', conversationSchema);
// const Message = mongoose.model('Message', messageSchema);

// module.exports = { Conversation, Message };
