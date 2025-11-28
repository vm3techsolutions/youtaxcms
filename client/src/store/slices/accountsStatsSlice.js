import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// Fetch Accounts Dashboard Stats
export const fetchAccountsStats = createAsyncThunk(
  "accountsStats/fetchAccountsStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/accounts/dashboard/stats");
      return res.data.data; // only the stats object
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Failed to fetch accounts stats" }
      );
    }
  }
);

const accountsStatsSlice = createSlice({
  name: "accountsStats",
  initialState: {
    loading: false,
    stats: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccountsStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccountsStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAccountsStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to load accounts stats";
      });
  },
});

export default accountsStatsSlice.reducer;
