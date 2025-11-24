// src/store/slices/accountsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// ✅ 1. Fetch pending orders
export const fetchPendingOrdersForAccounts = createAsyncThunk(
  "accounts/fetchPendingOrders",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/accounts/orders/pending");
      return res.data.data; // returning orders list
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch orders"
      );
    }
  }
);

// ✅ 2. Fetch payments for a specific order
export const fetchOrderPayments = createAsyncThunk(
  "accounts/fetchOrderPayments",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/accounts/orders/${orderId}/payments`
      );
      return { orderId, payments: res.data.data };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch payments"
      );
    }
  }
);

// ✅ 3. Forward order to Operations
export const forwardToOperations = createAsyncThunk(
  "accounts/forwardToOperations",
  async ({ order_id, remarks, assigned_to }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/accounts/orders/forward", {
        order_id,
        remarks,
        assigned_to,
      });
      return { order_id, message: res.data.message };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to forward order"
      );
    }
  }
);

// ✅ 4. Get last operation user for this order
export const getOperationUsersForDropdown = createAsyncThunk(
  "accounts/getOperationUsersForDropdown",
  async (order_id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/accounts/operation-users", {
        params: { order_id },   // ✅ SEND AS QUERY PARAM
      });

      return res.data.data; // last operation user id
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch operation users"
      );
    }
  }
);



const accountsSlice = createSlice({
  name: "accounts",
  initialState: {
    pendingOrders: [],
    paymentsByOrder: {},
    lastOperationUserId: null,
    loadingOrders: false,
    loadingPayments: false,
    loadingForward: false,
    success: null,
    error: null,
  },
  reducers: {
    clearMessages: (state) => {
      state.success = null;
      state.error = null;
    },
    resetAccountsState: (state) => {
      state.pendingOrders = [];
      state.paymentsByOrder = {};
      state.loadingOrders = false;
      state.loadingPayments = false;
      state.loadingForward = false;
      state.success = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ Pending Orders
      .addCase(fetchPendingOrdersForAccounts.pending, (state) => {
        state.loadingOrders = true;
        state.error = null;
      })
      .addCase(fetchPendingOrdersForAccounts.fulfilled, (state, action) => {
        state.loadingOrders = false;
        state.pendingOrders = action.payload;
      })
      .addCase(fetchPendingOrdersForAccounts.rejected, (state, action) => {
        state.loadingOrders = false;
        state.error = action.payload;
      })

      // ✅ Payments
      .addCase(fetchOrderPayments.pending, (state) => {
        state.loadingPayments = true;
        state.error = null;
      })
      .addCase(fetchOrderPayments.fulfilled, (state, action) => {
        state.loadingPayments = false;
        const { orderId, payments } = action.payload;
        state.paymentsByOrder[orderId] = payments;
      })
      .addCase(fetchOrderPayments.rejected, (state, action) => {
        state.loadingPayments = false;
        state.error = action.payload;
      })

      // ✅ Forward to Operations
      .addCase(forwardToOperations.pending, (state) => {
        state.loadingForward = true;
        state.error = null;
      })
      .addCase(forwardToOperations.fulfilled, (state, action) => {
        state.loadingForward = false;
        state.success = action.payload.message;
        // remove forwarded order from pendingOrders
        state.pendingOrders = state.pendingOrders.filter(
          (o) => o.id !== action.payload.order_id
        );
      })
      .addCase(forwardToOperations.rejected, (state, action) => {
        state.loadingForward = false;
        state.error = action.payload;
      })

      // ✅ Last Operation User Fetch
      .addCase(getOperationUsersForDropdown.pending, (state) => {
        state.error = null;
      })
      .addCase(getOperationUsersForDropdown.fulfilled, (state, action) => {
        state.lastOperationUserId = action.payload; // store the ID
      })
      .addCase(getOperationUsersForDropdown.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearMessages, resetAccountsState } = accountsSlice.actions;
export default accountsSlice.reducer;
