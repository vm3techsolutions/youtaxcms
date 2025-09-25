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
      localStorage.getItem(key) ||
      sessionStorage.getItem(key)
    );
  }
  return null;
};

// Async thunk: Login
export const loginUser = createAsyncThunk(
  "user/login",
  async ({ credentials, rememberMe }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/user/login", credentials);

      if (typeof window !== "undefined") {
        const storage = rememberMe ? localStorage : sessionStorage;
        const sessionId = generateSessionId(); // unique for this browser

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

const userSlice = createSlice({
  name: "user",
  initialState: {
    userInfo: getStorageItem("userInfo")
      ? JSON.parse(getStorageItem("userInfo"))
      : null,
    token: getStorageItem("token") || null,
    sessionId: getStorageItem("sessionId") || null, // track per-browser session
    loading: false,
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
          // If no sessionId in this browser, force logout
          state.userInfo = null;
          state.token = null;
          state.sessionId = null;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
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
      });
  },
});

export const { logout, clearMessages, checkSession } = userSlice.actions;
export default userSlice.reducer;
