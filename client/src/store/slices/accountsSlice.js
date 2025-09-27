// src/store/slices/accountsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// ✅ 1. Fetch pending orders
export const fetchPendingOrdersForAccounts = createAsyncThunk(
  "accounts/fetchPendingOrders",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/accounts/orders/pending", {
        withCredentials: true,
      });
      return res.data.data; // returning orders list
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch orders");
    }
  }
);

// ✅ 2. Fetch payments for a specific order
export const fetchOrderPayments = createAsyncThunk(
  "accounts/fetchOrderPayments",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/api/accounts/orders/${orderId}/payments`, {
        withCredentials: true,
      });
      return { orderId, payments: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch payments");
    }
  }
);

// ✅ 3. Forward order to Operations
export const forwardToOperations = createAsyncThunk(
  "accounts/forwardToOperations",
  async ({ order_id, remarks, assigned_to }, { rejectWithValue }) => {
    try {
      const res = await axios.post(
        "/api/accounts/orders/forward",
        { order_id, remarks, assigned_to },
        { withCredentials: true }
      );
      return { order_id, message: res.data.message };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to forward order");
    }
  }
);

const accountsSlice = createSlice({
  name: "accounts",
  initialState: {
    pendingOrders: [],
    paymentsByOrder: {}, // { orderId: [payments] }
    loading: false,
    success: null,
    error: null,
  },
  reducers: {
    clearMessages: (state) => {
      state.success = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ Pending Orders
      .addCase(fetchPendingOrdersForAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingOrdersForAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingOrders = action.payload;
      })
      .addCase(fetchPendingOrdersForAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ✅ Payments
      .addCase(fetchOrderPayments.fulfilled, (state, action) => {
        const { orderId, payments } = action.payload;
        state.paymentsByOrder[orderId] = payments;
      })
      .addCase(fetchOrderPayments.rejected, (state, action) => {
        state.error = action.payload;
      })

      // ✅ Forward to Operations
      .addCase(forwardToOperations.pending, (state) => {
        state.loading = true;
      })
      .addCase(forwardToOperations.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload.message;
        // remove forwarded order from pendingOrders
        state.pendingOrders = state.pendingOrders.filter(
          (o) => o.id !== action.payload.order_id
        );
      })
      .addCase(forwardToOperations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMessages } = accountsSlice.actions;
export default accountsSlice.reducer;
