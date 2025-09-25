import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// 🔹 Helpers to safely get from storage
const getStorageItem = (key) => {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem(key) ||
      sessionStorage.getItem(key) // check both storages
    );
  }
  return null;
};

// Async thunks
export const signupUser = createAsyncThunk(
  "user/signup",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/user/signup", userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Signup failed" }
      );
    }
  }
);

export const loginUser = createAsyncThunk(
  "user/login",
  async ({ credentials, rememberMe }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/user/login", credentials);

      if (typeof window !== "undefined") {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("token", response.data.token);
        storage.setItem("userInfo", JSON.stringify(response.data.customer));
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Login failed" }
      );
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "user/forgotPassword",
  async (emailData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/forgot-password", emailData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { error: "Request failed" }
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  "user/resetPassword",
  async (resetData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/reset-password", resetData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { error: "Reset failed" }
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
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    logout: (state) => {
      state.userInfo = null;
      state.token = null;
      state.successMessage = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("userInfo");
        localStorage.removeItem("token");
        sessionStorage.removeItem("userInfo");
        sessionStorage.removeItem("token");
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Signup
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      })

      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.userInfo = action.payload.customer; // ✅ consistent
        state.successMessage = action.payload.message;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.message;
      })

      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.error;
      })

      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload.error;
      });
  },
});

export const { logout } = userSlice.actions;
export default userSlice.reducer;
