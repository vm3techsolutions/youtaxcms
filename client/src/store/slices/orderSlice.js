"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// --------------------- Async Thunks ---------------------

// Create order + Razorpay payment link
export const createOrder = createAsyncThunk(
  "orders/createOrder",
  async (orderData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axiosInstance.post("/create-order", orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data; // returns { order, razorpay }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create order");
    }
  }
);

// Verify Razorpay payment link
export const verifyPaymentLink = createAsyncThunk(
  "orders/verifyPaymentLink",
  async ({ payment_id, payment_link_id, signature }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axiosInstance.post(
        "/verify-payment",
        { payment_id, payment_link_id, signature },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Expect backend to return: { success: true, order_id: 123 }
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to verify payment");
    }
  }
);

// --------------------- Slice ---------------------

const initialState = {
  order: null,
  razorpayLink: null,
  loading: false,
  error: null,
  success: false,
  paymentVerified: false,
  verifiedOrderId: null, // <-- store verified order id
};

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    resetOrderState: (state) => {
      state.order = null;
      state.razorpayLink = null;
      state.loading = false;
      state.error = null;
      state.success = false;
      state.paymentVerified = false;
      state.verifiedOrderId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.order = action.payload.order;
        state.razorpayLink = action.payload.razorpay?.payment_link;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Verify Payment
      .addCase(verifyPaymentLink.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyPaymentLink.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentVerified = action.payload.success;
        if (action.payload.success) {
          state.verifiedOrderId = action.payload.order_id; // <-- store order_id
        }
      })
      .addCase(verifyPaymentLink.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetOrderState } = ordersSlice.actions;
export default ordersSlice.reducer;
