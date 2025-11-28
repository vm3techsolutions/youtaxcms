import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// Fetch Sales Dashboard Stats
export const fetchSalesStats = createAsyncThunk(
  "salesStats/fetchSalesStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/sales/dashboard/stats");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { message: "Failed to fetch sales stats" });
    }
  }
);

const salesStatsSlice = createSlice({
  name: "salesStats",
  initialState: {
    loading: false,
    stats: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchSalesStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to load sales stats";
      });
  },
});

export default salesStatsSlice.reducer;
