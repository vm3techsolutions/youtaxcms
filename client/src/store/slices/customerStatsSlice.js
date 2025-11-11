import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// ✅ Fetch Customer Stats
export const fetchCustomerStats = createAsyncThunk(
  "customerStats/fetchCustomerStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/user/stats"); // verifyToken handles auth
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to fetch stats" });
    }
  }
);

const customerStatsSlice = createSlice({
  name: "customerStats",
  initialState: {
    loading: false,
    stats: null,
    error: null,
  },
  reducers: {
    clearStats: (state) => {
      state.stats = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchCustomerStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to load stats";
      });
  },
});

export const { clearStats } = customerStatsSlice.actions;
export default customerStatsSlice.reducer;
