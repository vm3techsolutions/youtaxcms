import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance"; 

// --- Async Thunks ---

// Get single user by ID
export const fetchUserById = createAsyncThunk(
  "adminCustomer/fetchUserById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/admin/customer/${id}`);
      return res.data.user; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch user");
    }
  }
);

// Get all users
export const fetchAllUsers = createAsyncThunk(
  "adminCustomer/fetchAllUsers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/admin/customers`);
      return res.data.users;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch users");
    }
  }
);

// Get all orders
export const fetchAllOrders = createAsyncThunk(
  "adminCustomer/fetchAllOrders",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/admin/customers/all/orders`);
      return res.data.orders;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch orders");
    }
  }
);

// Get orders by service id
export const fetchOrdersByServiceId = createAsyncThunk(
  "adminCustomer/fetchOrdersByServiceId",
  async (serviceId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/admin/customers/all/orders/service/${serviceId}`);
      return res.data.orders;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch service orders");
    }
  }
);

// Get all order logs
export const fetchAllOrderLogs = createAsyncThunk(
  "adminCustomer/fetchAllOrderLogs",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/admin/customers/all/orders/logs`);
      return res.data.logs;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch order logs");
    }
  }
);

// Get order logs by order ID
export const fetchOrderLogsByOrderId = createAsyncThunk(
  "adminCustomer/fetchOrderLogsByOrderId",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/admin/customers/all/orders/logs/${orderId}`);
      return res.data.logs;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch order logs by ID");
    }
  }
);

// --- Slice Definition ---

const adminCustomerSlice = createSlice({
  name: "adminCustomer",
  initialState: {
    users: [],
    user: null,
    orders: [],
    logs: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearAdminCustomerError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch user by ID ---
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch all users ---
      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch all orders ---
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch orders by service id ---
      .addCase(fetchOrdersByServiceId.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrdersByServiceId.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrdersByServiceId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch all order logs ---
      .addCase(fetchAllOrderLogs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllOrderLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload;
      })
      .addCase(fetchAllOrderLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Fetch order logs by order ID ---
      .addCase(fetchOrderLogsByOrderId.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrderLogsByOrderId.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload;
      })
      .addCase(fetchOrderLogsByOrderId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminCustomerError } = adminCustomerSlice.actions;
export default adminCustomerSlice.reducer;
