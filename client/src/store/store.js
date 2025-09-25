import { configureStore } from "@reduxjs/toolkit";
import adminReducer from "./slices/adminSlice";
import  userReducer  from "./slices/userSlice";
import servicesReducer from "./slices/servicesSlice";

export const store = configureStore({
  reducer: {
    admin: adminReducer,
    user: userReducer,
    services: servicesReducer,
  },
});
