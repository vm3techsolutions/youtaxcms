"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// ========================
// Async Thunks
// ========================

// 1️⃣ Fetch Pending Orders
export const fetchPendingOrders = createAsyncThunk(
  "sales/fetchPendingOrders",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axiosInstance.get("/orders/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data; // Array of pending orders
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch pending orders");
    }
  }
);

// 2️⃣ Update Document Status (verify/reject)
export const updateDocumentStatus = createAsyncThunk(
  "sales/updateDocumentStatus",
  async ({ order_id, order_document_id, status, remarks }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axiosInstance.put(
        "/orders/document/status",
        { order_id, order_document_id, status, remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { ...res.data, order_id, order_document_id, status }; // Include ids for state update
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update document status");
    }
  }
);

// 3️⃣ Trigger Order Status Check (manual)
export const triggerOrderStatusCheck = createAsyncThunk(
  "sales/triggerOrderStatusCheck",
  async ({ order_id }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axiosInstance.post(
        "/orders/check-status",
        { order_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { ...res.data, order_id };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to trigger order status check");
    }
  }
);

// salesSlice.js
export const fetchOrderPaymentStatus = createAsyncThunk(
  "sales/fetchOrderPaymentStatus",
  async (order_id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axiosInstance.get(`/orders/${order_id}/payments/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { order_id, payment_status: res.data.payment_status };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch payment status");
    }
  }
);


// ========================
// Slice
// ========================

const initialState = {
  pendingOrders: [],
  loadingFetch: false,
  loadingUpdate: false,
  loadingCheck: false,
  error: null,
  success: false,
};

const salesSlice = createSlice({
  name: "sales",
  initialState,
  reducers: {
    resetSalesState: (state) => {
      state.pendingOrders = [];
      state.loadingFetch = false;
      state.loadingUpdate = false;
      state.loadingCheck = false;
      state.error = null;
      state.success = false;
    },
    resetSuccess: (state) => {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Pending Orders
      .addCase(fetchPendingOrders.pending, (state) => {
        state.loadingFetch = true;
        state.error = null;
      })
      .addCase(fetchPendingOrders.fulfilled, (state, action) => {
        state.loadingFetch = false;
        state.pendingOrders = action.payload;
      })
      .addCase(fetchPendingOrders.rejected, (state, action) => {
        state.loadingFetch = false;
        state.error = action.payload;
      })

      // Update Document Status
      .addCase(updateDocumentStatus.pending, (state) => {
        state.loadingUpdate = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateDocumentStatus.fulfilled, (state, action) => {
        state.loadingUpdate = false;
        state.success = true;

        // Update document status locally in pendingOrders if present
        const { order_id, order_document_id, status } = action.payload;
        const order = state.pendingOrders.find((o) => o.id === order_id);
        if (order && order.documents) {
          const doc = order.documents.find((d) => d.id === order_document_id);
          if (doc) doc.status = status;
        }
      })
      .addCase(updateDocumentStatus.rejected, (state, action) => {
        state.loadingUpdate = false;
        state.error = action.payload;
      })

      // Trigger Order Status Check
      .addCase(triggerOrderStatusCheck.pending, (state) => {
        state.loadingCheck = true;
        state.error = null;
        state.success = false;
      })
      .addCase(triggerOrderStatusCheck.fulfilled, (state, action) => {
        state.loadingCheck = false;
        state.success = true;
        // Optionally: refresh pendingOrders or update status locally
      })
      .addCase(triggerOrderStatusCheck.rejected, (state, action) => {
        state.loadingCheck = false;
        state.error = action.payload;
      })

    
      .addCase(fetchOrderPaymentStatus.fulfilled, (state, action) => {
  const { order_id, payment_status } = action.payload;
  const order = state.pendingOrders.find((o) => o.id === order_id);
  if (order) {
    order.payment_status = payment_status;
  }
});


  },
});

export const { resetSalesState, resetSuccess } = salesSlice.actions;
export default salesSlice.reducer;
