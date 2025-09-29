const express = require('express');
const router = express.Router();

const {verifyToken} = require('../middleware/auth');
const userRegister = require('../controller/userRegister/register');
const otpController = require('../controller/userRegister/verifyotp');
const userMyprofile = require('../controller/userMyprofile/customerMyprofile');
const orderController = require('../controller/order/createOrder');
const upload = require("../config/multer");
const kycController = require("../controller/userMyprofile/kycUpload");
const orderDocuments = require("../controller/orderDocument/orderDocuments");
const supportController = require("../controller/supportTicket/support");
// admin routes
const adminRegister = require('../controller/adminController/adminRoles/adminRoles');
const adminUsers = require('../controller/adminController/adminUsers/adminUsers');
const services = require('../controller/services/services');
const serviceDocuments = require('../controller/services/serviceDocuments');
const adminCoustomerController = require('../controller/adminController/adminCoustomerController/adminCoustomerController');
const { isSales } = require('../middleware/auth');
const salesController = require('../controller/adminController/salesController/sales');
const accountController = require('../controller/adminController/accountController/account');
const { isAccount } = require('../middleware/auth');
const operationController = require('../controller/adminController/operationController/operation');
const { isOperation } = require('../middleware/auth');
const adminControllerScond = require('../controller/adminController/adminControllerSecond/admin');
const { isAdmin } = require('../middleware/auth');


// Define routes for user registration and login
router.post('/user/signup', userRegister.userSignUp);
router.post('/user/login', userRegister.userLogin);

// MyProfile Routes (protected with JWT)
router.post("/customerprofile", verifyToken, userMyprofile.createMyProfile);
router.get("/customerprofile", verifyToken, userMyprofile.getMyProfiles);
router.get("/customerprofile/:id", verifyToken, userMyprofile.getMyProfileById);
router.put("/customerprofile", verifyToken, userMyprofile.updateMyProfile);

// KYC Routes 
router.post("/kyc/upload",verifyToken,upload.single("document"),kycController.uploadKycDocument);
router.get("/kyc", verifyToken, kycController.getMyKycDocuments);
// router.get("/kyc/all", verifyToken, kycController.getAllKycDocuments);



// Password reset routes
router.post("/forgot-password", userRegister.forgotPassword);
router.post("/reset-password", userRegister.resetPassword);

// OTP routes
router.post('/send-otp', verifyToken ,otpController.sendOtp);
router.post('/verify-otp', verifyToken, otpController.verifyOtp);
router.get('/verification-status', verifyToken, otpController.getVerificationStatus);

// Order Routes
router.post("/create-order", verifyToken, orderController.createOrder);
router.post("/verify-payment", verifyToken, orderController.verifyPaymentLink);
router.post("/pending-orders", verifyToken, orderController.createPendingPaymentLink);
// Get My Orders
router.get("/my/orders", verifyToken, orderController.getMyOrders);
router.get("/order/:customer_id", verifyToken, orderController.getOrdersByCustomerId);
router.get("/order/:order_id/payments", verifyToken, orderController.getOrderPayments);
router.get("/pending-payments", verifyToken, orderController.getPendingPaymentsByCustomerId);

// Order Document Routes
router.post("/upload/order-document",verifyToken,  upload.array("files"),    orderDocuments.uploadOrderDocument);
router.get("/order-documents/:order_id", verifyToken, orderDocuments.getOrderDocuments);

// Support Ticket Routes
router.post("/support/ticket", verifyToken, supportController.createTicket);
router.get("/support/tickets", verifyToken, supportController.listTickets);

// ===========================================================================

// Admin routes
router.get('/admin/roles', adminRegister.getAdminRoles);
router.post('/admin/users',verifyToken, adminUsers.createAdminUser);
router.post('/admin/login', adminUsers.adminLogin);
router.get('/admin/users', verifyToken, adminUsers.getAdminUsers);
router.get('/admin/users/role/:roleId', verifyToken, adminUsers.getAdminUsersByRole);

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

//adminCustomerController
router.get('/admin/customer/:id', verifyToken, adminCoustomerController.getUserById);
router.get('/admin/customers', verifyToken, adminCoustomerController.getAllUsers);


// sales routes

// Routes
router.get("/orders/pending",verifyToken, isSales, salesController.getPendingOrders);
router.put("/orders/document/status",verifyToken, isSales, salesController.updateDocumentStatusByOrderDId);
router.post("/orders/check-status",verifyToken, isSales, salesController.triggerOrderStatusCheck);


// router.put("/documents/verify",verifyToken, isSales, salesController.verifyDocument);
// router.post("/orders/forward",verifyToken, isSales, salesController.forwardToAccounts);



// accounts routes
router.get("/accounts/orders/pending", verifyToken, isAccount ,accountController.getPendingOrdersForAccounts);
router.get("/accounts/orders/:id/payments", verifyToken, isAccount ,accountController.getOrderPayments);
router.post("/accounts/orders/forward", verifyToken, isAccount ,accountController.forwardToOperations);



// operation routes
router.get("/operations/orders/assigned", verifyToken , isOperation, operationController.getAssignedOrdersForOperations);
router.post("/operations/upload/deliverable", verifyToken , isOperation, upload.array("files"), operationController.uploadDeliverable);
router.get("/operations/upload/deliverable/:order_id", verifyToken , isOperation, operationController.getDeliverablesForOrder);
router.get("/operations/upload/deliverablebyid/:id", verifyToken , isOperation, operationController.getDeliverableById);


// admin routes second
router.get("/admin/orders/all", verifyToken , isAdmin, adminControllerScond.getAssignedOrdersForAdmin);
router.get("/admin/orders/deliverables/:order_id", verifyToken , isAdmin, adminControllerScond.getDeliverablesForAdmin);
router.put("/admin/orders/qc-deliverable", verifyToken , isAdmin, adminControllerScond.qcDeliverable);
router.get("/admin/orders/approved/:order_id", verifyToken , isAdmin, adminControllerScond.getApprovedDeliverablesForOrder);
router.put("/admin/orders/approve-completion", verifyToken , isAdmin, adminControllerScond.approveOrderCompleted);



module.exports = router;
