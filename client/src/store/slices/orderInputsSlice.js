import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// ============================================================
// Fetch all inputs for an order
// ============================================================
export const fetchOrderInputs = createAsyncThunk(
  "orderInputs/fetchOrderInputs",
  async (orderId, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/order-inputs/order/${orderId}`);
      return res.data;
    } catch (err) {
      console.error("❌ fetchOrderInputs Error:", err.response?.data);
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ============================================================
// Submit or update order inputs
// ============================================================
export const submitOrderInputs = createAsyncThunk(
  "orderInputs/submitOrderInputs",
  async ({ order_id, inputs }, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/order-input", { order_id, inputs });
      return res.data;
    } catch (err) {
      console.error("❌ submitOrderInputs Error:", err.response?.data);
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ============================================================
// Slice
// ============================================================
const orderInputsSlice = createSlice({
  name: "orderInputs",
  initialState: {
    items: [],
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    resetOrderInputsState: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Order Inputs
    builder
      .addCase(fetchOrderInputs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderInputs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchOrderInputs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Submit Order Inputs
    builder
      .addCase(submitOrderInputs.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(submitOrderInputs.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(submitOrderInputs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetOrderInputsState } = orderInputsSlice.actions;
export default orderInputsSlice.reducer;
