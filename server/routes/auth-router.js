const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');
const userRegister = require('../controller/userRegister/register');
const otpController = require('../controller/userRegister/verifyotp');


// Define routes for user registration and login
router.post('/user/signup', userRegister.userSignUp);
router.post('/user/login', userRegister.userLogin);

// Password reset routes
router.post("/forgot-password", userRegister.forgotPassword);
router.post("/reset-password", userRegister.resetPassword);

// OTP routes
router.post('/send-otp', verifyToken ,otpController.sendOtp);
router.post('/verify-otp', verifyToken, otpController.verifyOtp);

module.exports = router;
