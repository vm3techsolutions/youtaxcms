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
      // Backend returns { message, id }
      return { ...docData, id: res.data.id }; // include ID from backend
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create service document");
    }
  }
);

// Fetch all documents by service
export const fetchDocumentsByService = createAsyncThunk(
  "serviceDocuments/fetchByService",
  async (serviceId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/service-documents/service/${serviceId}`);
      return { serviceId, documents: Array.isArray(res.data) ? res.data : [] };
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
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch document"
      );
    }
  }
);

export const updateServiceDocument = createAsyncThunk(
  "serviceDocuments/update",
  async ({ id, data, serviceId }, { rejectWithValue }) => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axiosInstance.put(`/service-documents/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { updatedDoc: res.data, serviceId, id };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update document"
      );
    }
  }
);

export const deleteServiceDocument = createAsyncThunk(
  "serviceDocuments/delete",
  async ({ id, serviceId }, { rejectWithValue }) => {
    try {
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axiosInstance.delete(`/service-documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { id, serviceId, message: res.data.message };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to delete document"
      );
    }
  }
);

// --------------------- Slice ---------------------

const initialState = {
  serviceDocuments: {}, // { [serviceId]: [document, ...] }
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
        const doc = action.payload;
        const serviceId = doc.service_id;
        if (!state.serviceDocuments[serviceId]) state.serviceDocuments[serviceId] = [];
        state.serviceDocuments[serviceId].push(doc);
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
        state.serviceDocuments[action.payload.serviceId] =
          action.payload.documents;
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
        const { serviceId, id, updatedDoc } = action.payload;
        if (state.serviceDocuments[serviceId]) {
          const index = state.serviceDocuments[serviceId].findIndex(
            (d) => d.id === id
          );
          if (index !== -1) state.serviceDocuments[serviceId][index] = updatedDoc;
        }
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
        const { serviceId, id } = action.payload;
        if (state.serviceDocuments[serviceId]) {
          state.serviceDocuments[serviceId] = state.serviceDocuments[
            serviceId
          ].filter((d) => d.id !== id);
        }
      })
      .addCase(deleteServiceDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetSuccess } = serviceDocumentsSlice.actions;
export default serviceDocumentsSlice.reducer;
