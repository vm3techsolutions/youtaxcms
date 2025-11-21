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
const deliverablesController = require("../controller/deliverables/deliverables");
// admin routes
const adminRegister = require('../controller/adminController/adminRoles/adminRoles');
const adminUsers = require('../controller/adminController/adminUsers/adminUsers');
const services = require('../controller/services/services');
const categoryController = require('../controller/services/serviceCategory/categoryController');
const serviceDocuments = require('../controller/services/serviceDocuments');
const serviceInput = require('../controller/services/serviceInput/serviceInputController');
const serviceOrderInput = require('../controller/services/serviceInput/orderInputController');
const adminCoustomerController = require('../controller/adminController/adminCoustomerController/adminCoustomerController');
const { isSales } = require('../middleware/auth');
const salesController = require('../controller/adminController/salesController/sales');
const salesKycController = require('../controller/adminController/salesController/salesKyc');
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

// customer stats
router.get("/user/stats", verifyToken, userRegister.getCustomerStats);

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


//Order Receipt
router.get("/receipts/:paymentId/signed-url", orderController.getSignedReceiptUrl);


// Support Ticket Routes
router.post("/support/ticket", verifyToken, supportController.createTicket);
router.get("/support/tickets", verifyToken, supportController.listTickets);

// Deliverables Routes
router.get("/download/deliverables", verifyToken, deliverablesController.getDeliverablesByCustomerId);


// ===========================================================================

// Admin routes
router.get('/admin/roles', adminRegister.getAdminRoles);
router.post('/admin/users',verifyToken, adminUsers.createAdminUser);
router.post('/admin/login', adminUsers.adminLogin);
router.get('/admin/users', verifyToken, adminUsers.getAdminUsers);
router.get('/admin/users/role/:roleId', verifyToken, adminUsers.getAdminUsersByRole);
router.put('/admin/users', verifyToken, adminUsers.editAdminUser);

// Service Catalog Routes
router.post("/services", verifyToken, services.createService);
router.get("/services", services.getAllServices);
router.get("/service/:id", services.getServiceById);
router.get("/service-by-category/:category_id", services.getServiceByCategoryId);
router.put("/service/:id", verifyToken, services.updateService);
router.put("/service/toggle-status/:id", verifyToken, services.toggleServiceStatus);
router.get("/servicesWithInactive", services.getAllServicesWithInactive)
router.delete("/service/:id", verifyToken, services.deleteService);
// Service Category Routes
router.post("/service-categories", verifyToken, categoryController.createCategory);
router.get("/service-categories", categoryController.getAllCategories);
router.get("/service-category/:id", categoryController.getCategoryById);
router.put("/service-category/:id", verifyToken, categoryController.updateCategory);
router.delete("/service-category/:id", verifyToken, categoryController.deleteCategory);
// Service Documents Routes
router.post("/service-documents", verifyToken, serviceDocuments.createServiceDocument);
router.get("/service-documents/service/:serviceId", serviceDocuments.getDocumentsByService);
router.get("/service-document/:id", serviceDocuments.getServiceDocumentById);

router.put("/service-document/:id", verifyToken, serviceDocuments.updateServiceDocument);
router.delete("/service-document/:id", verifyToken, serviceDocuments.deleteServiceDocument);

// service inpute
router.post("/service-input", verifyToken, serviceInput.createServiceInput);
router.get("/service-inputs/service/:serviceId", serviceInput.getServiceInputsByService);
router.get("/service-input/:id", serviceInput.getServiceInputById);
router.put("/service-input/:id", verifyToken, serviceInput.updateServiceInput);
router.delete("/service-input/:id", verifyToken, serviceInput.deleteServiceInput);
// service order input
router.post("/order-input", verifyToken, serviceOrderInput.submitOrderInput);
router.get("/order-inputs/order/:order_id", verifyToken, serviceOrderInput.getOrderInputs);

//adminCustomerController
//user
router.get('/admin/customer/:id', verifyToken, adminCoustomerController.getUserById);
router.get('/admin/customers', verifyToken, adminCoustomerController.getAllUsers);
//orders
router.get('/admin/customers/all/orders', verifyToken, adminCoustomerController.getAllOrders);
router.get('/admin/customers/all/orders/service/:service_id', verifyToken, adminCoustomerController.getOrdersByServiceId);
//order_logs
router.get('/admin/customers/all/orders/logs', verifyToken, adminCoustomerController.getAllOrderLogs);
router.get('/admin/customers/all/orders/logs/:order_id', verifyToken, adminCoustomerController.getOrderLogsByOrderId);



// sales routes

// Routes
router.get("/orders/pending",verifyToken, isSales, salesController.getPendingOrders);
router.put("/orders/document/status",verifyToken, isSales, salesController.updateDocumentStatusByOrderDId);
router.post("/orders/check-status",verifyToken, isSales, salesController.triggerOrderStatusCheck);
// sales KYC routes
router.get("/kyc/pending",verifyToken, isSales, salesKycController.getPendingKycDocuments);
router.put("/kyc/verify/:kyc_id",verifyToken, isSales, salesKycController.verifyKycDocument);
router.get("/kyc/reviewed",verifyToken, isSales, salesKycController.getReviewedKycDocuments);

// router.put("/documents/verify",verifyToken, isSales, salesController.verifyDocument);
// router.post("/orders/forward",verifyToken, isSales, salesController.forwardToAccounts);



// accounts routes
router.get("/accounts/orders/pending", verifyToken, isAccount ,accountController.getPendingOrdersForAccounts);
router.get("/accounts/orders/:id/payments", verifyToken, isAccount ,accountController.getOrderPayments);
router.post("/accounts/orders/forward", verifyToken, isAccount ,accountController.forwardToOperations);
router.get("/accounts/operation-users",verifyToken ,isAccount, accountController.getOperationUsersForDropdown);



// operation routes
router.get("/operations/orders/assigned", verifyToken , isOperation, operationController.getAssignedOrdersForOperations);
router.post("/operations/upload/deliverable", verifyToken , isOperation, upload.array("files"), operationController.uploadDeliverable);
router.get("/operations/upload/deliverable/:order_id", verifyToken , isOperation, operationController.getDeliverablesForOrder);
router.get("/operations/upload/deliverablebyid/:id", verifyToken , isOperation, operationController.getDeliverableById);
router.get("/operations/upload/all/deliverable", verifyToken , isOperation, operationController.getAllDeliverablesWithCustomerAndService);


// admin routes second
router.get("/admin/orders/all", verifyToken , isAdmin, adminControllerScond.getAssignedOrdersForAdmin);
router.get("/admin/orders/deliverables/:order_id", verifyToken , isAdmin, adminControllerScond.getDeliverablesForAdmin);
router.put("/admin/orders/qc-deliverable", verifyToken , isAdmin, adminControllerScond.qcDeliverable);
router.get("/admin/orders/approved/:order_id", verifyToken , isAdmin, adminControllerScond.getApprovedDeliverablesForOrder);
router.put("/admin/orders/approve-completion", verifyToken , isAdmin, adminControllerScond.approveOrderCompleted);



module.exports = router;
