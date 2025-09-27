import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance"; // make sure you have axiosInstance configured

// Forgot Password
export const forgotPassword = createAsyncThunk(
  "password/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/forgot-password", { email });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { error: "Failed to send reset link" });
    }
  }
);

// Reset Password
export const resetPassword = createAsyncThunk(
  "password/resetPassword",
  async ({ token, newPassword }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/reset-password", { token, newPassword });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { error: "Failed to reset password" });
    }
  }
);

const passwordResetSlice = createSlice({
  name: "passwordReset",
  initialState: {
    loading: false,
    successMessage: null,
    error: null,
  },
  reducers: {
    clearPasswordMessages: (state) => {
      state.successMessage = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.successMessage = null;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message || "Password reset link sent!";
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to send reset link";
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.successMessage = null;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message || "Password updated successfully";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || "Failed to reset password";
      });
  },
});

export const { clearPasswordMessages } = passwordResetSlice.actions;
export default passwordResetSlice.reducer;
