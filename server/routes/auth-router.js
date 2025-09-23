const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/auth');
const userRegister = require('../controller/userRegister/register');
const otpController = require('../controller/userRegister/verifyotp');
const userMyprofile = require('../controller/userMyprofile/customerMyprofile');
// admin routes
const adminRegister = require('../controller/adminController/adminRoles/adminRoles');
const adminUsers = require('../controller/adminController/adminUsers/adminUsers');
const services = require('../controller/services/services');
const serviceDocuments = require('../controller/services/serviceDocuments');

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

// Service Catalog Routes
router.post("/services", verifyToken, services.createService);
router.get("/services", services.getAllServices);
router.get("/service/:id", services.getServiceById);
router.put("/service/:id", verifyToken, services.updateService);
router.delete("/service/:id", verifyToken, services.deleteService);

// Service Documents Routes
router.post("/service-documents", verifyToken, serviceDocuments.createServiceDocument);
router.get("/service-documents/service/:serviceId", serviceDocuments.getDocumentsByService);
router.get("/service-document/:id", serviceDocuments.getServiceDocumentById);

router.put("/service-document/:id", verifyToken, serviceDocuments.updateServiceDocument);
router.delete("/service-document/:id", verifyToken, serviceDocuments.deleteServiceDocument);


module.exports = router;
