"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// Helper to generate session ID
const generateSessionId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// Helpers to safely get from storage
const getStorageItem = (key) => {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem(key) || sessionStorage.getItem(key)
    );
  }
  return null;
};

// ✅ Async thunk: Login
export const loginUser = createAsyncThunk(
  "user/login",
  async ({ credentials, rememberMe }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/user/login", credentials);

      if (typeof window !== "undefined") {
        const storage = rememberMe ? localStorage : sessionStorage;
        const sessionId = generateSessionId();

        storage.setItem("token", response.data.token);
        storage.setItem("userInfo", JSON.stringify(response.data.customer));
        storage.setItem("sessionId", sessionId);
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Login failed" }
      );
    }
  }
);

// ✅ Async thunk: Send OTP
export const sendOtp = createAsyncThunk(
  "user/sendOtp",
  async (type, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().user;
      const response = await axiosInstance.post(
        "/send-otp",
        { type },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return { type, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "OTP send failed" });
    }
  }
);

// ✅ Async thunk: Verify OTP
export const verifyOtp = createAsyncThunk(
  "user/verifyOtp",
  async ({ type, otp }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().user;
      const response = await axiosInstance.post(
        "/verify-otp",
        { type, otp },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return { type, message: response.data.message };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "OTP verification failed" });
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState: {
    userInfo: getStorageItem("userInfo")
      ? JSON.parse(getStorageItem("userInfo"))
      : null,
    token: getStorageItem("token") || null,
    sessionId: getStorageItem("sessionId") || null,
    loading: false,
    otpLoading: false,
    verifyLoading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    logout: (state) => {
      state.userInfo = null;
      state.token = null;
      state.sessionId = null;
      state.successMessage = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("userInfo");
        localStorage.removeItem("token");
        localStorage.removeItem("sessionId");
        sessionStorage.removeItem("userInfo");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("sessionId");
      }
    },
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    checkSession: (state) => {
      if (typeof window !== "undefined") {
        const sessionId = getStorageItem("sessionId");
        if (!sessionId) {
          state.userInfo = null;
          state.token = null;
          state.sessionId = null;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.userInfo = action.payload.customer;
        state.sessionId = getStorageItem("sessionId");
        state.successMessage = action.payload.message;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message || "Login failed";
      })

      // ✅ Send OTP
      .addCase(sendOtp.pending, (state) => {
        state.otpLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(sendOtp.fulfilled, (state, action) => {
        state.otpLoading = false;
        state.successMessage = action.payload.message || "OTP sent successfully";
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.otpLoading = false;
        state.error = action.payload.message || "OTP send failed";
      })

      // ✅ Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.verifyLoading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.verifyLoading = false;
        state.successMessage = action.payload.message;

        // 🔑 Update verification status
        if (state.userInfo) {
          if (action.payload.type === "email") {
            state.userInfo.isEmailVerified = true;
          } else if (action.payload.type === "phone") {
            state.userInfo.isPhoneVerified = true;
          }

          if (typeof window !== "undefined") {
            localStorage.setItem("userInfo", JSON.stringify(state.userInfo));
            sessionStorage.setItem("userInfo", JSON.stringify(state.userInfo));
          }
        }
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.verifyLoading = false;
        state.error = action.payload.message || "OTP verification failed";
      });
  },
});

export const { logout, clearMessages, checkSession } = userSlice.actions;
export default userSlice.reducer;
