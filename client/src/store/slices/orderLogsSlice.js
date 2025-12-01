import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

export const fetchOrderLogsByOrderId = createAsyncThunk(
  "orderLogs/fetchByOrderId",
  async (order_id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/admin/customers/all/orders/logs/${order_id}`
      );

      // RETURN ONLY THE ARRAY
      return response.data.logs;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch order logs"
      );
    }
  }
);

const orderLogsSlice = createSlice({
  name: "orderLogs",
  initialState: {
    logs: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearOrderLogs: (state) => {
      state.logs = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderLogsByOrderId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderLogsByOrderId.fulfilled, (state, action) => {
        state.loading = false;

        // DIRECTLY STORE THE ARRAY
        state.logs = action.payload;
      })
      .addCase(fetchOrderLogsByOrderId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearOrderLogs } = orderLogsSlice.actions;
export default orderLogsSlice.reducer;
