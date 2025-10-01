import { configureStore } from "@reduxjs/toolkit";
import adminReducer from "./slices/adminSlice";
import  userReducer  from "./slices/userSlice";
import servicesReducer from "./slices/servicesSlice";
import serviceDocumentsReducer from "./slices/serviceDocumentsSlice";
import kycReducer from "./slices/kycSlice";
import orderReducer from "./slices/orderSlice";
import orderDocumentsReducer from "./slices/orderDocumentsSlice";
import profileReducer from "./slices/profileSlice";
import passwordResetReducer from "./slices/passwordResetSlice";
import userOrdersReducer from "./slices/userOrdersSlice";
import salesReducer from "./slices/salesSlice";
import accountsReducer from "./slices/accountsSlice";
import adminUserReducer from "./slices/adminUserSlice";
import operationOrdersReducer from "./slices/operationsSlice";
import adminUserSecondReducer from "./slices/adminUserSliceSecond";
import operationDocumentsReducer from "./slices/operationDeliverableSlice";
import supportTicketsReducer from "./slices/supportTicketsSlice";
import adminOrdersReducer from "./slices/adminOrdersSlice";

export const store = configureStore({
  reducer: {
    admin: adminReducer,
    user: userReducer,
    services: servicesReducer,
    serviceDocuments: serviceDocumentsReducer,
    kyc: kycReducer,
    order: orderReducer,
    orderDocuments: orderDocumentsReducer,
    profile: profileReducer,
    passwordReset: passwordResetReducer,
    userOrders: userOrdersReducer,
    sales: salesReducer,
    accounts: accountsReducer,
    adminUser: adminUserReducer,
    operationOrders: operationOrdersReducer,
    adminUserSecond: adminUserSecondReducer,
    operationDeliverables: operationDocumentsReducer,
    supportTickets: supportTicketsReducer,
    adminOrders: adminOrdersReducer,
  },
});
