"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// --------------------- Async Thunks ---------------------

// Fetch orders for logged-in user (/my/orders)
export const fetchUserOrders = createAsyncThunk(
  "userOrders/fetchUserOrders",
  async (_, { rejectWithValue }) => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const res = await axiosInstance.get("/my/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      return res.data.orders;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch user orders"
      );
    }
  }
);

// Fetch orders by customer ID (/order/:customer_id)
export const fetchOrdersByCustomerId = createAsyncThunk(
  "userOrders/fetchOrdersByCustomerId",
  async (customerId, { rejectWithValue }) => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const res = await axiosInstance.get(`/order/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle both array or object with orders
      return Array.isArray(res.data) ? res.data : res.data.orders || [];
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch orders by customer ID"
      );
    }
  }
);


// Fetch documents for a specific order
export const fetchUserOrderDocuments = createAsyncThunk(
  "userOrders/fetchUserOrderDocuments",
  async (orderId, { rejectWithValue }) => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const res = await axiosInstance.get(`/order-documents/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return { orderId, documents: res.data };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch order documents"
      );
    }
  }
);

// Fetch payments for a specific order
export const fetchOrderPayments = createAsyncThunk(
  "userOrders/fetchOrderPayments",
  async (orderId, { rejectWithValue }) => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const res = await axiosInstance.get(`/order/${orderId}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // API returns { success, payments }
      return { orderId, payments: res.data.payments || [] };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch order payments"
      );
    }
  }
);


// --------------------- Slice ---------------------

const initialState = {
  orders: [],
  orderDocuments: {}, // { orderId: [documents] }
  orderPayments: {}, 
  loadingOrders: false,
  loadingDocuments: false,
  error: null,
};

const userOrdersSlice = createSlice({
  name: "userOrders",
  initialState,
  reducers: {
    resetUserOrders: (state) => {
      state.orders = [];
      state.orderDocuments = {};
      state.loadingOrders = false;
      state.loadingDocuments = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Orders (/my/orders)
      .addCase(fetchUserOrders.pending, (state) => {
        state.loadingOrders = true;
        state.error = null;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.loadingOrders = false;
        state.orders = action.payload;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.loadingOrders = false;
        state.error = action.payload;
      })

      // Fetch Orders by Customer ID (/order/:customer_id)
      .addCase(fetchOrdersByCustomerId.pending, (state) => {
        state.loadingOrders = true;
        state.error = null;
      })
      .addCase(fetchOrdersByCustomerId.fulfilled, (state, action) => {
        state.loadingOrders = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrdersByCustomerId.rejected, (state, action) => {
        state.loadingOrders = false;
        state.error = action.payload;
      })

      // Fetch Order Documents
      .addCase(fetchUserOrderDocuments.pending, (state) => {
        state.loadingDocuments = true;
        state.error = null;
      })
      .addCase(fetchUserOrderDocuments.fulfilled, (state, action) => {
        state.loadingDocuments = false;
        state.orderDocuments[action.payload.orderId] =
          action.payload.documents;
      })
      .addCase(fetchUserOrderDocuments.rejected, (state, action) => {
        state.loadingDocuments = false;
        state.error = action.payload;
      })

            // Fetch Order Payments
      .addCase(fetchOrderPayments.pending, (state) => {
        state.loadingPayments = true;
        state.error = null;
      })
      .addCase(fetchOrderPayments.fulfilled, (state, action) => {
        state.loadingPayments = false;
        state.orderPayments[action.payload.orderId] = action.payload.payments;
      })
      .addCase(fetchOrderPayments.rejected, (state, action) => {
        state.loadingPayments = false;
        state.error = action.payload;
      });

  },
});

export const { resetUserOrders } = userOrdersSlice.actions;
export default userOrdersSlice.reducer;
