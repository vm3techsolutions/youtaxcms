// store/slices/salesKycSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// Fetch pending KYC
export const fetchPendingKyc = createAsyncThunk(
  "kyc/fetchPending",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/kyc/pending");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Verify / Reject KYC
export const verifyKyc = createAsyncThunk(
  "kyc/verify",
  async ({ kyc_id, status, remarks }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/kyc/verify/${kyc_id}`, {
        status,
        remarks,
      });
      // Return customer_id from API for frontend mapping
      return {
        ...data,
        kyc_id,
      };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Fetch reviewed KYC
export const fetchReviewedKyc = createAsyncThunk(
  "kyc/fetchReviewed",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/kyc/reviewed");
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const salesKycSlice = createSlice({
  name: "salesKyc",
  initialState: {
    pending: [],
    reviewed: [],
    loading: false,
    error: null,
    verifyStatus: null,
  },
  reducers: {
    resetKycState: (state) => {
      state.pending = [];
      state.reviewed = [];
      state.loading = false;
      state.error = null;
      state.verifyStatus = null;
    },
  },
  extraReducers: (builder) => {
    // Pending
    builder.addCase(fetchPendingKyc.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchPendingKyc.fulfilled, (state, action) => {
      state.loading = false;
      state.pending = action.payload;
    });
    builder.addCase(fetchPendingKyc.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Verify
    builder.addCase(verifyKyc.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.verifyStatus = null;
    });
    builder.addCase(verifyKyc.fulfilled, (state, action) => {
      state.loading = false;
      state.verifyStatus = action.payload.message;

      // Remove from pending
      state.pending = state.pending.filter(
        (doc) => doc.id !== action.payload.kyc_id
      );

      // Add to reviewed
      state.reviewed.push({
        ...action.payload,
        id: action.payload.kyc_id,
        customer_id: action.payload.customer_id, // ensure this exists
      });
    });
    builder.addCase(verifyKyc.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Reviewed
    builder.addCase(fetchReviewedKyc.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchReviewedKyc.fulfilled, (state, action) => {
      state.loading = false;
      state.reviewed = action.payload;
    });
    builder.addCase(fetchReviewedKyc.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { resetKycState } = salesKycSlice.actions;
export default salesKycSlice.reducer;
