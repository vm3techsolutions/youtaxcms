// src/store/slices/kycSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// ==================
// Async Thunks
// ==================
export const uploadKycDocument = createAsyncThunk(
  "kyc/upload",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/kyc/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Upload failed");
    }
  }
);

export const fetchMyKycDocument = createAsyncThunk(
  "kyc/fetchMyDoc",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/kyc");
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Fetch failed");
    }
  }
);

// ==================
// Slice
// ==================
const kycSlice = createSlice({
  name: "kyc",
  initialState: {
    document: null,
    loadingUpload: false,
    loadingFetch: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearKycMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload
      .addCase(uploadKycDocument.pending, (state) => {
        state.loadingUpload = true;
        state.error = null;
      })
      .addCase(uploadKycDocument.fulfilled, (state, action) => {
        state.loadingUpload = false;
        state.document = action.payload;
        state.successMessage = action.payload.message;
      })
      .addCase(uploadKycDocument.rejected, (state, action) => {
        state.loadingUpload = false;
        state.error = action.payload?.message || action.payload || "Upload failed";
      })

      // Fetch My KYC
      .addCase(fetchMyKycDocument.pending, (state) => {
        state.loadingFetch = true;
      })
      .addCase(fetchMyKycDocument.fulfilled, (state, action) => {
        state.loadingFetch = false;
        state.document = action.payload;
      })
      .addCase(fetchMyKycDocument.rejected, (state, action) => {
        state.loadingFetch = false;
        state.error = action.payload?.message || action.payload || "Fetch failed";
      });
  },
});


export const { clearKycMessages } = kycSlice.actions;
export default kycSlice.reducer;
