import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// Fetch Operations Dashboard Stats
export const fetchOperationsStats = createAsyncThunk(
  "operationsStats/fetchOperationsStats",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/operations/dashboard/stats");
      return res.data.data; 
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: "Failed to fetch operations stats" }
      );
    }
  }
);

const operationsStatsSlice = createSlice({
  name: "operationsStats",
  initialState: {
    loading: false,
    stats: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOperationsStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOperationsStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchOperationsStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || "Failed to load operations stats";
      });
  },
});

export default operationsStatsSlice.reducer;
