const express = require('express');
const router = express.Router();
const { signUp, login, updatePassword, verifyLogin, deleteCoupon, sendVerificationCode, forgetPassword, addCoupon, sendVerificationForgetPass, checkEmail, patchBlock,handleToken, sendVerification, verifyCode, patchAlerts } = require('../../controller/userController/userController');
const upload = require('../../middlewares/fiels');
const {
    patchRole,
    deleteUser,
    getSupports,
    siginupSupport,
} = require('../../controller/userController/support');
// Sign-up route
router.post('/signup',upload.single('profile_image'), signUp);
router.patch('/block/:id', patchBlock);

router.patch('/increament-alerts/:id', patchAlerts);
// Login route
router.post('/login', login);
router.patch('/updatepassword', updatePassword);
router.patch('/handle-token/:id', handleToken);
router.patch('/patchRole', patchRole);
router.delete('/delete-permission/:id', deleteUser);
router.get('/get_supports', getSupports);
router.post('/support_signup', siginupSupport);
router.post('/send-verification', sendVerification);
router.post('/verify-code', verifyCode);
router.post('/sendVerificationForgetPass', sendVerificationForgetPass);
router.patch('/forgetPassword', forgetPassword);
router.post('/check-email', checkEmail);
router.post('/sendVerificationCode', sendVerificationCode);
router.post('/verifyLogin', verifyLogin);
router.post('/add-coupon', addCoupon);
router.delete('/delete-coupon', deleteCoupon);
//Hossam El Deen Kamal Boshta
module.exports = router;
