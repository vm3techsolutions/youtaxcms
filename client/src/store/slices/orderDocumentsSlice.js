"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

// ========================
// Async Thunks
// ========================

// Upload order documents
export const uploadOrderDocuments = createAsyncThunk(
  "orderDocuments/upload",
  async ({ order_id, service_doc_id, files }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const formData = new FormData();
      formData.append("order_id", order_id);
      formData.append("service_doc_id", service_doc_id);
      files.forEach((file) => formData.append("files", file));

      const res = await axiosInstance.post("/upload/order-document", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      return res.data; // { message, files: [{id, file_url, signed_url}] }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to upload documents");
    }
  }
);

// Fetch order documents
export const fetchOrderDocuments = createAsyncThunk(
  "orderDocuments/fetch",
  async (order_id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await axiosInstance.get(`/order-documents/${order_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data; // Array of documents
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch documents");
    }
  }
);

// ========================
// Slice
// ========================
const initialState = {
  documents: [],
  loadingUpload: false,
  loadingFetch: false,
  error: null,
  successUpload: false,
};

const orderDocumentsSlice = createSlice({
  name: "orderDocuments",
  initialState,
  reducers: {
    resetOrderDocumentsState: (state) => {
      state.documents = [];
      state.loadingUpload = false;
      state.loadingFetch = false;
      state.error = null;
      state.successUpload = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload Documents
      .addCase(uploadOrderDocuments.pending, (state) => {
        state.loadingUpload = true;
        state.error = null;
        state.successUpload = false;
      })
      .addCase(uploadOrderDocuments.fulfilled, (state, action) => {
        state.loadingUpload = false;
        state.successUpload = true;
        state.documents = action.payload.files;
      })
      .addCase(uploadOrderDocuments.rejected, (state, action) => {
        state.loadingUpload = false;
        state.error = action.payload;
      })

      // Fetch Documents
      .addCase(fetchOrderDocuments.pending, (state) => {
        state.loadingFetch = true;
        state.error = null;
      })
      .addCase(fetchOrderDocuments.fulfilled, (state, action) => {
        state.loadingFetch = false;
        state.documents = action.payload;
      })
      .addCase(fetchOrderDocuments.rejected, (state, action) => {
        state.loadingFetch = false;
        state.error = action.payload;
      });
  },
});

export const { resetOrderDocumentsState } = orderDocumentsSlice.actions;
export default orderDocumentsSlice.reducer;
