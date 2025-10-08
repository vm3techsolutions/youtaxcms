"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// Helper to safely get token
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

// ➤ Create Service
export const createService = createAsyncThunk(
  "services/create",
  async (serviceData, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axiosInstance.post("/services", serviceData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data; // { message, id }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create service");
    }
  }
);

// ➤ Fetch All Services
export const fetchServices = createAsyncThunk(
  "services/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/services");
      return res.data; // array of services
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch services");
    }
  }
);

// ➤ Fetch Service by ID
export const fetchServiceById = createAsyncThunk(
  "services/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/services/${id}`);
      return res.data; // single service
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch service");
    }
  }
);

// ➤ Update Service
export const updateService = createAsyncThunk(
  "services/update",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const token = getToken();
      const res = await axiosInstance.put(`/service/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { id, ...updates, message: res.data.message };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update service");
    }
  }
);

// ➤ Delete Service
export const deleteService = createAsyncThunk(
  "services/delete",
  async (id, { rejectWithValue }) => {
    try {
      const token = getToken();
      await axiosInstance.delete(`/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return id; // return deleted service id
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete service");
    }
  }
);

const initialState = {
  services: [],
  currentService: null,
  loading: false,
  error: null,
  success: false,
};

const servicesSlice = createSlice({
  name: "services",
  initialState,
  reducers: {
    resetSuccess: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create
      .addCase(createService.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Push new service optimistically if needed
        state.services.push({ id: action.payload.id, ...action.meta.arg });
      })
      .addCase(createService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch All
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch By ID
      .addCase(fetchServiceById.fulfilled, (state, action) => {
        state.currentService = action.payload;
      })

      // Update
      .addCase(updateService.fulfilled, (state, action) => {
        state.success = true;
        state.services = state.services.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload } : s
        );
      })

      // Delete
      .addCase(deleteService.fulfilled, (state, action) => {
        state.success = true;
        state.services = state.services.filter((s) => s.id !== action.payload);
      });
  },
});

export const { resetSuccess } = servicesSlice.actions;
export default servicesSlice.reducer;
