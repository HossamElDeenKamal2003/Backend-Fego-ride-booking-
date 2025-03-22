const axios = require('axios');

const sendOtpWithQuery = async (phoneNumber, otp) => {
    try {
        const response = await axios.get('https://smsmisr.com/api/OTP/', {
            params: {
                environment: 2, // Test environment
                username: 'd6a935c84a6701b7765d0c7aba921fbaa258a328003554b00fe56cad81b2b622', // Your username
                password: '56b0c503aa1fb0023332af092a70fa5cfa05b121fa6d686e2016c8ec96b91233', // Your password
                sender: 'b611afb996655a94c8e942a823f1421de42bf8335d24ba1f84c437b2ab11ca27', // Your sender ID
                mobile: phoneNumber,
                template: '5f0b0e60ee65179573bdad2f7e9da5d4f89547a44cb15ff5a134a5d595cffc47', // Your template ID
                otp: otp
            }
        });

        if (response.data.code === '4901') {
            console.log('OTP sent successfully.');
        } else {
            console.error('Failed to send OTP:', response.data);
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
    }
};
