import { configureStore } from "@reduxjs/toolkit";
import adminReducer from "./slices/adminSlice";
import  userReducer  from "./slices/userSlice";
import servicesReducer from "./slices/servicesSlice";
import serviceDocumentsReducer from "./slices/serviceDocumentsSlice";
import kycReducer from "./slices/kycSlice";
import orderReducer from "./slices/orderSlice";
import orderDocumentsReducer from "./slices/orderDocumentsSlice";

export const store = configureStore({
  reducer: {
    admin: adminReducer,
    user: userReducer,
    services: servicesReducer,
    serviceDocuments: serviceDocumentsReducer,
    kyc: kycReducer,
    order: orderReducer,
    orderDocuments: orderDocumentsReducer,
  },
});
