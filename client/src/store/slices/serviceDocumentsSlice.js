"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// --------------------- Async Thunks ---------------------

export const createServiceDocument = createAsyncThunk(
  "serviceDocuments/create",
  async (docData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axiosInstance.post("/service-documents", docData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create service document");
    }
  }
);

export const fetchDocumentsByService = createAsyncThunk(
  "serviceDocuments/fetchByService",
  async (serviceId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/service-documents/service/${serviceId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch documents");
    }
  }
);

export const fetchDocumentById = createAsyncThunk(
  "serviceDocuments/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/service-documents/${id}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch document");
    }
  }
);

export const updateServiceDocument = createAsyncThunk(
  "serviceDocuments/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axiosInstance.put(`/service-documents/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to update document");
    }
  }
);

export const deleteServiceDocument = createAsyncThunk(
  "serviceDocuments/delete",
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axiosInstance.delete(`/service-documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { id, message: res.data.message };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to delete document");
    }
  }
);

// --------------------- Slice ---------------------

const initialState = {
  serviceDocuments: [],
  document: null,
  loading: false,
  success: false,
  error: null,
};

const serviceDocumentsSlice = createSlice({
  name: "serviceDocuments",
  initialState,
  reducers: {
    resetSuccess: (state) => {
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create document
      .addCase(createServiceDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createServiceDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.serviceDocuments.push(action.payload);
      })
      .addCase(createServiceDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch documents by service
      .addCase(fetchDocumentsByService.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocumentsByService.fulfilled, (state, action) => {
        state.loading = false;
        state.serviceDocuments = action.payload;
      })
      .addCase(fetchDocumentsByService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch single document
      .addCase(fetchDocumentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocumentById.fulfilled, (state, action) => {
        state.loading = false;
        state.document = action.payload;
      })
      .addCase(fetchDocumentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update document
      .addCase(updateServiceDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateServiceDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.serviceDocuments.findIndex((d) => d.id === action.meta.arg.id);
        if (index !== -1) state.serviceDocuments[index] = { ...state.serviceDocuments[index], ...action.meta.arg.data };
      })
      .addCase(updateServiceDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete document
      .addCase(deleteServiceDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteServiceDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.serviceDocuments = state.serviceDocuments.filter((d) => d.id !== action.payload.id);
      })
      .addCase(deleteServiceDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetSuccess } = serviceDocumentsSlice.actions;
export default serviceDocumentsSlice.reducer;
