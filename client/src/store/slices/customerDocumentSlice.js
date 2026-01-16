// src/store/slices/customerDocumentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";

/* ===========================
   ASYNC THUNKS
=========================== */

// Upload document
export const uploadCustomerDocument = createAsyncThunk(
  "customerDocuments/upload",
  async ({ file, order_id, doc_month, doc_year, file_name }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("order_id", order_id);
      formData.append("doc_month", doc_month);
      formData.append("doc_year", doc_year);
      formData.append("file_name", file_name);

      const { data } = await axiosInstance.post(
        "/upload/customer-document",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      return data.file;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Upload failed");
    }
  }
);

// Get documents by order
export const fetchCustomerDocumentsByOrder = createAsyncThunk(
  "customerDocuments/fetchByOrder",
  async (order_id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/customer-documents/order/${order_id}`
      );
      return data.data;
    } catch {
      return rejectWithValue("Failed to fetch documents");
    }
  }
);

// Get single document
export const fetchCustomerDocumentById = createAsyncThunk(
  "customerDocuments/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/customer-document/${id}`);
      return data.data;
    } catch {
      return rejectWithValue("Document not found");
    }
  }
);

// Replace document
export const replaceCustomerDocument = createAsyncThunk(
  "customerDocuments/replace",
  async ({ id, file, file_name }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (file_name) formData.append("file_name", file_name);

      const { data } = await axiosInstance.put(
        `/customer-document/replace/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      return data.file;
    } catch {
      return rejectWithValue("Replace failed");
    }
  }
);

// Update status (Operation role)
export const updateCustomerDocumentStatus = createAsyncThunk(
  "customerDocuments/updateStatus",
  async ({ id, status, operation_remark }, { rejectWithValue }) => {
    try {
      await axiosInstance.put(`/customer-document/status/${id}`, {
        status,
        operation_remark,
      });
      return { id, status, operation_remark };
    } catch {
      return rejectWithValue("Status update failed");
    }
  }
);

// Admin – fetch all documents
export const fetchAllCustomerDocuments = createAsyncThunk(
  "customerDocuments/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/customer-documents/all");
      return data.data;
    } catch {
      return rejectWithValue("Failed to fetch documents");
    }
  }
);

/* ===========================
   SLICE
=========================== */

const customerDocumentSlice = createSlice({
  name: "customerDocuments",
  initialState: {
    documents: [],
    currentDocument: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCustomerDocumentError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload
      .addCase(uploadCustomerDocument.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadCustomerDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.documents.unshift(action.payload);
      })
      .addCase(uploadCustomerDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch by order
      .addCase(fetchCustomerDocumentsByOrder.fulfilled, (state, action) => {
        state.documents = action.payload;
      })

      // Fetch single
      .addCase(fetchCustomerDocumentById.fulfilled, (state, action) => {
        state.currentDocument = action.payload;
      })

      // Replace
      .addCase(replaceCustomerDocument.fulfilled, (state, action) => {
        state.documents = state.documents.map((doc) =>
          doc.id === action.payload.id ? action.payload : doc
        );
      })

      // Update status
      .addCase(updateCustomerDocumentStatus.fulfilled, (state, action) => {
        const doc = state.documents.find(d => d.id === action.payload.id);
        if (doc) {
          doc.status = action.payload.status;
          doc.operation_remark = action.payload.operation_remark;
        }
      })

      // Admin fetch
      .addCase(fetchAllCustomerDocuments.fulfilled, (state, action) => {
        state.documents = action.payload;
      });
  },
});

export const { clearCustomerDocumentError } = customerDocumentSlice.actions;
export default customerDocumentSlice.reducer;
