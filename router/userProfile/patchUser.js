const express = require('express'); 
const router = express.Router();
const upload = require('../../middlewares/fiels');
const {
    updateProfileimage,
    updateEmail,
    updateUsername,
    updatePhoneNumber,
    updatePassword,
    getUser
} = require('../../controller/userprofile/patchUserdata');

// Define the routes
router.patch('/updateusername/:id', updateUsername);
router.patch('/update-email/:id', updateEmail);
router.patch('/update-phone-number/:id', updatePhoneNumber);
router.patch('/change-password/:id', updatePassword);
router.patch('/change-profile-image/:id', upload.fields([{ name: 'profile_image', maxCount: 1 }]), updateProfileimage);
router.get('/getUser/:id', getUser)
module.exports = router; 
