const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    supportAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Reference to the support agent assigned
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const supportConversation = mongoose.model('supportConversation', conversationSchema);
module.exports = supportConversation;
