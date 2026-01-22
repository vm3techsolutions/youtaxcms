// src/redux/slices/serviceBundleSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";

/* ============================
   Thunks
============================ */

/**
 * Create Service Bundle
 */
export const createServiceBundle = createAsyncThunk(
  "serviceBundles/create",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        "/admin/service-bundles",
        payload
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create bundle"
      );
    }
  }
);

/**
 * Get All Service Bundles (Admin)
 */
export const fetchAllServiceBundles = createAsyncThunk(
  "serviceBundles/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/admin/service-bundles");
      // ✅ normalize response
      return Array.isArray(data)
        ? data
        : data.data || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch bundles"
      );
    }
  }
);

/**
 * Get Bundles by Primary Service ID
 */
export const fetchBundlesByPrimaryService = createAsyncThunk(
  "serviceBundles/fetchByPrimary",
  async (primaryServiceId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/admin/service-bundles/primary/${primaryServiceId}`
      );
      return {
        primaryServiceId,
        bundles: data.data || [],
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch bundles"
      );
    }
  }
);

/**
 * Toggle Bundle Status
 */
export const toggleServiceBundleStatus = createAsyncThunk(
  "serviceBundles/toggleStatus",
  async ({ id, is_active }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(
        `/admin/service-bundles/toggle-status/${id}`,
        { is_active }
      );
      return { id, is_active, message: data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update status"
      );
    }
  }
);

/* ============================
   Slice
============================ */

const serviceBundleSlice = createSlice({
  name: "serviceBundles",
  initialState: {
    bundles: [],
    primaryBundles: {},
    loading: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearServiceBundleState: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* Create */
      .addCase(createServiceBundle.pending, (state) => {
        state.loading = true;
      })
      .addCase(createServiceBundle.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(createServiceBundle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* Fetch All */
      .addCase(fetchAllServiceBundles.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllServiceBundles.fulfilled, (state, action) => {
        state.loading = false;
        state.bundles = action.payload;
      })
      .addCase(fetchAllServiceBundles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* Fetch By Primary */
      .addCase(fetchBundlesByPrimaryService.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBundlesByPrimaryService.fulfilled, (state, action) => {
        state.loading = false;
        const { primaryServiceId, bundles } = action.payload;
        state.primaryBundles[primaryServiceId] = bundles;
      })
      .addCase(fetchBundlesByPrimaryService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* Toggle Status */
      .addCase(toggleServiceBundleStatus.fulfilled, (state, action) => {
        state.bundles = state.bundles.map((bundle) =>
          bundle.id === action.payload.id
            ? { ...bundle, is_active: action.payload.is_active }
            : bundle
        );
        state.successMessage = action.payload.message;
      })
      .addCase(toggleServiceBundleStatus.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearServiceBundleState } = serviceBundleSlice.actions;
export default serviceBundleSlice.reducer;