import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// Fetch assigned orders for logged-in operation user
export const fetchAssignedOrdersForOperations = createAsyncThunk(
  "operations/fetchAssignedOrders",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/operations/orders/assigned");
      console.log("✅ Assigned Orders API Response:", res.data);

      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Error loading orders");
    }
  }
);

// Upload deliverable
export const uploadDeliverable = createAsyncThunk(
  "operations/uploadDeliverable",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/operations/upload/deliverable", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.message;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Error uploading deliverable");
    }
  }
);

const operationsSlice = createSlice({
  name: "operations",
  initialState: {
    assignedOrders: [],
    loadingOrders: false,
    uploading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.success = null;
    },
    resetOperationsState: (state) => {
      state.assignedOrders = [];
      state.loadingOrders = false;
      state.uploading = false;
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignedOrdersForOperations.pending, (state) => {
        state.loadingOrders = true;
        state.error = null;
      })
      .addCase(fetchAssignedOrdersForOperations.fulfilled, (state, action) => {
        state.loadingOrders = false;
        state.assignedOrders = action.payload;
      })
      .addCase(fetchAssignedOrdersForOperations.rejected, (state, action) => {
        state.loadingOrders = false;
        state.error = action.payload;
      })
      .addCase(uploadDeliverable.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadDeliverable.fulfilled, (state, action) => {
        state.uploading = false;
        state.success = action.payload;
      })
      .addCase(uploadDeliverable.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMessages, resetOperationsState } = operationsSlice.actions;
export default operationsSlice.reducer;
