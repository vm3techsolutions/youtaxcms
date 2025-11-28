import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// Fetch Admin Dashboard Stats
export const fetchAdminStats = createAsyncThunk(
  "adminStats/fetchAdminStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/admin/dashboard/stats");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Failed to fetch admin stats" }
      );
    }
  }
);

const adminStatsSlice = createSlice({
  name: "adminStats",
  initialState: {
    loading: false,
    stats: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to load admin stats";
      });
  },
});

export default adminStatsSlice.reducer;
