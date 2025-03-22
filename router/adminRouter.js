const express = require('express');
const { sendMessage, getMessages, getUserMessages } = require('../controller/adminController');

const router = express.Router();

// User sends a message
router.post('/send', sendMessage);

// Admin retrieves all messages
router.get('/get-all', getMessages);

router.get('/getUserMessages/:id', getUserMessages);

module.exports = router;
