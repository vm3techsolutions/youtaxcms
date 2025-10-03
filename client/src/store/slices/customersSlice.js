// store/slices/customersSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// =======================
// Async Thunks
// =======================
export const fetchAllCustomers = createAsyncThunk(
  "customers/fetchAllCustomers",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/admin/customers");
      return res.data.users; // array of customers
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error fetching customers");
    }
  }
);

export const fetchCustomerById = createAsyncThunk(
  "customers/fetchCustomerById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/admin/customer/${id}`);
      return res.data.user; // single customer object
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error fetching customer");
    }
  }
);

// =======================
// Slice
// =======================
const customersSlice = createSlice({
  name: "customers",
  initialState: {
    customers: [], // all customers
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchAllCustomers
      .addCase(fetchAllCustomers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchAllCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchCustomerById
      .addCase(fetchCustomerById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCustomerById.fulfilled, (state, action) => {
        state.loading = false;
        // Add or update the customer in the list
        const index = state.customers.findIndex(c => c.id === action.payload.id);
        if (index > -1) {
          state.customers[index] = action.payload;
        } else {
          state.customers.push(action.payload);
        }
      })
      .addCase(fetchCustomerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default customersSlice.reducer;
