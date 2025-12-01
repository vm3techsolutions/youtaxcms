import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/api/axiosInstance";  // ✅ Correct axios instance import

// 1️⃣ Upload operation document
export const uploadOperationDocument = createAsyncThunk(
  "operationDocuments/upload",
  async ({ order_id, remarks, file }, thunkAPI) => {
    try {
      const formData = new FormData();
      formData.append("order_id", order_id);
      formData.append("remarks", remarks || "");
      formData.append("file", file);

      const res = await axiosInstance.post(
        "/operations/document/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      return res.data.data; // ensure consistent structure
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Upload failed"
      );
    }
  }
);

// 2️⃣ Get documents by order ID
export const getDocumentsByOrderId = createAsyncThunk(
  "operationDocuments/getByOrderId",
  async (order_id, thunkAPI) => {
    try {
      const res = await axiosInstance.get(
        `/operations/document/byOrderId/${order_id}`
      );
      return res.data.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Unable to fetch documents"
      );
    }
  }
);

// 3️⃣ Get single document by ID
export const getDocumentById = createAsyncThunk(
  "operationDocuments/getById",
  async (id, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/operations/document/byId/${id}`);
      return res.data.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Unable to fetch document"
      );
    }
  }
);

// 4️⃣ Delete document (soft delete)
export const deleteOperationDocument = createAsyncThunk(
  "operationDocuments/delete",
  async (id, thunkAPI) => {
    try {
      await axiosInstance.delete(`/operations/document/delete/${id}`);
      return { id };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Delete failed"
      );
    }
  }
);

const operationDocumentsSlice = createSlice({
  name: "operationDocuments",
  initialState: {
    documents: [],
    currentDocument: null,
    loading: false,
    error: null,
    success: null,
  },
  reducers: {
    clearOperationDocMessages: (state) => {
      state.error = null;
      state.success = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // 🔵 Upload
      .addCase(uploadOperationDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(uploadOperationDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.success = "Document uploaded successfully.";

        if (action.payload) {
          state.documents.unshift(action.payload);
        }
      })
      .addCase(uploadOperationDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // 📄 Get documents by order
      .addCase(getDocumentsByOrderId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDocumentsByOrderId.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload;
      })
      .addCase(getDocumentsByOrderId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ❌ Delete
      .addCase(deleteOperationDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter(
          (doc) => doc.id !== action.payload.id
        );
        state.success = "Document deleted successfully.";
      })
      .addCase(deleteOperationDocument.rejected, (state, action) => {
        state.error = action.payload;
      })

      // 📝 Get Single Document
      .addCase(getDocumentById.fulfilled, (state, action) => {
        state.currentDocument = action.payload;
      });
  },
});

export const { clearOperationDocMessages } = operationDocumentsSlice.actions;

export default operationDocumentsSlice.reducer;
