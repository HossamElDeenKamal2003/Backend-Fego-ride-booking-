// paytabs.js
const axios = require('axios');
const crypto = require('crypto');

class Paytabs {
    constructor() {
        this.PROFILE_ID = 139883;
        this.SERVER_KEY = 'SMJ9NJNMKR-JJWL2MBMTZ-GGTWRWK2ZBCBK2M9-2P9966-VBMN2N-BQDDBH';
        this.BASE_URL = 'https://secure-egypt.paytabs.com/';
    }

    async sendApiRequest(requestUrl, data, method = 'POST') {
        data['profile_id'] = this.PROFILE_ID;

        try {
            const response = await axios({
                method: method,
                url: this.BASE_URL + requestUrl,
                headers: {
                    'Authorization': 'SMJ9NJNMKR-JJWL2MBMTZ-GGTWRWK2ZBCBK2M9-2P9966-VBMN2N-BQDDBH',
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify(data)
            });

            return response.data;
        } catch (error) {
            console.error('Error in API request:', error.message);
            throw error;
        }
    }

    isValidRedirect(postValues) {
        const serverKey = this.SERVER_KEY;

        const requestSignature = postValues.signature;
        delete postValues.signature;
        
        const fields = Object.keys(postValues).sort().reduce((r, k) => (r[k] = postValues[k], r), {});

        const queryString = new URLSearchParams(fields).toString();
        const signature = crypto.createHmac('sha256', serverKey).update(queryString).digest('hex');

        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(requestSignature));
    }
}

module.exports = Paytabs;
