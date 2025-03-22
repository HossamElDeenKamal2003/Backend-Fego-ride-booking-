// const https = require('https');
// const { URL } = require('url');

// class Paytabs {
//     static PROFILE_ID = "STJ9NJNMKN-JJWL2MDDHK-KZDJJG9JGTCKK2M9-2P9766-VBMNDD-QNR6DD";
//     static SERVER_KEY = 'SMJ9NJNMKR-JJWL2MBMTZ-GGTWRWK2ZBCBK2M9-2P9966-VBMN2N-BQDDBH';
//     static BASE_URL = 'https://secure-egypt.paytabs.com/';

//     // Method to send API request
//     sendApiRequest(requestUrl, data, requestMethod = 'POST') {
//         return new Promise((resolve, reject) => {
//             data.profile_id = Paytabs.PROFILE_ID;

//             const options = {
//                 hostname: new URL(Paytabs.BASE_URL).hostname,
//                 path: requestUrl,
//                 method: requestMethod,
//                 headers: {
//                     'Authorization': Paytabs.SERVER_KEY,
//                     'Content-Type': 'application/json'
//                 }
//             };

//             const req = https.request(options, (res) => {
//                 let responseBody = '';

//                 res.on('data', (chunk) => {
//                     responseBody += chunk;
//                 });

//                 res.on('end', () => {
//                     resolve(JSON.parse(responseBody));
//                 });
//             });

//             req.on('error', (error) => {
//                 reject(error);
//             });

//             // Send JSON data
//             req.write(JSON.stringify(data));
//             req.end();
//         });
//     }

//     // Method to get the base URL
//     getBaseUrl(req) {
//         const currentPath = req.url;
//         const hostName = req.headers.host;
//         const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';

//         // Return: http://localhost/myproject/
//         return `${protocol}://${hostName}${currentPath}`;
//     }

//     // Method to validate the redirect
//     isValidRedirect(postValues) {
//         const serverKey = Paytabs.SERVER_KEY;

//         // Request body include a signature post Form URL encoded field
//         const requestSignature = postValues.signature;
//         delete postValues.signature;

//         const fields = Object.fromEntries(Object.entries(postValues).filter(([_, v]) => v !== null && v !== undefined));

//         // Sort form fields
//         const sortedFields = Object.keys(fields).sort().reduce((obj, key) => {
//             obj[key] = fields[key];
//             return obj;
//         }, {});

//         // Generate URL-encoded query string of Post fields except signature field.
//         const query = new URLSearchParams(sortedFields).toString();
//         const signature = this.hashHmac('sha256', query, serverKey);

//         return this.hashEquals(signature, requestSignature);
//     }

//     // Helper method to generate HMAC
//     hashHmac(algorithm, data, key) {
//         const crypto = require('crypto');
//         return crypto.createHmac(algorithm, key).update(data).digest('hex');
//     }

//     // Helper method to compare two hashes in a constant time
//     hashEquals(hash1, hash2) {
//         return crypto.timingSafeEqual(Buffer.from(hash1, 'hex'), Buffer.from(hash2, 'hex'));
//     }
// }

// module.exports = Paytabs;
