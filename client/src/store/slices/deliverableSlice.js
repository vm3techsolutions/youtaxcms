import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// ============================
// Fetch Deliverables by Customer ID
// ============================
export const fetchDeliverablesByCustomer = createAsyncThunk(
  "deliverables/fetchByCustomer",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/download/deliverables`);
      return res.data.data; // backend returns { success, data: [...] }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Error fetching deliverables");
    }
  }
);

const deliverableSlice = createSlice({
  name: "deliverables",
  initialState: {
    deliverables: [],
    loading: false,
    error: null,
  },
  reducers: {
    resetDeliverables: (state) => {
      state.deliverables = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeliverablesByCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeliverablesByCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.deliverables = action.payload;
      })
      .addCase(fetchDeliverablesByCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetDeliverables } = deliverableSlice.actions;
export default deliverableSlice.reducer;
