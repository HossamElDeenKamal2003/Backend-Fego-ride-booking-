const express = require('express');
const router = express.Router();
const { sendSms } = require('../../smsService');

// Endpoint to send SMS
router.post('/send-sms', async (req, res) => {
    const { phoneNumber, message, senderKey } = req.body;

    if (!phoneNumber || !message || !senderKey) {
        return res.status(400).json({ message: 'Phone number, message, and sender key are required' });
    }

    try {
        await sendSms(phoneNumber, message, senderKey);
        res.status(200).json({ message: 'SMS sent successfully' });
    } catch (error) {
        console.error('Error sending SMS:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
