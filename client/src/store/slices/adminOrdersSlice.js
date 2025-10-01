// store/slices/adminOrdersSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance"; // ✅ use your configured axios instance

// =======================
// Async Thunks
// =======================
export const fetchAssignedOrders = createAsyncThunk(
  "adminOrders/fetchAssignedOrders",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/admin/orders/all");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error fetching orders");
    }
  }
);

export const fetchDeliverables = createAsyncThunk(
  "adminOrders/fetchDeliverables",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/admin/orders/deliverables/${orderId}`);
      return { orderId, deliverables: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error fetching deliverables");
    }
  }
);

export const fetchApprovedDeliverables = createAsyncThunk(
  "adminOrders/fetchApprovedDeliverables",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/admin/orders/approved/${orderId}`);
      return { orderId, deliverables: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error fetching approved deliverables");
    }
  }
);

export const qcDeliverable = createAsyncThunk(
  "adminOrders/qcDeliverable",
  async ({ deliverable_id, qc_status, remarks }, { rejectWithValue }) => {
    try {
      await axiosInstance.put(`/admin/orders/qc-deliverable`, {
        deliverable_id,
        qc_status,
        remarks,
      });
      return { deliverable_id, qc_status };
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error updating deliverable");
    }
  }
);

export const approveOrderCompletion = createAsyncThunk(
  "adminOrders/approveOrderCompletion",
  async ({ order_id, remarks }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(`/admin/orders/approve-completion`, {
        order_id,
        remarks,
      });
      return { order_id, message: res.data.message };
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error approving order");
    }
  }
);

// =======================
// Slice
// =======================
const adminOrdersSlice = createSlice({
  name: "adminOrders",
  initialState: {
    orders: [],
    deliverables: {}, // orderId -> deliverables[]
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Orders
      .addCase(fetchAssignedOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAssignedOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchAssignedOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Deliverables
      .addCase(fetchDeliverables.fulfilled, (state, action) => {
        state.deliverables[action.payload.orderId] = action.payload.deliverables;
      })
      .addCase(fetchApprovedDeliverables.fulfilled, (state, action) => {
        state.deliverables[action.payload.orderId] = action.payload.deliverables;
      })

      // QC Deliverable
      .addCase(qcDeliverable.fulfilled, (state, action) => {
        state.successMessage = `Deliverable ${action.payload.qc_status}`;
        Object.values(state.deliverables).forEach((list) => {
          const index = list.findIndex((d) => d.id === action.payload.deliverable_id);
          if (index > -1) {
            list[index].qc_status = action.payload.qc_status;
          }
        });
      })
      .addCase(qcDeliverable.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Approve Order Completion
      .addCase(approveOrderCompletion.fulfilled, (state, action) => {
        state.successMessage = action.payload.message;
        const order = state.orders.find((o) => o.id === action.payload.order_id);
        if (order) order.status = "completed";
      })
      .addCase(approveOrderCompletion.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearMessages } = adminOrdersSlice.actions;
export default adminOrdersSlice.reducer;
