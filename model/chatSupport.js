const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // 'user' or 'support'
  message: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  media: [
    {
      url: { type: String }, // Cloudinary URL
      type: { type: String }, // 'image', 'video'
    },
  ],
});

const chatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
});

const ChatModel = mongoose.model('Chat', chatSchema);

module.exports = ChatModel;
