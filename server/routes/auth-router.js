const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');
const userRegister = require('../controller/userRegister/register');
const otpController = require('../controller/userRegister/verifyotp');
// admin routes
const adminRegister = require('../controller/adminController/adminRoles/adminRoles');
const userMyprofile = require('../controller/userMyprofile/customerMyprofile');
const adminUsers = require('../controller/adminController/adminUsers/adminUsers');

// Define routes for user registration and login
router.post('/user/signup', userRegister.userSignUp);
router.post('/user/login', userRegister.userLogin);

// MyProfile Routes (protected with JWT)
router.post("/customerprofile", verifyToken, userMyprofile.createMyProfile);
router.get("/customerprofile", verifyToken, userMyprofile.getMyProfiles);
router.get("/customerprofile/:id", verifyToken, userMyprofile.getMyProfileById);
router.put("/customerprofile", verifyToken, userMyprofile.updateMyProfile);


// Password reset routes
router.post("/forgot-password", userRegister.forgotPassword);
router.post("/reset-password", userRegister.resetPassword);

// OTP routes
router.post('/send-otp', verifyToken ,otpController.sendOtp);
router.post('/verify-otp', verifyToken, otpController.verifyOtp);


// Admin routes
router.get('/admin/roles', adminRegister.getAdminRoles);
router.post('/admin/users',verifyToken, adminUsers.createAdminUser);
router.post('/admin/login', adminUsers.adminLogin);
router.get('/admin/users', verifyToken, adminUsers.getAdminUsers);


module.exports = router;
