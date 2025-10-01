import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// Fetch all deliverables with customer & service info
export const fetchAllDeliverables = createAsyncThunk(
  "deliverables/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/operations/upload/all/deliverable");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Error fetching deliverables");
    }
  }
);

// Fetch deliverables for a specific order
export const fetchDeliverablesForOrder = createAsyncThunk(
  "deliverables/fetchByOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/operations/upload/deliverable/${orderId}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Error fetching deliverables");
    }
  }
);

const operationDeliverablesSlice = createSlice({
  name: "deliverables",
  initialState: {
    allDeliverables: [],
    orderDeliverables: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearDeliverablesError: (state) => {
      state.error = null;
    },
    resetDeliverables: (state) => {
      state.allDeliverables = [];
      state.orderDeliverables = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllDeliverables.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllDeliverables.fulfilled, (state, action) => {
        state.loading = false;
        state.allDeliverables = action.payload;
      })
      .addCase(fetchAllDeliverables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchDeliverablesForOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeliverablesForOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orderDeliverables = action.payload;
      })
      .addCase(fetchDeliverablesForOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDeliverablesError, resetDeliverables } = operationDeliverablesSlice.actions;
export default operationDeliverablesSlice.reducer;
